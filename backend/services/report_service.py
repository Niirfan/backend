from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

from backend.models.material import Material, MaterialStock
from backend.models.request import MaterialReq, MaterialReqDetail, MaterialIssue, ReqStatus
from backend.models.users import User
from backend.models.master import MaterialType, Branch
from backend.config import THAI_MONTHS


# ══════════════════════════════════════════════════════
#  INVENTORY VALUE  (ใช้ price_per_pack จาก Material เป็น source of truth)
# ══════════════════════════════════════════════════════
def get_inventory_value(db: Session) -> dict:
    results = (
        db.query(
            Material.mat_code,
            Material.mat_name,
            MaterialType.mat_type_name,
            Material.unit_pack,
            Material.price_per_pack,
            MaterialStock.quantity,
        )
        .join(MaterialType, Material.mat_type_id == MaterialType.mat_type_id)
        .outerjoin(MaterialStock, Material.mat_id == MaterialStock.mat_id)
        .filter(Material.is_active == True)
        .all()
    )

    items = []
    grand_total = 0.0
    for r in results:
        qty   = r.quantity or 0
        price = float(r.price_per_pack or 0)
        total = qty * price
        grand_total += total
        items.append({
            "mat_code":    r.mat_code,
            "mat_name":    r.mat_name,
            "mat_type":    r.mat_type_name,
            "unit":        r.unit_pack,
            "quantity":    qty,
            "unit_price":  price,
            "total_value": total,
        })

    items.sort(key=lambda x: x["total_value"], reverse=True)
    return {"grand_total": grand_total, "items": items}


# ══════════════════════════════════════════════════════
#  TOP MATERIALS
# ══════════════════════════════════════════════════════
def get_top_materials(
    db:        Session,
    limit:     int           = 10,
    year:      Optional[int] = None,
    branch_id: Optional[str] = None,
) -> list[dict]:
    query = (
        db.query(
            Material.mat_id,
            Material.mat_code,
            Material.mat_name,
            MaterialType.mat_type_name,
            Material.unit_pack,
            func.sum(MaterialReqDetail.approve_qty).label("total_qty"),
            func.count(MaterialReq.mat_req_id.distinct()).label("req_count"),
        )
        .join(MaterialReqDetail, MaterialReqDetail.mat_id == Material.mat_id)
        .join(MaterialReq, MaterialReq.mat_req_id == MaterialReqDetail.mat_req_id)
        .join(MaterialIssue, MaterialIssue.mat_req_id == MaterialReq.mat_req_id)
        .join(User, User.emp_code == MaterialReq.user_id)
        .join(MaterialType, Material.mat_type_id == MaterialType.mat_type_id)
        .filter(MaterialReq.req_status == ReqStatus.ISSUED)
    )

    if year:
        query = query.filter(extract("year", MaterialIssue.issue_date) == year)
    if branch_id:
        query = query.filter(User.branch_id == branch_id)

    results = (
        query
        .group_by(
            Material.mat_id, Material.mat_code, Material.mat_name,
            MaterialType.mat_type_name, Material.unit_pack,
        )
        .order_by(func.sum(MaterialReqDetail.approve_qty).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "mat_code":  r.mat_code,
            "mat_name":  r.mat_name,
            "mat_type":  r.mat_type_name,
            "unit":      r.unit_pack,
            "total_qty": int(r.total_qty) if r.total_qty else 0,
            "req_count": int(r.req_count),
        }
        for r in results
    ]


# ══════════════════════════════════════════════════════
#  MONTHLY SUMMARY
# ══════════════════════════════════════════════════════
def get_monthly_summary(
    db:        Session,
    year:      Optional[int] = None,
    branch_id: Optional[str] = None,
) -> dict:
    now         = datetime.now(timezone.utc)
    target_year = year or now.year

    query = (
        db.query(
            extract("month", MaterialIssue.issue_date).label("month"),
            func.count(MaterialReq.mat_req_id.distinct()).label("count"),
            func.coalesce(func.sum(MaterialReq.total_price), 0).label("total_price"),
        )
        .join(MaterialIssue, MaterialIssue.mat_req_id == MaterialReq.mat_req_id)
        .join(User, User.emp_code == MaterialReq.user_id)
        .filter(
            MaterialReq.req_status == ReqStatus.ISSUED,
            extract("year", MaterialIssue.issue_date) == target_year,
        )
    )

    if branch_id:
        query = query.filter(User.branch_id == branch_id)

    results    = query.group_by("month").order_by("month").all()
    result_map = {
        int(r.month): {"count": r.count, "total_price": float(r.total_price)}
        for r in results
    }

    items = [
        {
            "month":       THAI_MONTHS[m],
            "month_num":   m,
            "count":       result_map.get(m, {}).get("count", 0),
            "total_price": result_map.get(m, {}).get("total_price", 0.0),
        }
        for m in range(1, 13)
    ]

    return {"year": target_year, "branch_id": branch_id, "items": items}


# ══════════════════════════════════════════════════════
#  BY USER
# ══════════════════════════════════════════════════════
def get_by_user(
    db:        Session,
    year:      Optional[int] = None,
    branch_id: Optional[str] = None,
) -> list[dict]:
    query = (
        db.query(
            User.emp_code,
            User.full_name,
            User.branch_id,
            Branch.branch_name,
            func.count(MaterialReq.mat_req_id).label("req_count"),
            func.coalesce(func.sum(MaterialReq.total_price), 0).label("total_price"),
        )
        .join(MaterialReq, MaterialReq.user_id == User.emp_code)
        .outerjoin(Branch, Branch.branch_id == User.branch_id)
        .filter(MaterialReq.req_status == ReqStatus.ISSUED)
    )

    if year:
        query = query.filter(extract("year", MaterialReq.req_date) == year)
    if branch_id:
        query = query.filter(User.branch_id == branch_id)

    results = (
        query
        .group_by(User.emp_code, User.full_name, User.branch_id, Branch.branch_name)
        .order_by(func.count(MaterialReq.mat_req_id).desc())
        .all()
    )

    return [
        {
            "emp_code":    r.emp_code,
            "full_name":   r.full_name,
            "branch_id":   r.branch_id,
            "branch_name": r.branch_name or "-",
            "req_count":   int(r.req_count),
            "total_price": float(r.total_price),
        }
        for r in results
    ]