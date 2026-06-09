# Router สำหรับ User ทั่วไป — จัดการโปรไฟล์ตัวเอง

import os
import re
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.users import User
from backend.schemas.users import UserResponse, PasswordChange, ProfileUpdate
from backend.login.dependencies import get_current_user
from backend.login.auth_utils import verify_password, get_password_hash
from backend.utils.file_validation import validate_image
from backend.config import UPLOAD_PROFILES

router = APIRouter(prefix="/users", tags=["User Profile"])
UPLOAD_DIR = UPLOAD_PROFILES


def _safe_emp_code(emp_code: str) -> str:
    """ตรวจ emp_code ไม่ให้มีอักขระพิเศษที่อาจใช้ directory traversal"""
    if not re.match(r'^[A-Za-z0-9_-]+$', emp_code):
        raise HTTPException(status_code=400, detail="emp_code ไม่ถูกต้อง")
    return emp_code


def _get_user_or_404(db: Session, emp_code: str) -> User:
    user = db.query(User).filter(User.emp_code == emp_code).first()
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้")
    return user


# ---------------------------------------------------------
# 1. แก้ไขโปรไฟล์ตัวเอง
# ---------------------------------------------------------
@router.put("/me", response_model=UserResponse)
def update_my_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = _get_user_or_404(db, current_user["emp_code"])
    update_data = profile_data.model_dump(exclude_unset=True)

    if "email" in update_data:
        duplicate = db.query(User).filter(
            User.email == update_data["email"],
            User.emp_code != user.emp_code,
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="อีเมลนี้ถูกใช้แล้ว")

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------
# 2. เปลี่ยนรหัสผ่าน
# ---------------------------------------------------------
@router.put("/me/password")
def change_my_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = _get_user_or_404(db, current_user["emp_code"])

    if not verify_password(data.current_password, user.password):
        raise HTTPException(status_code=400, detail="รหัสผ่านเดิมไม่ถูกต้อง")

    user.password = get_password_hash(data.new_password)
    db.commit()

    return {"message": "เปลี่ยนรหัสผ่านสำเร็จ"}


# ---------------------------------------------------------
# 3. อัปโหลด/เปลี่ยนรูปโปรไฟล์
# ---------------------------------------------------------
@router.put("/me/avatar", response_model=UserResponse)
async def upload_my_avatar(
    profile_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = _get_user_or_404(db, current_user["emp_code"])

    contents = await profile_image.read()
    ext = validate_image(contents, profile_image.filename)  # ← แทนทั้งหมด

    safe_code = _safe_emp_code(user.emp_code)
    new_filename = f"{safe_code}.{ext}"

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # ลบไฟล์เก่าก่อน
    if user.profile_image:
        old_filepath = UPLOAD_DIR / os.path.basename(user.profile_image)
        if old_filepath.exists():
            old_filepath.unlink()

    file_path = os.path.join(UPLOAD_DIR, new_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    user.profile_image = f"/static/profiles/{new_filename}"
    db.commit()
    db.refresh(user)

    return user


# ---------------------------------------------------------
# 4. ลบรูปโปรไฟล์
# ---------------------------------------------------------
@router.delete("/me/avatar")
def delete_my_avatar(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = _get_user_or_404(db, current_user["emp_code"])

    if not user.profile_image:
        raise HTTPException(status_code=404, detail="ไม่มีรูปโปรไฟล์")

    old_filepath = UPLOAD_DIR / os.path.basename(user.profile_image)
    if old_filepath.exists():
        old_filepath.unlink()

    user.profile_image = None
    db.commit()

    return {"message": "ลบรูปโปรไฟล์สำเร็จ"}