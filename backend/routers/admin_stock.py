import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from backend.database import get_db
from backend.models.material import Material, MaterialStock
from backend.models.request import MaterialReserved, MaterialHistory, ReservedStatus
from backend.models.users import User
from backend.login.dependencies import verify_admin
from backend.schemas.stock import StockReceive, StockAdjust

router = APIRouter(prefix="/admin/stock", tags=["Admin Stock"])
logger = logging.getLogger(__name__)


@router.post("/receive")
def receive_stock(
    data: StockReceive,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """รับวัสดุเข้าคลัง"""
    mat_id = data.mat_id
    quantity = data.quantity
    unit_price = data.unit_price

    mat = db.query(Material).filter(Material.mat_id == mat_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="ไม่พบวัสดุนี้")

    if quantity <= 0:
        raise HTTPException(status_code=400, detail="จำนวนต้องมากกว่า 0")
    if unit_price < 0:
        raise HTTPException(status_code=400, detail="ราคาต้องไม่ติดลบ")

    stock = db.query(MaterialStock)\
        .filter(MaterialStock.mat_id == mat_id)\
        .filter(MaterialStock.is_active == True)\
        .first()

    if stock:
        if stock.unit_price == unit_price:
            stock.quantity += quantity
            balance_after = stock.quantity
        else:
            stock.is_active = False
            new_stock = MaterialStock(
                mat_id=mat_id,
                quantity=quantity,
                unit_price=unit_price,
                import_date=datetime.now(timezone.utc),
                is_active=True
            )
            db.add(new_stock)
            balance_after = quantity
    else:
        stock = MaterialStock(
            mat_id=mat_id,
            quantity=quantity,
            unit_price=unit_price,
            import_date=datetime.now(timezone.utc),
            is_active=True
        )
        db.add(stock)
        balance_after = quantity

    try:
        db.flush()
        last_history = db.query(MaterialHistory)\
            .filter(MaterialHistory.mat_id == mat_id)\
            .order_by(MaterialHistory.created_at.desc())\
            .first()
        if last_history:
            last_history.emp_code = admin_user["emp_code"]
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to receive_stock mat_id=%s", mat_id)
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการรับวัสดุ")

    return {
        "message": "✅ รับวัสดุเข้าคลังเรียบร้อย",
        "mat_id": mat_id,
        "mat_name": mat.mat_name,
        "quantity_added": quantity,
        "balance_after": balance_after
    }


@router.patch("/{mat_id}/stock")
def adjust_stock(
    mat_id: int,
    body: StockAdjust,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """ปรับสต็อกด้วยมือ"""
    mat = db.query(Material).filter(Material.mat_id == mat_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="ไม่พบวัสดุนี้")

    stock = db.query(MaterialStock).filter(MaterialStock.mat_id == mat_id).with_for_update().first()

    if body.mode == "set":
        if body.quantity < 0:
            raise HTTPException(status_code=400, detail="จำนวนต้องไม่ติดลบ")
        if stock:
            stock.quantity = body.quantity
        else:
            db.add(MaterialStock(mat_id=mat_id, quantity=body.quantity))

    elif body.mode == "add":
        current_qty = stock.quantity if stock else 0
        new_qty = current_qty + body.quantity
        if new_qty < 0:
            raise HTTPException(status_code=400, detail=f"สต็อกไม่เพียงพอ (มี {current_qty}, ลด {abs(body.quantity)})")
        if stock:
            stock.quantity = new_qty
        else:
            db.add(MaterialStock(mat_id=mat_id, quantity=new_qty))

    else:
        raise HTTPException(status_code=400, detail="mode ต้องเป็น 'add' หรือ 'set' เท่านั้น")

    db.flush()

    last_history = db.query(MaterialHistory)\
        .filter(MaterialHistory.mat_id == mat_id)\
        .order_by(MaterialHistory.created_at.desc())\
        .first()
    if last_history:
        last_history.emp_code = admin_user["emp_code"]

    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to adjust_stock mat_id=%s", mat_id)
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการปรับสต็อก")

    return {"message": "อัปเดตสต็อกสำเร็จ"}


@router.get("/overview")
def stock_overview(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """ดูภาพรวมสต็อกทั้งหมด"""
    reserved_sub = db.query(
        MaterialReserved.mat_id,
        func.sum(MaterialReserved.quantity).label("reserved_qty")
    ).filter(MaterialReserved.status.in_([ReservedStatus.RESERVED, ReservedStatus.APPROVED]))\
        .group_by(MaterialReserved.mat_id)\
        .subquery()

    results = db.query(Material, MaterialStock, reserved_sub.c.reserved_qty)\
        .outerjoin(MaterialStock, Material.mat_id == MaterialStock.mat_id)\
        .outerjoin(reserved_sub, Material.mat_id == reserved_sub.c.mat_id)\
        .filter(Material.is_active == True)\
        .order_by(Material.mat_name)\
        .all()

    return [
        {
            "mat_id": mat.mat_id,
            "mat_code": mat.mat_code,
            "mat_name": mat.mat_name,
            "stock_qty": stock.quantity if stock else 0,
            "reserved_qty": int(reserved_qty) if reserved_qty else 0,
            "available_qty": (stock.quantity if stock else 0) - (int(reserved_qty) if reserved_qty else 0),
            "min_qty": mat.min_qty,
        }
        for mat, stock, reserved_qty in results
    ]


@router.get("/low-stock")
def low_stock_alert(
    threshold: int = Query(default=None),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """แสดงวัสดุที่สต็อกใกล้หมด"""
    reserved_sub = db.query(
        MaterialReserved.mat_id,
        func.sum(MaterialReserved.quantity).label("reserved_qty")
    ).filter(MaterialReserved.status.in_([ReservedStatus.RESERVED, ReservedStatus.APPROVED]))\
        .group_by(MaterialReserved.mat_id)\
        .subquery()

    available_expr = (
        func.coalesce(MaterialStock.quantity, 0) -
        func.coalesce(reserved_sub.c.reserved_qty, 0)
    )

    limit_expr = func.coalesce(threshold, Material.min_qty)

    results = db.query(
        Material, MaterialStock, reserved_sub.c.reserved_qty,
        available_expr.label("available_qty")
    )\
        .outerjoin(MaterialStock, Material.mat_id == MaterialStock.mat_id)\
        .outerjoin(reserved_sub, Material.mat_id == reserved_sub.c.mat_id)\
        .filter(Material.is_active == True)\
        .filter(available_expr <= limit_expr)\
        .order_by(available_expr.asc())\
        .all()

    return [
        {
            "mat_id": mat.mat_id,
            "mat_code": mat.mat_code,
            "mat_name": mat.mat_name,
            "stock_qty": stock.quantity if stock else 0,
            "reserved_qty": int(reserved_qty) if reserved_qty else 0,
            "available_qty": int(available_qty),
            "min_qty": mat.min_qty,
        }
        for mat, stock, reserved_qty, available_qty in results
    ]


@router.get("/history")
def stock_history(
    mat_id: int = Query(default=None),
    action_type: str = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """ประวัติการทำรายการ"""
    ALLOWED_REF_TABLES = ["material_stock", "material_issue"]

    query = db.query(MaterialHistory, Material)\
        .join(Material, MaterialHistory.mat_id == Material.mat_id)\
        .filter(MaterialHistory.ref_table.in_(ALLOWED_REF_TABLES))

    if mat_id:
        query = query.filter(MaterialHistory.mat_id == mat_id)
    if action_type:
        query = query.filter(MaterialHistory.action_type == action_type.upper())

    results = query.order_by(MaterialHistory.created_at.desc())\
        .limit(limit)\
        .all()

    return [
        {
            "history_id": h.history_id,
            "mat_id": h.mat_id,
            "mat_name": mat.mat_name,
            "action_type": h.action_type,
            "quantity": h.quantity,
            "balance_after": h.balance_after,
            "ref_table": h.ref_table,
            "ref_id": h.ref_id,
            "created_at": h.created_at,
            "emp_code": h.emp_code,
        }
        for h, mat in results
    ]