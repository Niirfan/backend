import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models.material import Material, MaterialStock
from backend.models.request import MaterialReserved, ReservedStatus
from backend.schemas.material import MaterialCreate, MaterialResponse, MaterialUpdate
from backend.login.dependencies import get_current_user, verify_admin
from backend.models.master import MaterialType
from backend.utils.file_validation import validate_image
from backend.config import UPLOAD_MATERIALS

router = APIRouter(prefix="/materials", tags=["Materials"])

UPLOAD_DIR = UPLOAD_MATERIALS


def _to_material_dict(mat, mat_type, stock, reserved_qty=0):
    # ดักกรณีไม่มีแถวสต็อกค้างในระบบ ให้สต็อกเริ่มต้นเป็น 0
    stock_qty = stock.quantity if stock else 0
    return {
        "mat_id": mat.mat_id,
        "mat_code": mat.mat_code,
        "mat_name": mat.mat_name,
        # ดักกรณีประเภทวัสดุโดนลบหรือซ่อนไปแล้ว ไม่ให้โปรแกรมค้าง
        "mat_type": mat_type.mat_type_name if mat_type else "ไม่ระบุประเภท",
        "mat_type_id": mat.mat_type_id,
        "unit_pack": mat.unit_pack,
        "unit_sub": mat.unit_sub,
        "mat_unit": mat.unit_sub,
        "qty_per_pack": mat.qty_per_pack,
        "price_per_pack": mat.price_per_pack,
        "min_qty": mat.min_qty,
        "balance_qty": stock_qty - int(reserved_qty or 0),
        "maxStock": stock_qty,
        "image": mat.image,
        "is_active": mat.is_active,  # ส่งค่าสถานะกลับไปให้ Frontend แสดงผลปุ่มเปิด/ปิดใช้งานได้ถูกต้อง
    }

def _material_list_user(db):
    reserved_sub = db.query(
        MaterialReserved.mat_id,
        func.sum(MaterialReserved.quantity).label("reserved_qty")
    ).filter(MaterialReserved.status.in_([ReservedStatus.RESERVED, ReservedStatus.APPROVED]))\
     .group_by(MaterialReserved.mat_id)\
     .subquery()

    results = db.query(Material, MaterialType, MaterialStock, reserved_sub.c.reserved_qty)\
        .join(MaterialType, Material.mat_type_id == MaterialType.mat_type_id)\
        .outerjoin(MaterialStock, Material.mat_id == MaterialStock.mat_id)\
        .outerjoin(reserved_sub, Material.mat_id == reserved_sub.c.mat_id)\
        .filter(Material.is_active == True)\
        .all()

    return [
        _to_material_dict(mat, mat_type, stock, reserved_qty)
        for mat, mat_type, stock, reserved_qty in results
    ]


def _material_list_admin(db):
    results = db.query(Material, MaterialType, MaterialStock)\
        .join(MaterialType, Material.mat_type_id == MaterialType.mat_type_id)\
        .outerjoin(MaterialStock, Material.mat_id == MaterialStock.mat_id)\
        .filter(Material.is_active == True)\
        .all()

    return [
        _to_material_dict(mat, mat_type, stock)
        for mat, mat_type, stock in results
    ]


@router.get("/admin")
def get_materials_admin(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    return _material_list_admin(db)


@router.get("/admin/hidden")
def get_hidden_materials(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    results = db.query(Material, MaterialType, MaterialStock)\
        .join(MaterialType, Material.mat_type_id == MaterialType.mat_type_id)\
        .outerjoin(MaterialStock, Material.mat_id == MaterialStock.mat_id)\
        .filter(Material.is_active == False)\
        .all()

    return [
        _to_material_dict(mat, mat_type, stock)
        for mat, mat_type, stock in results
    ]


@router.get("/admin/{mat_id}")
def get_material_by_id_admin(
    mat_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    # เปลี่ยนเป็น .outerjoin() ทั้งหมด
    result = db.query(Material, MaterialType, MaterialStock)\
        .outerjoin(MaterialType, Material.mat_type_id == MaterialType.mat_type_id)\
        .outerjoin(MaterialStock, Material.mat_id == MaterialStock.mat_id)\
        .filter(Material.mat_id == mat_id)\
        .first()

    if not result or not result[0]:
        raise HTTPException(status_code=404, detail="ไม่พบวัสดุนี้ในระบบ")

    mat, mat_type, stock = result
    return _to_material_dict(mat, mat_type, stock)

@router.get("/")
def get_materials(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return _material_list_user(db)


@router.post("/")
async def create_material(
    mat_code: str = Form(...),
    mat_name: str = Form(...),
    mat_type_id: int = Form(...),
    unit_pack: str = Form(...),
    qty_per_pack: int = Form(...),
    unit_sub: str = Form(...),
    price_per_pack: float = Form(...),
    stock_qty: int = Form(0),
    min_qty: int = Form(0),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    if db.query(Material).filter(Material.mat_code == mat_code).first():
        raise HTTPException(status_code=400, detail="รหัสวัสดุนี้มีในระบบแล้ว")

    new_material = Material(
        mat_code=mat_code,
        mat_name=mat_name,
        mat_type_id=mat_type_id,
        unit_pack=unit_pack,
        qty_per_pack=qty_per_pack,
        unit_sub=unit_sub,
        price_per_pack=price_per_pack,
        min_qty=min_qty,
    )
    db.add(new_material)
    db.flush()

    if stock_qty > 0:
        db.add(MaterialStock(mat_id=new_material.mat_id, quantity=stock_qty))

    if image:
        contents = await image.read()
        ext = validate_image(contents, image.filename)
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = f"mat_{new_material.mat_id}.{ext}"
        filepath = os.path.join(str(UPLOAD_DIR), filename)
        with open(filepath, "wb") as f:
            f.write(contents)
        new_material.image = f"/static/materials/{filename}"

    db.commit()
    db.refresh(new_material)
    return {"message": "เพิ่มวัสดุสำเร็จ", "mat_id": new_material.mat_id}


@router.get("/{mat_id}")
def get_material_by_id(
    mat_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    reserved_qty = db.query(
        func.sum(MaterialReserved.quantity)
    ).filter(
        MaterialReserved.mat_id == mat_id,
        MaterialReserved.status.in_([ReservedStatus.RESERVED, ReservedStatus.APPROVED])
    ).scalar() or 0

    result = db.query(Material, MaterialType, MaterialStock)\
        .join(MaterialType, Material.mat_type_id == MaterialType.mat_type_id)\
        .outerjoin(MaterialStock, Material.mat_id == MaterialStock.mat_id)\
        .filter(Material.mat_id == mat_id, Material.is_active == True)\
        .first()

    if not result:
        raise HTTPException(status_code=404, detail="ไม่พบวัสดุนี้")

    mat, mat_type, stock = result
    return _to_material_dict(mat, mat_type, stock, reserved_qty)


@router.put("/{mat_id}", response_model=MaterialResponse)
def update_material(
    mat_id: int,
    material_update: MaterialUpdate,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    db_material = db.query(Material).filter(Material.mat_id == mat_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="ไม่พบวัสดุนี้")

    update_data = material_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_material, key, value)

    try:
        db.commit()
        db.refresh(db_material)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"ไม่สามารถบันทึกข้อมูลได้: {str(e)}")

    return db_material


@router.delete("/{mat_id}")
def delete_material(
    mat_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    db_material = db.query(Material).filter(Material.mat_id == mat_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="ไม่พบวัสดุนี้")

    db_material.is_active = False

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"ไม่สามารถลบวัสดุได้: {str(e)}")

    return {"message": f"ระงับการใช้งานวัสดุรหัส {db_material.mat_code} เรียบร้อย"}


@router.patch("/{mat_id}/visibility")
def toggle_material_visibility(
    mat_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    mat = db.query(Material).filter(Material.mat_id == mat_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="ไม่พบวัสดุนี้")

    mat.is_active = not mat.is_active

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"เกิดข้อผิดพลาด: {str(e)}")

    return {
        "mat_id": mat_id,
        "is_active": mat.is_active,
        "message": "เปิดใช้งานแล้ว" if mat.is_active else "ปิดใช้งานแล้ว"
    }