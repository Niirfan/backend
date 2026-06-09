from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.database import get_db
from backend.models.material import Material
from backend.models.request import MaterialReq, MaterialReqDetail, MaterialIssue, ReqStatus
from backend.models.users import User
from backend.login.dependencies import verify_admin
from backend.services.report_service import (
    get_inventory_value,
    get_top_materials,
    get_monthly_summary,
    get_by_user,
)

router = APIRouter(prefix="/admin/report", tags=["Admin Report"])


@router.get("/monthly")
def report_monthly(
    year:      Optional[int] = Query(default=None),
    branch_id: Optional[str] = Query(default=None),
    db:        Session = Depends(get_db),
    admin_user: dict   = Depends(verify_admin),
):
    return get_monthly_summary(db=db, year=year, branch_id=branch_id)


@router.get("/monthly-detail")
def report_monthly_detail(
    year:      int           = Query(..., ge=2000, le=2100),
    month:     int           = Query(..., ge=1, le=12),
    branch_id: Optional[str] = Query(default=None),
    db:        Session = Depends(get_db),
    admin_user: dict   = Depends(verify_admin),
):
    from sqlalchemy import extract

    query = (
        db.query(MaterialReq, User)
        .join(User, MaterialReq.user_id == User.emp_code)
        .join(MaterialIssue, MaterialIssue.mat_req_id == MaterialReq.mat_req_id)  # ← เพิ่ม
        .filter(
            MaterialReq.req_status == ReqStatus.ISSUED,
            extract("year",  MaterialIssue.issue_date) == year,   # ← เปลี่ยน
            extract("month", MaterialIssue.issue_date) == month,  # ← เปลี่ยน
        )
    )

    if branch_id:
        query = query.filter(User.branch_id == branch_id)

    results = query.order_by(MaterialReq.req_date.desc()).all()

    if not results:
        return {"year": year, "month": month, "total": 0, "requests": []}

    req_ids = [req.mat_req_id for req, _ in results]

    details_all = (
        db.query(MaterialReqDetail, Material)
        .join(Material, MaterialReqDetail.mat_id == Material.mat_id)
        .filter(
            MaterialReqDetail.mat_req_id.in_(req_ids),
            MaterialReqDetail.approve_qty > 0,
        )
        .order_by(MaterialReqDetail.mat_req_id, Material.mat_code)
        .all()
    )

    details_map: dict[int, list[dict]] = {rid: [] for rid in req_ids}
    for detail, mat in details_all:
        details_map[detail.mat_req_id].append({
            "mat_code":    mat.mat_code,
            "mat_name":    mat.mat_name,
            "req_qty":     detail.req_qty,
            "approve_qty": detail.approve_qty,
            "unit":        mat.unit_sub,
        })

    requests_out = [
        {
            "mat_req_id":   req.mat_req_id,
            "mat_req_code": req.mat_req_code,
            "req_date":     req.req_date.isoformat(),
            "emp_code":     user.emp_code,
            "full_name":    user.full_name,
            "branch_id":    user.branch_id,
            "items":        details_map.get(req.mat_req_id, []),
            "items_count":  len(details_map.get(req.mat_req_id, [])),
        }
        for req, user in results
    ]

    return {
        "year":     year,
        "month":    month,
        "total":    len(requests_out),
        "requests": requests_out,
    }


@router.get("/top-materials")
def report_top_materials(
    limit:     int           = Query(default=10, ge=1, le=50),
    year:      Optional[int] = Query(default=None),
    branch_id: Optional[str] = Query(default=None),
    db:        Session = Depends(get_db),
    admin_user: dict   = Depends(verify_admin),
):
    return get_top_materials(db=db, limit=limit, year=year, branch_id=branch_id)


@router.get("/inventory-value")
def report_inventory_value(
    db:        Session = Depends(get_db),
    admin_user: dict   = Depends(verify_admin),
):
    return get_inventory_value(db=db)


@router.get("/by-user")
def report_by_user(
    year:      Optional[int] = Query(default=None),
    branch_id: Optional[str] = Query(default=None),
    db:        Session = Depends(get_db),
    admin_user: dict   = Depends(verify_admin),
):
    return get_by_user(db=db, year=year, branch_id=branch_id)


@router.get("/by-user/{emp_code}/requests")
def get_user_requests(
    emp_code: str,
    year:     Optional[int] = Query(default=None),
    db:       Session = Depends(get_db),
    admin_user: dict  = Depends(verify_admin),
):
    from sqlalchemy import extract

    user = db.query(User).filter(User.emp_code == emp_code).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบพนักงานรหัส {emp_code}")

    query = db.query(MaterialReq).filter(
        MaterialReq.user_id == emp_code,
        MaterialReq.req_status.in_([ReqStatus.ISSUED, ReqStatus.REJECTED]),
    )

    if year:
        query = query.filter(extract("year", MaterialReq.req_date) == year)

    requests = query.order_by(MaterialReq.req_date.desc()).all()

    if not requests:
        return []

    req_ids = [r.mat_req_id for r in requests]

    details = (
        db.query(MaterialReqDetail, Material)
        .join(Material, MaterialReqDetail.mat_id == Material.mat_id)
        .filter(MaterialReqDetail.mat_req_id.in_(req_ids))
        .all()
    )

    items_map: dict[int, list[dict]] = {}
    for detail, material in details:
        items_map.setdefault(detail.mat_req_id, []).append({
            "mat_name":    material.mat_name,
            "req_qty":     detail.req_qty,
            "approve_qty": detail.approve_qty,
            "unit":        material.unit_sub,
        })

    return [
        {
            "mat_req_id":   r.mat_req_id,
            "mat_req_code": r.mat_req_code,
            "req_date":     r.req_date.isoformat(),
            "req_status":   r.req_status,
            "items":        items_map.get(r.mat_req_id, []),
        }
        for r in requests
    ]