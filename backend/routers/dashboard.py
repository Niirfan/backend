from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, distinct
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

from backend.database import get_db
from backend.models.material import Material, MaterialStock
from backend.models.request import (
    MaterialReq, MaterialIssue, MaterialReserved,
    ReqStatus, ReservedStatus,
)
from backend.login.dependencies import verify_admin
from backend.config import THAI_MONTHS
from backend.services.report_service import get_inventory_value, get_top_materials

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(
    db:         Session = Depends(get_db),
    admin_user: dict    = Depends(verify_admin),
):
    now = datetime.now(timezone.utc)

    # ใช้ service เดียวกับ report
    inventory   = get_inventory_value(db=db)
    total_value = inventory["grand_total"]

    pending = db.query(MaterialReq).filter(
        MaterialReq.req_status == ReqStatus.PENDING
    ).count()

    approved_this_month = (
    db.query(func.count(distinct(MaterialReq.mat_req_id)))
    .join(MaterialIssue, MaterialIssue.mat_req_id == MaterialReq.mat_req_id)
    .filter(
        MaterialReq.req_status == ReqStatus.ISSUED,
        extract("month", MaterialIssue.issue_date) == now.month,
        extract("year",  MaterialIssue.issue_date) == now.year,
    )
    .scalar()
) or 0

    reserved_sub = (
        db.query(
            MaterialReserved.mat_id,
            func.sum(MaterialReserved.quantity).label("reserved_qty"),
        )
        .filter(MaterialReserved.status.in_([ReservedStatus.RESERVED, ReservedStatus.APPROVED]))
        .group_by(MaterialReserved.mat_id)
        .subquery()
    )

    available_expr = (
        func.coalesce(MaterialStock.quantity, 0) -
        func.coalesce(reserved_sub.c.reserved_qty, 0)
    )

    low_stock = (
        db.query(Material)
        .join(MaterialStock, Material.mat_id == MaterialStock.mat_id)
        .outerjoin(reserved_sub, Material.mat_id == reserved_sub.c.mat_id)
        .filter(
            Material.is_active == True,
            available_expr <= Material.min_qty,
        )
        .count()
    )

    rejected = db.query(MaterialReq).filter(
        MaterialReq.req_status == ReqStatus.REJECTED
    ).count()

    total_equipment = db.query(Material).filter(
        Material.is_active == True
    ).count()

    return {
        "total_inventory_value": total_value,
        "pending_requests":      pending,
        "approved_this_month":   approved_this_month,
        "low_stock_count":       low_stock,
        "rejected_requests":     rejected,
        "total_equipment":       total_equipment,
    }


@router.get("/withdrawal-graph")
def get_withdrawal_graph(
    db:         Session = Depends(get_db),
    admin_user: dict    = Depends(verify_admin),
):
    now            = datetime.now(timezone.utc)
    six_months_ago = now - relativedelta(months=6)

    results = (
        db.query(
            extract("year",  MaterialIssue.issue_date).label("year"),
            extract("month", MaterialIssue.issue_date).label("month"),
            func.count(distinct(MaterialReq.mat_req_id)).label("count"),  # ← แก้ตรงนี้
        )
        .join(MaterialReq, MaterialReq.mat_req_id == MaterialIssue.mat_req_id)
        .filter(
            MaterialReq.req_status == ReqStatus.ISSUED,
            MaterialIssue.issue_date >= six_months_ago,
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    result_map = {(int(r.year), int(r.month)): r.count for r in results}

    return [
        {
            "month": THAI_MONTHS[(now - relativedelta(months=i)).month],
            "value": result_map.get(
                ((now - relativedelta(months=i)).year,
                 (now - relativedelta(months=i)).month), 0
            ),
        }
        for i in range(5, -1, -1)
    ]


@router.get("/top-materials")
def get_top_materials_dashboard(
    limit:      int     = Query(default=5, ge=1, le=20),
    db:         Session = Depends(get_db),
    admin_user: dict    = Depends(verify_admin),
):
    now   = datetime.now(timezone.utc)
    items = get_top_materials(db=db, limit=limit, year=now.year)

    # คง response shape เดิมที่ frontend ใช้อยู่
    return [
        {
            "id":    i["mat_code"],
            "name":  i["mat_name"],
            "total": i["total_qty"],
        }
        for i in items
    ]