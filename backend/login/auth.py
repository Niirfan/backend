# API สำหรับ Login และดูข้อมูลตัวเอง

from fastapi import APIRouter, Depends, HTTPException, Request, status  # 🎯 เพิ่ม Request และ status ตรงนี้
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.models.users import User
from backend.schemas.users import Token, UserLogin, UserResponse
from backend.login.auth_utils import verify_password, create_access_token
from backend.login.dependencies import get_current_user

# 🎯 เพิ่มเครื่องมือคุมความเร็ว Rate Limiting
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

# สร้างตัวคุมความเร็วล็อกความถี่ตาม IP Address
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# 🎯 สร้าง Handler ดักกรณีพนักงานกดยิงรัวล็อกอินเกินกำหนด (ดีดรหัส 429 กลับไป)
def rate_limit_error_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารออีก 1 นาทีก่อนลองใหม่อีกครั้ง"}
    )


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")  # 🔒 🎯 จุดอุดรอยรั่ว M8: ป้องกันการสุ่มเดารหัสผ่าน จำกัด 5 ครั้งต่อนาที
def login(
    request: Request,       # ⚠️ กฎเหล็ก: จำเป็นต้องเติมพารามิเตอร์นี้เข้ามาเป็นตัวแรกสุดในฟังก์ชันเสมอ
    login_data: UserLogin, 
    db: Session = Depends(get_db)
):
    """เข้าสู่ระบบและรับ Token"""
    # หาผู้ใช้จากรหัสพนักงาน
    user = db.query(User).filter(User.emp_code == login_data.emp_code).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="รหัสพนักงานนี้ถูกปิดใช้งาน")
    
    # ตรวจสอบรหัสผ่าน
    if not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง")
    
    # สร้าง Token
    access_token = create_access_token(
        data={"sub": user.emp_code, "role": user.user_role}
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.user_role, "can_request": user.can_request}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .options(joinedload(User.branch))             # ← โหลด branch พร้อมกัน
        .filter(User.emp_code == current_user["emp_code"])
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้")
    return user