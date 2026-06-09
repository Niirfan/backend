from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel
import uuid
import logging

from backend.database import get_db
from backend.models.request import MaterialReq, MaterialReqDetail, MaterialReserved, ReqStatus, ReservedStatus, MaterialHistory
from backend.schemas.request import RequestCreate, RequestResponse, RemoveItemsBody
from backend.login.dependencies import get_current_user
from backend.models.material import Material, MaterialStock
from backend.models.users import User
from backend.utils.line_notify import send_line_message_to_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/requests", tags=["Material Requests"])



# ---------------------------------------------------------
# 1. สร้างใบเบิกวัสดุใหม่
# ---------------------------------------------------------
@router.post("/", response_model=RequestResponse)
def create_material_request(
    request_data: RequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = db.query(User).filter(User.emp_code == current_user["emp_code"]).first()
    if not user or not user.can_request:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์เบิกวัสดุ กรุณาติดต่อ Admin")

    if not request_data.items or len(request_data.items) == 0:
        raise HTTPException(status_code=400, detail="กรุณาระบุรายการวัสดุที่ต้องการเบิก")

    mat_ids = [item.mat_id for item in request_data.items]
    if len(mat_ids) != len(set(mat_ids)):
        raise HTTPException(status_code=400, detail="มีวัสดุซ้ำในใบเบิก กรุณารวมเป็นรายการเดียว")

    for item in request_data.items:
        if item.req_qty <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"จำนวนที่เบิก (req_qty) ต้องมากกว่า 0 (mat_id: {item.mat_id})"
            )

    materials = {
        m.mat_id: m for m in
        db.query(Material)
        .filter(Material.mat_id.in_(mat_ids), Material.is_active == True)
        .all()
    }

    stocks = {
        s.mat_id: s for s in
        db.query(MaterialStock)
        .filter(MaterialStock.mat_id.in_(mat_ids))
        .with_for_update()
        .all()
    }

    reserved = dict(
        db.query(
            MaterialReserved.mat_id,
            func.coalesce(func.sum(MaterialReserved.quantity), 0)
        )
        .filter(
            MaterialReserved.mat_id.in_(mat_ids),
            MaterialReserved.status.in_([ReservedStatus.RESERVED, ReservedStatus.APPROVED])
        )
        .group_by(MaterialReserved.mat_id)
        .all()
    )

    for item in request_data.items:
        material = materials.get(item.mat_id)
        if not material:
            raise HTTPException(
                status_code=400,
                detail=f"ไม่พบวัสดุ mat_id: {item.mat_id} หรือวัสดุนี้ถูกปิดใช้งานแล้ว"
            )

        stock_qty = stocks[item.mat_id].quantity if item.mat_id in stocks else 0
        already_reserved = reserved.get(item.mat_id, 0)
        available = stock_qty - already_reserved

        if available < item.req_qty:
            raise HTTPException(
                status_code=400,
                detail=f"สต็อกไม่เพียงพอ: {material.mat_name} (มี {available}, ขอ {item.req_qty})"
            )

    unique_req_code = f"REQ-{str(uuid.uuid4())[:8].upper()}"

    total_price = sum(
        float(stocks[item.mat_id].unit_price or 0) * item.req_qty
        for item in request_data.items
        if item.mat_id in stocks
    )

    new_request = MaterialReq(
        mat_req_code=unique_req_code,
        user_id=current_user["emp_code"],
        req_status=ReqStatus.PENDING,
        total_price=total_price,
        req_date=datetime.now(timezone.utc)
    )

    db.add(new_request)
    db.flush()

    try:
        for item in request_data.items:
            db.add(MaterialReqDetail(
                mat_req_id=new_request.mat_req_id,
                mat_id=item.mat_id,
                req_qty=item.req_qty,
                approve_qty=0
            ))

            db.add(MaterialReserved(
                req_id=new_request.mat_req_id,
                mat_id=item.mat_id,
                quantity=item.req_qty,
                status=ReservedStatus.RESERVED
            ))

        admins = db.query(User).filter(
            User.user_role == "Admin",
            User.is_active == True,
            User.line_user_id != None
        ).all()
        logger.info("Found %d admins with LINE", len(admins))
        for admin in admins:
            background_tasks.add_task(
                send_line_message_to_user,
                admin.line_user_id,
                f"📋 ใบเบิกใหม่\n"
                f"จาก: {user.full_name}\n"
                f"เลขที่: {unique_req_code}"
            )
        db.commit()
        db.refresh(new_request)
        return new_request

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Failed to create_material_request")
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดภายในระบบ")


# ---------------------------------------------------------
# 2. ดูรายการใบเบิกของตัวเอง + Pagination
# ---------------------------------------------------------
@router.get("/mine")
def get_my_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    items_count_sub = db.query(
        MaterialReqDetail.mat_req_id,
        func.count(MaterialReqDetail.detail_id).label("cnt")
    ).group_by(MaterialReqDetail.mat_req_id).subquery()

    query = db.query(MaterialReq, User, items_count_sub.c.cnt)\
        .join(User, MaterialReq.user_id == User.emp_code)\
        .outerjoin(items_count_sub, MaterialReq.mat_req_id == items_count_sub.c.mat_req_id)\
        .filter(MaterialReq.user_id == current_user["emp_code"])

    if status:
        status_upper = status.upper()
        valid_statuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "ISSUED"]
        if status_upper not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"สถานะไม่ถูกต้อง ใช้ได้: {', '.join(valid_statuses)}")
        query = query.filter(MaterialReq.req_status == status_upper)

    total = query.count()
    offset = (page - 1) * limit
    results = query.order_by(MaterialReq.req_date.desc()).offset(offset).limit(limit).all()

    return {
        "items": [
            {
                "mat_req_id": req.mat_req_id,
                "mat_req_code": req.mat_req_code,
                "user_id": req.user_id,
                "full_name": user.full_name,
                "req_date": req.req_date,
                "req_status": req.req_status,
                "total_price": req.total_price,
                "items_count": cnt or 0,
                "admin_note": req.admin_note,
            }
            for req, user, cnt in results
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

# ---------------------------------------------------------
# 3. ดูรายละเอียดใบเบิก
# ---------------------------------------------------------
@router.get("/{req_id}")
def get_request_detail(
    req_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = db.query(MaterialReq, User)\
        .join(User, MaterialReq.user_id == User.emp_code)\
        .filter(MaterialReq.mat_req_id == req_id)\
        .first()

    if not result:
        raise HTTPException(status_code=404, detail="ไม่พบใบเบิกนี้")

    req, user = result

    if req.user_id != current_user["emp_code"] and current_user.get("role") not in ["Admin", "Superadmin"]:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์ดูใบเบิกของผู้อื่น")

    details_query = db.query(MaterialReqDetail, Material)\
    .join(Material, MaterialReqDetail.mat_id == Material.mat_id)\
        .filter(MaterialReqDetail.mat_req_id == req_id)

    if req.req_status != ReqStatus.PENDING:
        details_query = details_query.filter(MaterialReqDetail.approve_qty > 0)

    details = details_query.all()
    
    items = [
        {
            "detail_id": detail.detail_id,
            "mat_id": detail.mat_id,
            "mat_name": material.mat_name,
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
            "full_name": user.full_name,
            "req_date": req.req_date,
            "req_status": req.req_status,
            "total_price": req.total_price,
        },
        "items": items
    }


# ---------------------------------------------------------
# 4. ยกเลิกใบเบิก
# ---------------------------------------------------------
@router.post("/{req_id}/cancel")
def cancel_request(
    req_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    req = db.query(MaterialReq).filter(MaterialReq.mat_req_id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="ไม่พบใบเบิกนี้")

    if req.user_id != current_user["emp_code"]:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์ยกเลิกใบเบิกของผู้อื่น")

    cancellable = [ReqStatus.PENDING, ReqStatus.APPROVED]
    if req.req_status not in cancellable:
        raise HTTPException(
            status_code=400,
            detail=f"ไม่สามารถยกเลิกใบเบิกที่มีสถานะ {req.req_status.value} ได้"
        )

    reserved_items = db.query(MaterialReserved).filter(
        MaterialReserved.req_id == req_id,
        MaterialReserved.status.in_([ReservedStatus.RESERVED, ReservedStatus.APPROVED])
    ).with_for_update().all()

    try:
        for item in reserved_items:
            item.status = ReservedStatus.RELEASED

        req.req_status = ReqStatus.CANCELLED
        db.commit()
        return {"message": "ยกเลิกใบเบิกเรียบร้อย", "req_code": req.mat_req_code}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Failed to cancel_request req_id=%s", req_id)
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดภายในระบบ")


# ---------------------------------------------------------
# 5. ลบบางรายการออกจากใบเบิก (PENDING เท่านั้น)
# ---------------------------------------------------------
@router.patch("/{req_id}/items")
def remove_request_items(
    req_id: int,
    body: RemoveItemsBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    req = db.query(MaterialReq).filter(MaterialReq.mat_req_id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="ไม่พบใบเบิกนี้")

    if req.user_id != current_user["emp_code"]:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์แก้ไขใบเบิกของผู้อื่น")

    if req.req_status != ReqStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"ไม่สามารถแก้ไขใบเบิกที่มีสถานะ {req.req_status.value} ได้"
        )

    if not body.remove_ids:
        raise HTTPException(status_code=400, detail="กรุณาระบุรายการที่ต้องการลบ")

    all_details = db.query(MaterialReqDetail)\
        .filter(MaterialReqDetail.mat_req_id == req_id)\
        .all()

    all_mat_ids = {d.mat_id for d in all_details}

    invalid_ids = set(body.remove_ids) - all_mat_ids
    if invalid_ids:
        raise HTTPException(
            status_code=400,
            detail=f"ไม่พบรายการเหล่านี้ในใบเบิก: {', '.join(str(i) for i in invalid_ids)}"
        )

    remaining_ids = all_mat_ids - set(body.remove_ids)
    if len(remaining_ids) == 0:
        raise HTTPException(
            status_code=400,
            detail="ไม่สามารถลบรายการทั้งหมดได้ ต้องเหลืออย่างน้อย 1 รายการ (ถ้าต้องการยกเลิกทั้งหมด ใช้ปุ่มยกเลิกใบเบิกแทน)"
        )

    try:
        for detail in all_details:
            if detail.mat_id not in body.remove_ids:
                continue

            reserved = db.query(MaterialReserved).filter(
                MaterialReserved.req_id == req_id,
                MaterialReserved.mat_id == detail.mat_id,
                MaterialReserved.status.in_([ReservedStatus.RESERVED, ReservedStatus.APPROVED])
            ).with_for_update().all()

            for r in reserved:
                r.status = ReservedStatus.RELEASED

            db.delete(detail)

        remaining_details = [d for d in all_details if d.mat_id not in body.remove_ids]
        mat_ids_remaining = [d.mat_id for d in remaining_details]

        stocks = {
            s.mat_id: s for s in
            db.query(MaterialStock)
            .filter(MaterialStock.mat_id.in_(mat_ids_remaining))
            .all()
        }
        new_total = sum(
            float(stocks[d.mat_id].unit_price or 0) * d.req_qty
            for d in remaining_details
            if d.mat_id in stocks
        )
        req.total_price = new_total

        db.commit()
        return {
            "message": f"ลบ {len(body.remove_ids)} รายการเรียบร้อยแล้ว",
            "removed_count": len(body.remove_ids),
            "remaining_count": len(remaining_ids),
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Failed to remove_request_items req_id=%s", req_id)
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดภายในระบบ")