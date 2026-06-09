import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional
from datetime import datetime

from backend.database import get_db
from backend.models.request import MaterialReq, ReqStatus
from backend.models.users import User
from backend.schemas.branch_dashboard import (
    BranchRequestOut, BranchDashboardStats,
    BranchDashboardResponse, RequestItemOut
)
from backend.login.dependencies import get_current_user

router = APIRouter(prefix="/branch-dashboard", tags=["BranchDashboard"])
logger = logging.getLogger(__name__)


def escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _days_between(start: Optional[datetime], end: Optional[datetime]) -> Optional[float]:
    if start and end:
        return round((end - start).total_seconds() / 86400, 1)
    return None


@router.get("/requests", response_model=BranchDashboardResponse)
def get_branch_dashboard(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    branch_id = current_user["branch_id"]

    q = db.query(MaterialReq)\
        .join(User, MaterialReq.user_id == User.emp_code)\
        .filter(User.branch_id == branch_id)

    if status:
        q = q.filter(MaterialReq.req_status == status.upper())
    if search:
        s = escape_like(search)
        q = q.filter(
            MaterialReq.mat_req_code.ilike(f"%{s}%") |
            User.full_name.ilike(f"%{s}%")
        )
    if start_date:
        q = q.filter(MaterialReq.req_date >= start_date)
    if end_date:
        q = q.filter(MaterialReq.req_date <= end_date)

    total = q.count()
    rows = q.order_by(MaterialReq.req_date.desc())\
            .offset((page - 1) * per_page)\
            .limit(per_page)\
            .all()

    stats_row = db.query(
        func.count().label("total_requests"),
        func.sum(case((MaterialReq.req_status == ReqStatus.PENDING, 1), else_=0)).label("pending_count"),
        func.sum(case((MaterialReq.req_status == ReqStatus.APPROVED, 1), else_=0)).label("approved_count"),
        func.sum(case((MaterialReq.req_status == ReqStatus.REJECTED, 1), else_=0)).label("rejected_count"),
        func.sum(case((MaterialReq.req_status == ReqStatus.ISSUED, 1), else_=0)).label("issued_count"),
        func.sum(case((MaterialReq.req_status == ReqStatus.CANCELLED, 1), else_=0)).label("cancelled_count"),
        func.coalesce(func.sum(MaterialReq.total_price), 0).label("total_value"),
        func.avg(
            case((
                MaterialReq.approved_at != None,
                func.extract("epoch", MaterialReq.approved_at - MaterialReq.req_date) / 86400
            ), else_=None)
        ).label("avg_days_to_approve"),
        func.avg(
            case((
                (MaterialReq.approved_at != None) & (MaterialReq.issued_at != None),
                func.extract("epoch", MaterialReq.issued_at - MaterialReq.approved_at) / 86400
            ), else_=None)
        ).label("avg_days_to_issue"),
    ).join(User, MaterialReq.user_id == User.emp_code)\
     .filter(User.branch_id == branch_id)\
     .one()

    stats = BranchDashboardStats(
        total_requests=stats_row.total_requests or 0,
        pending_count=stats_row.pending_count or 0,
        approved_count=stats_row.approved_count or 0,
        rejected_count=stats_row.rejected_count or 0,
        issued_count=stats_row.issued_count or 0,
        cancelled_count=stats_row.cancelled_count or 0,
        total_value=float(stats_row.total_value or 0),
        avg_days_to_approve=round(float(stats_row.avg_days_to_approve), 1) if stats_row.avg_days_to_approve else None,
        avg_days_to_issue=round(float(stats_row.avg_days_to_issue), 1) if stats_row.avg_days_to_issue else None,
    )

    items_out = []
    for req in rows:
        req_items = [
            RequestItemOut(
                mat_id=d.mat_id,
                mat_name=d.material.mat_name if d.material else str(d.mat_id),
                req_qty=d.req_qty,
                approve_qty=d.approve_qty,
            )
            for d in (req.details or [])
        ]
        items_out.append(BranchRequestOut(
            mat_req_id=req.mat_req_id,
            mat_req_code=req.mat_req_code,
            requester_id=req.user_id,
            requester_name=req.user.full_name if req.user else req.user_id,
            branch_id=req.user.branch_id if req.user else branch_id,
            branch_name=req.user.branch.branch_name if req.user and req.user.branch else "",
            req_date=req.req_date,
            req_status=req.req_status,
            total_price=float(req.total_price or 0),
            admin_note=req.admin_note,
            items=req_items,
            items_count=len(req_items),
            approved_at=req.approved_at,
            rejected_at=req.rejected_at,
            issued_at=req.issued_at,
            days_to_approve=_days_between(req.req_date, req.approved_at),
            days_to_issue=_days_between(req.approved_at, req.issued_at),
        ))

    return BranchDashboardResponse(
        stats=stats,
        items=items_out,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=max(1, -(-total // per_page)),
    )