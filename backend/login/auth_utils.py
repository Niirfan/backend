from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from backend.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ตรวจสอบว่ารหัสผ่านตรงกับ Hash ในคลังฐานข้อมูลหรือไม่"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """แปลงรหัสผ่านพนักงานให้กลายเป็นรหัสลับ (Hash)"""
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:  
    """สร้างก้อน JWT Token ส่งออกไปให้หน้าบ้านรักษาสิทธิ์"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt