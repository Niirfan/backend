# backend/routers/admin_users.py
# ระบบบริหารจัดการข้อมูลพนักงานและสิทธิ์สำหรับผู้ดูแลระบบ (Admin User Management)

import os
import logging
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Query, Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from backend.database import get_db
from backend.models.users import User
from backend.models.master import Branch
from backend.schemas.users import UserUpdate, UserResponse, PasswordChange, AdminResetPassword, PaginatedUserResponse
from backend.login.dependencies import verify_admin
from backend.login.auth_utils import get_password_hash
from backend.utils.file_validation import validate_image
from backend.config import UPLOAD_PROFILES

logger = logging.getLogger(__name__)

def escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

router = APIRouter(prefix="/admin/users", tags=["Admin: User Management"], redirect_slashes=False)

ROLE_MAPPING = {
    "ผู้ดูแลระบบ": "Admin",
    "admin": "Admin",
    "Admin": "Admin",
    "ผู้จัดการสาขา": "BranchManager",
    "branchmanager": "BranchManager",
    "BranchManager": "BranchManager",
    "manager": "BranchManager",
    "Manager": "BranchManager",
    "พนักงานทั่วไป": "User",
    "user": "User",
    "User": "User"
}


@router.get("", response_model=PaginatedUserResponse)
def get_all_users(
    response: Response,
    search: Optional[str] = None,
    include_inactive: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """ดึงข้อมูลรายชื่อพนักงานทั้งหมด (ส่ง include_inactive=true เพื่อดึงคนที่ถูกลบมาดูได้)"""
    query = db.query(User).options(joinedload(User.branch))

    if not include_inactive:
        query = query.filter(User.is_active == True)

    if search:
        s = escape_like(search)
        query = query.filter(
            (User.emp_code.ilike(f"%{s}%")) |
            (User.full_name.ilike(f"%{s}%"))
        )

    total = query.count()
    offset = (page - 1) * limit
    users = query.order_by(User.emp_code.asc()).offset(offset).limit(limit).all()

    total_pages = (total + limit - 1) // limit

    response.headers["X-Total-Count"] = str(total)
    response.headers["X-Total-Pages"] = str(total_pages)
    response.headers["X-Page"] = str(page)
    response.headers["X-Limit"] = str(limit)

    return {
        "items": users,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@router.get("/{emp_code}", response_model=UserResponse)
def get_user_by_emp_code(
    emp_code: str,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """ค้นหาพนักงานด้วยรหัสพนักงาน"""
    user = (
        db.query(User)
        .options(joinedload(User.branch))
        .filter(User.emp_code == emp_code)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบข้อมูลพนักงานรหัส {emp_code}")
    return user


@router.post("", response_model=UserResponse)
async def create_user_with_image(
    emp_code: str = Form(...),
    full_name: str = Form(...),
    position: str = Form(...),
    branch_id: str = Form(...),
    phone: str = Form(...),
    email: EmailStr = Form(...),
    user_role: str = Form(...),
    password: str = Form(...),
    can_request: bool = Form(False),
    service_point_id: Optional[int] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """สร้างบัญชีผู้ใช้งานใหม่"""
    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
        )

    existing_user = db.query(User).filter(User.emp_code == emp_code).first()
    if existing_user:
        if not existing_user.is_active:
            raise HTTPException(
                status_code=400,
                detail="รหัสพนักงานนี้เคยถูกลบ/ปิดใช้งานอยู่ในระบบ แนะนำให้กด 'กู้คืนบัญชี' แทนการสร้างใหม่"
            )
        raise HTTPException(status_code=400, detail="รหัสพนักงานนี้มีอยู่ในระบบแล้ว")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="อีเมลนี้มีผู้ใช้งานแล้ว")

    if not db.query(Branch).filter(Branch.branch_id == branch_id).first():
        raise HTTPException(status_code=400, detail=f"ไม่พบรหัสสาขา {branch_id}")

    role_input = user_role.strip()
    final_role = ROLE_MAPPING.get(role_input)
    if not final_role:
        raise HTTPException(
            status_code=400,
            detail=f"ไม่รองรับสิทธิ์ '{user_role}' กรุณาระบุ: ผู้ดูแลระบบ, ผู้จัดการสาขา หรือ พนักงานทั่วไป"
        )

    image_url = None
    if profile_image:
        contents = await profile_image.read()
        ext = validate_image(contents, profile_image.filename)
        new_filename = f"{emp_code}.{ext}"
        os.makedirs(str(UPLOAD_PROFILES), exist_ok=True)
        file_path = os.path.join(str(UPLOAD_PROFILES), new_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        image_url = f"/static/profiles/{new_filename}"

    new_user = User(
        emp_code=emp_code,
        full_name=full_name,
        position=position,
        branch_id=branch_id,
        service_point_id=service_point_id,
        phone=phone,
        email=email,
        user_role=final_role,
        password=get_password_hash(password),
        profile_image=image_url,
        is_active=True,
        can_request=can_request
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        logger.exception("Failed to create_user emp_code=%s", emp_code)
        raise HTTPException(status_code=500, detail="ไม่สามารถสร้างผู้ใช้ได้")

    return (
        db.query(User)
        .options(joinedload(User.branch))
        .filter(User.emp_code == emp_code)
        .first()
    )


@router.put("/{emp_code}", response_model=UserResponse)
def update_user(
    emp_code: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    user = db.query(User).filter(User.emp_code == emp_code).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบข้อมูลพนักงานรหัส {emp_code}")

    update_data = user_data.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"]:
        if db.query(User).filter(User.email == update_data["email"], User.emp_code != emp_code).first():
            raise HTTPException(status_code=400, detail="อีเมลนี้มีผู้ใช้งานแล้ว")

    if "branch_id" in update_data and update_data["branch_id"]:
        if not db.query(Branch).filter(Branch.branch_id == update_data["branch_id"]).first():
            raise HTTPException(status_code=400, detail=f"ไม่พบรหัสสาขา {update_data['branch_id']}")

    for key, value in update_data.items():
        if key == "password" and value:
            setattr(user, "password", get_password_hash(value))
        elif key == "user_role" and value is not None:
            role_str = value.value if hasattr(value, "value") else str(value)
            final_role = ROLE_MAPPING.get(role_str.strip())
            if not final_role:
                raise HTTPException(status_code=400, detail=f"ไม่รองรับสิทธิ์ '{role_str}'")
            setattr(user, "user_role", final_role)
        else:
            setattr(user, key, value)

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        logger.exception("Failed to update_user emp_code=%s", emp_code)
        raise HTTPException(status_code=400, detail="ไม่สามารถบันทึกข้อมูลได้")

    return (
        db.query(User)
        .options(joinedload(User.branch))
        .filter(User.emp_code == emp_code)
        .first()
    )


@router.patch("/{emp_code}/reset-password")
def reset_password(
    emp_code: str,
    body: AdminResetPassword,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    user = db.query(User).filter(User.emp_code == emp_code).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบข้อมูลพนักงานรหัส {emp_code}")

    try:
        user.password = get_password_hash(body.new_password)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to reset_password emp_code=%s", emp_code)
        raise HTTPException(status_code=500, detail="ไม่สามารถเปลี่ยนรหัสผ่านได้")

    return {"message": f"เปลี่ยนรหัสผ่านพนักงาน {emp_code} เรียบร้อยแล้ว"}


@router.patch("/{emp_code}/restore", response_model=UserResponse)
def restore_user(
    emp_code: str,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    """กู้คืนบัญชีพนักงานที่ถูกปิดใช้งาน"""
    user = db.query(User).filter(User.emp_code == emp_code).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบข้อมูลพนักงานรหัส {emp_code}")

    if user.is_active:
        raise HTTPException(status_code=400, detail="บัญชีผู้ใช้งานรายนี้เปิดใช้งานปกติอยู่แล้ว ไม่ต้องกู้คืน")

    try:
        user.is_active = True
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        logger.exception("Failed to restore_user emp_code=%s", emp_code)
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดภายในระบบ ไม่สามารถกู้คืนบัญชีได้")

    return (
        db.query(User)
        .options(joinedload(User.branch))
        .filter(User.emp_code == emp_code)
        .first()
    )


@router.delete("/{emp_code}")
def deactivate_user(
    emp_code: str,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(verify_admin)
):
    user = db.query(User).filter(User.emp_code == emp_code).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบข้อมูลพนักงานรหัส {emp_code}")

    if user.emp_code == admin_user.get("emp_code"):
        raise HTTPException(status_code=400, detail="ไม่สามารถปิดใช้งานบัญชีของตัวเองได้")

    user.is_active = False
    db.commit()

    return {"message": f"ปิดใช้งานพนักงาน {emp_code} เรียบร้อยแล้ว"}