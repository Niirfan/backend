"""
=============================================================================
📝 รีวิวโค้ดโดย Antigravity (Code Review)
ไฟล์: backend/login/auth.py
หน้าที่: จัดการเส้นทาง (API Endpoint) สำหรับการเข้าสู่ระบบ

✅ สิ่งที่เขียนได้ดี:
- มีการนำเครื่องมือเข้ารหัสแยกไปที่ util ทำให้ไฟล์นี้จัดการเฉพาะ Route ตรงจุดประสงค์
- ตอบกลับด้วยข้อมูล JSON พร้อม Token ถือว่าได้มาตรฐาน
- มีการส่งคืนข้อมูล `role` ทันทีหลังจากล็อกอินสำเร็จ ช่วยลดจำนวน Request ของเครื่องลูกข่ายลงได้มาก

🌟 [อัปเดตล่าสุด]: แก้ไขช่องโหว่ด้านความปลอดภัยในการตรวจสอบรหัสผ่านของ Admin ด้วย Hash เพื่อความปลอดภัยสูงสุด และปรับข้อความ Error แจ้งเตือนให้เป็นมาตรฐานเดียว (ป้องกันการฟิชชิ่งข้อมูล)
=============================================================================
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.users import User
from backend.schemas.users import Token, UserLogin # <-- นำเข้าหน้ากากรับข้อมูลแบบ JSON
from backend.login.auth_utils import verify_password, create_access_token
from backend.login.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # 1. ค้นหา User ด้วยรหัสพนักงาน

    user = db.query(User).filter(User.emp_code == login_data.emp_code).first()
    if not user:
        raise HTTPException(status_code=401, detail="รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง")

    # 2. ถอดรหัสและตรวจสอบรหัสผ่าน (ใช้ได้กับทุกคนทั้ง Admin และ User)
    if not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง")

    # 3. สร้าง Token
    access_token = create_access_token(
        data={"sub": user.emp_code, "role": user.user_role}
    )

    # ตอนนี้ access_token มีตัวตนแล้ว return ได้ไม่พังแล้วครับ
    return {"access_token": access_token, "token_type": "bearer","role": user.user_role}

@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.emp_code == current_user["emp_code"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้")
    return user