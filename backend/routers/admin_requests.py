from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks   
from fastapi.responses import StreamingResponse
from typing import Optional
from math import ceil
from sqlalchemy.orm import Session
import io
import logging

from backend.database import get_db
from backend.models.users import User
from backend.models.material import MaterialStock, Material
from backend.models.request import MaterialReq, MaterialReqDetail, MaterialReserved, MaterialIssue, MaterialHistory, ReqStatus, ReservedStatus, IssueStatus
from backend.login.dependencies import verify_admin, get_current_user 
from backend.utils.pdf_generator import build_request_pdf
from backend.schemas.request import ApproveRequest, RejectRequest
from sqlalchemy import func
from backend.utils.line_notify import send_line_message_to_user
from datetime import datetime, timezone 

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/requests", tags=["Admin Approvals"])

@router.get("/pending")
def get_pending_requests(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    results = db.query(MaterialReq, User)\
        .join(User, MaterialReq.user_id == User.emp_code)\
        .filter(MaterialReq.req_status == ReqStatus.PENDING)\
        .order_by(MaterialReq.req_date.asc())\
        .all()

    return [
        {
            "mat_req_id": req.mat_req_id,
            "mat_req_code": req.mat_req_code,
            "user_id": req.user_id,
            "full_name": user.full_name,
            "req_date": req.req_date,
            "req_status": req.req_status,
        }
        for req, user in results
    ]

@router.get("/all")
def get_all_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000),
    all_items: bool = Query(False),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    items_count_sub = db.query(
        MaterialReqDetail.mat_req_id,
        func.count(MaterialReqDetail.detail_id).label("cnt")
    ).group_by(MaterialReqDetail.mat_req_id).subquery()

    query = db.query(MaterialReq, User, items_count_sub.c.cnt)\
        .join(User, MaterialReq.user_id == User.emp_code)\
        .outerjoin(
            items_count_sub,
            MaterialReq.mat_req_id == items_count_sub.c.mat_req_id
        )

    if status:
        status_upper = status.upper()
        valid_statuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "ISSUED"]

        if status_upper not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"สถานะไม่ถูกต้อง ใช้ได้: {', '.join(valid_statuses)}"
            )

        query = query.filter(MaterialReq.req_status == status_upper)

    total = query.count()

    query = query.order_by(MaterialReq.req_date.desc())

    if all_items:
        results = query.all()
        total_pages = 1
        current_page = 1
    else:
        results = query\
            .offset((page - 1) * limit)\
            .limit(limit)\
            .all()

        total_pages = ceil(total / limit) if total > 0 else 1
        current_page = page

    return {
        "items": [
            {
                "mat_req_id": req.mat_req_id,
                "mat_req_code": req.mat_req_code,
                "user_id": req.user_id,
                "full_name": user.full_name,
                "req_date": req.req_date,
                "req_status": req.req_status,
                "items_count": cnt or 0,
            }
            for req, user, cnt in results
        ],
        "total": total,
        "page": current_page,
        "limit": None if all_items else limit,
        "total_pages": total_pages,
    }

@router.get("/{mat_req_id}/pdf")
def export_request_pdf(
    mat_req_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(MaterialReq).filter(MaterialReq.mat_req_id == mat_req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="ไม่พบใบเบิก")
    if req.req_status != ReqStatus.APPROVED:
        raise HTTPException(status_code=400, detail="ดาวน์โหลดได้เฉพาะใบเบิกที่อนุมัติแล้ว")

    if req.user_id != current_user["emp_code"] and current_user["role"] not in ["Admin", "Superadmin"]:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์ดาวน์โหลดใบเบิกของผู้อื่น")

    user = db.query(User).filter(User.emp_code == req.user_id).first()

    details = db.query(MaterialReqDetail, Material)\
        .join(Material, MaterialReqDetail.mat_id == Material.mat_id)\
        .filter(MaterialReqDetail.mat_req_id == mat_req_id).all()

    items = [
        {
            "mat_id": d.mat_id,
            "mat_name": m.mat_name,
            "unit": m.unit_sub,
            "req_qty": d.req_qty,
            "approve_qty": d.approve_qty,
        }
        for d, m in details
    ]

    pdf_bytes = build_request_pdf(
        req={
            "mat_req_code": req.mat_req_code,
            "req_date": req.req_date,
            "user_id": req.user_id,
        },
        user_fullname=user.full_name if user else "-",
        items=items
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="req_{req.mat_req_code}.pdf"'},
    )

@router.get("/{mat_req_id}")
def get_request_detail_admin(
    mat_req_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    req = db.query(MaterialReq).filter(MaterialReq.mat_req_id == mat_req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="ไม่พบใบเบิก")

    user = db.query(User).filter(User.emp_code == req.user_id).first()

    details = db.query(MaterialReqDetail, Material)\
        .join(Material, MaterialReqDetail.mat_id == Material.mat_id)\
        .filter(MaterialReqDetail.mat_req_id == mat_req_id)\
        .all()

    items = [
        {
            "mat_id": detail.mat_id,
            "mat_name": material.mat_name,
            "unit": material.unit_sub,
            "req_qty": detail.req_qty,
            "approve_qty": detail.approve_qty,
        }
        for detail, material in details
    ]

    return {
        "header": {
            "mat_req_id": req.mat_req_id,
            "mat_req_code": req.mat_req_code,
            "user_id": req.user_id,
            "full_name": user.full_name if user else "-",
            "req_date": req.req_date,
            "req_status": req.req_status,
            "total_price": req.total_price,
            "admin_note": req.admin_note,
        },
        "items": items
    }

@router.post("/{mat_req_id}/approve")
def approve_request(
    mat_req_id: int,
    body: ApproveRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    req = db.query(MaterialReq).filter(MaterialReq.mat_req_id == mat_req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="ไม่พบใบเบิก")
    if req.req_status != ReqStatus.PENDING:
        raise HTTPException(status_code=400, detail="ใบเบิกนี้ถูกดำเนินการไปแล้ว")

    details = db.query(MaterialReqDetail)\
        .filter(MaterialReqDetail.mat_req_id == mat_req_id).all()

    mat_ids    = [d.mat_id for d in details]
    approve_map = {i.mat_id: i.approve_qty for i in body.items}
    mats       = {m.mat_id: m for m in db.query(Material).filter(Material.mat_id.in_(mat_ids)).all()}

    for detail in details:
        qty = approve_map.get(detail.mat_id)
        if qty is None:
            raise HTTPException(400, detail=f"ไม่พบ approve_qty สำหรับ mat_id={detail.mat_id}")
        if not (0 <= qty <= detail.req_qty):
            raise HTTPException(400, detail=f"approve_qty ต้องอยู่ระหว่าง 0 ถึง {detail.req_qty}")

    try:
        req.req_status  = ReqStatus.APPROVED
        req.approved_at = datetime.now(timezone.utc)
        req.admin_note  = body.admin_note

        for detail in details:
            qty            = approve_map[detail.mat_id]
            detail.approve_qty = qty

            existing = db.query(MaterialReserved).filter(
                MaterialReserved.req_id  == mat_req_id,
                MaterialReserved.mat_id  == detail.mat_id,
                MaterialReserved.status  == ReservedStatus.RESERVED,
            ).first()

            if existing:
                if qty == 0:
                    existing.status = ReservedStatus.CANCELLED
                else:
                    existing.quantity = qty
                    existing.status   = ReservedStatus.APPROVED
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"ไม่พบ reserved สำหรับ mat_id={detail.mat_id} กรุณาตรวจสอบใบเบิก"
                )

        # ── คำนวณ total_price ──────────────────────────────────────────
        req.total_price = sum(
            (approve_map[d.mat_id] or 0) * float(mats[d.mat_id].price_per_pack or 0)
            for d in details
            if d.mat_id in mats
        )
        # ───────────────────────────────────────────────────────────────

        user = db.query(User).filter(User.emp_code == req.user_id).first()
        if user and user.line_user_id:
            note_text = f"\nหมายเหตุ: {body.admin_note}" if body.admin_note else ""
            background_tasks.add_task(
                send_line_message_to_user,
                user.line_user_id,
                f"✅ ใบเบิกได้รับการอนุมัติ\n"
                f"เลขที่: {req.mat_req_code}\n"
                f"รอรับของที่คลังได้เลยครับ{note_text}"
            )
        db.commit()
        return {
            "message": "✅ อนุมัติเรียบร้อย รอเจ้าหน้าที่คลังเบิกจ่าย",
            "req_code": req.mat_req_code
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Failed to approve_request mat_req_id=%s", mat_req_id)
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดภายในระบบ")

@router.post("/{mat_req_id}/issue")
def issue_request(
    mat_req_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    admin = db.query(User).filter(User.emp_code == admin_user["emp_code"]).first()
    if not admin:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลผู้ใช้งาน")

    req = db.query(MaterialReq).filter(MaterialReq.mat_req_id == mat_req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="ไม่พบใบเบิก")
    if req.req_status != ReqStatus.APPROVED:
        raise HTTPException(status_code=400, detail="ใบเบิกนี้ยังไม่ได้รับการอนุมัติ")

    already_issued = db.query(MaterialIssue).filter(
        MaterialIssue.mat_req_id == mat_req_id
    ).first()
    if already_issued:
        raise HTTPException(status_code=400, detail="ใบเบิกนี้ถูกเบิกจ่ายไปแล้ว")

    details = db.query(MaterialReqDetail)\
        .filter(MaterialReqDetail.mat_req_id == mat_req_id).all()

    mat_ids = [d.mat_id for d in details]
    stocks = {
        s.mat_id: s for s in
        db.query(MaterialStock)
        .filter(MaterialStock.mat_id.in_(mat_ids))
        .with_for_update()
        .all()
    }
    mats = {
        m.mat_id: m for m in
        db.query(Material).filter(Material.mat_id.in_(mat_ids)).all()
    }

    other_reserved = dict(
        db.query(
            MaterialReserved.mat_id,
            func.coalesce(func.sum(MaterialReserved.quantity), 0)
        )
        .filter(
            MaterialReserved.mat_id.in_(mat_ids),
            MaterialReserved.req_id != mat_req_id,
            MaterialReserved.status.in_([ReservedStatus.RESERVED, ReservedStatus.APPROVED])
        )
        .group_by(MaterialReserved.mat_id)
        .all()
    )

    for detail in details:
        stock = stocks.get(detail.mat_id)
        current_qty = stock.quantity if stock else 0
        reserved = other_reserved.get(detail.mat_id, 0)
        available = current_qty - reserved
        approve_qty = detail.approve_qty or 0

        if available < approve_qty:
            mat = mats.get(detail.mat_id)
            raise HTTPException(
                status_code=400,
                detail=f"สต็อกไม่เพียงพอสำหรับจ่าย: {mat.mat_name if mat else detail.mat_id} "
                       f"(มี {available}, ต้องจ่าย {approve_qty})"
            )

    try:
        req.req_status = ReqStatus.ISSUED
        req.issued_at = datetime.now(timezone.utc)

        # ✅ stock ถูกตัดโดย DB trigger อัตโนมัติเมื่อ MaterialIssue ถูก insert
        for detail in details:
            if not detail.approve_qty or detail.approve_qty <= 0:
                continue  # ข้ามรายการที่ approve_qty เป็น 0 หรือ None
            db.add(MaterialIssue(
                mat_id=detail.mat_id,
                quantity=detail.approve_qty,
                issued_by=admin.user_id,
                mat_req_id=mat_req_id,
                status=IssueStatus.ISSUED
                ))
        reserved_items = db.query(MaterialReserved).filter(
            MaterialReserved.req_id == mat_req_id
        ).all()
        for r in reserved_items:
            r.status = ReservedStatus.ISSUED

        db.flush()

        for detail in details:
            last_history = db.query(MaterialHistory)\
                .filter(
                    MaterialHistory.mat_id == detail.mat_id,
                    MaterialHistory.ref_table == "material_issue",
                    MaterialHistory.ref_id == mat_req_id
                ).first()
            if last_history:
                last_history.emp_code = admin_user["emp_code"]

        user = db.query(User).filter(User.emp_code == req.user_id).first()
        if user and user.line_user_id:
            background_tasks.add_task(
                send_line_message_to_user,
                user.line_user_id,
                f"📦 เบิกจ่ายเรียบร้อย\n"
                f"เลขที่: {req.mat_req_code}\n"
                f"สามารถมารับของได้เลยครับ"
            )
        db.commit()
        return {
            "message": "✅ เบิกจ่ายเรียบร้อย ตัด stock สำเร็จ",
            "req_code": req.mat_req_code
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Failed to issue_request mat_req_id=%s", mat_req_id)
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดภายในระบบ")

@router.post("/{mat_req_id}/reject")
def reject_request(
    mat_req_id: int,
    body: RejectRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    req = db.query(MaterialReq).filter(MaterialReq.mat_req_id == mat_req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="ไม่พบใบเบิก")
    if req.req_status != ReqStatus.PENDING:
        raise HTTPException(status_code=400, detail="ไม่สามารถปฏิเสธได้ เพราะถูกดำเนินการไปแล้ว")

    try:
        req.req_status = ReqStatus.REJECTED
        req.rejected_at = datetime.now(timezone.utc)
        req.admin_note = body.admin_note

        reserved_items = db.query(MaterialReserved).filter(
            MaterialReserved.req_id == mat_req_id,
            MaterialReserved.status == ReservedStatus.RESERVED
        ).all()
        for item in reserved_items:
            item.status = ReservedStatus.CANCELLED

        user = db.query(User).filter(User.emp_code == req.user_id).first()
        if user and user.line_user_id:
            note_text = f"\nหมายเหตุ: {body.admin_note}" if body.admin_note else ""
            background_tasks.add_task(
                send_line_message_to_user,
                user.line_user_id,
                f"❌ ใบเบิกถูกปฏิเสธ\n"
                f"เลขที่: {req.mat_req_code}{note_text}"
            )
        db.commit()
        return {"message": "❌ ปฏิเสธเรียบร้อย", "req_code": req.mat_req_code}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Failed to reject_request mat_req_id=%s", mat_req_id)
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดภายในระบบ")