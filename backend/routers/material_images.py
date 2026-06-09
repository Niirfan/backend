# Router สำหรับจัดการรูปภาพวัสดุ

import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.material import Material
from backend.login.dependencies import verify_admin
from backend.utils.file_validation import validate_image
from backend.config import UPLOAD_MATERIALS

router = APIRouter(prefix="/materials", tags=["Material Images"])

UPLOAD_DIR = UPLOAD_MATERIALS


@router.patch("/{mat_id}/image")
async def upload_material_image(
    mat_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """อัปโหลดรูปวัสดุ (Admin เท่านั้น)"""
    mat = db.query(Material).filter(Material.mat_id == mat_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="ไม่พบวัสดุนี้")

    content = await image.read()
    ext = validate_image(content, image.filename)  # ตรวจ size, magic bytes, extension

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    filename = f"mat_{mat_id}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    mat.image = f"/static/materials/{filename}"
    db.commit()

    return {"message": "✅ อัปโหลดรูปเรียบร้อย", "image": mat.image}


@router.delete("/{mat_id}/image")
def delete_material_image(
    mat_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """ลบรูปวัสดุ (Admin เท่านั้น)"""
    mat = db.query(Material).filter(Material.mat_id == mat_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="ไม่พบวัสดุนี้")

    if mat.image:
        filename = os.path.basename(mat.image)       
        filepath = UPLOAD_DIR / filename             
        if filepath.exists():
            filepath.unlink()

    mat.image = None
    db.commit()

    return {"message": "✅ ลบรูปเรียบร้อย"}