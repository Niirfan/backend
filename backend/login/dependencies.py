# ฟังก์ชันตรวจสอบ Token และสิทธิ์ผู้ใช้

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.users import User
from backend.login.auth_utils import SECRET_KEY, ALGORITHM

security = HTTPBearer()

# roles ที่มีในระบบ — แก้ที่นี่ที่เดียว
ROLE_USER           = "User"
ROLE_ADMIN          = "Admin"
ROLE_BRANCH_MANAGER = "BranchManager"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """ตรวจสอบ Token และเช็ค User ใน DB"""
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        emp_code: str = payload.get("sub")
        role: str = payload.get("role")

        if emp_code is None:
            raise HTTPException(status_code=401, detail="บัตรผ่านไม่ถูกต้อง")

        user_db = db.query(User).filter(User.emp_code == emp_code).first()

        if not user_db:
            raise HTTPException(status_code=401, detail="ไม่พบรหัสบัญชีนี้")

        if not getattr(user_db, "is_active", True):
            raise HTTPException(status_code=403, detail="บัญชีของคุณถูกระงับ")

        return {
            "emp_code": emp_code,
            "role": role,
            "user_id": user_db.user_id,
            "branch_id": user_db.branch_id,  # ← เพิ่ม สำคัญสำหรับ BranchManager
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="บัตรผ่านหมดอายุหรือปลอมแปลง")


def verify_admin(
    current_user: dict = Depends(get_current_user)
):
    """Admin เท่านั้น — BranchManager เข้าไม่ได้"""
    if current_user.get("role") != ROLE_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="คุณไม่มีสิทธิ์เข้าถึง (Admin เท่านั้น)"
        )
    return current_user


def verify_branch_manager(
    current_user: dict = Depends(get_current_user)
):
    """BranchManager เท่านั้น"""
    if current_user.get("role") != ROLE_BRANCH_MANAGER:
        raise HTTPException(
            status_code=403,
            detail="คุณไม่มีสิทธิ์เข้าถึง (BranchManager เท่านั้น)"
        )
    return current_user

def verify_admin_or_branch_manager(
    current_user: dict = Depends(get_current_user)
):
    """Admin หรือ BranchManager เท่านั้น"""
    if current_user.get("role") not in [ROLE_ADMIN, ROLE_BRANCH_MANAGER]:
        raise HTTPException(
            status_code=403,
            detail="คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ดนี้"
        )
    return current_user