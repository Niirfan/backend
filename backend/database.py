from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from backend.config import DATABASE_URL  # 🎯 ดึงคอนฟิกกลางที่ปลอดภัยมาใช้

# สร้างการเชื่อมต่อกับฐานข้อมูล PostgreSQL พร้อมระบบ Pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=5,                         # เปิดการเชื่อมต่อค้างไว้พร้อมใช้งาน 5 เส้นพร้อมกัน
    max_overflow=10,                      # ขยายสายเพิ่มชั่วคราวได้อีก 10 เส้นเมื่อทำงานหนัก
    pool_pre_ping=True,                   # ตรวจสุขภาพสาย (Ping) ก่อนยิงคำสั่ง SQL ทุกครั้ง
    pool_recycle=3600,                    # รีเซ็ตสายการเชื่อมต่อที่ค้างเกิน 1 ชั่วโมง ป้องกันสายค้าง
    echo=False                            # ปิดการพ่น Log SQL ดิบเต็มหน้าจอ
)

# โรงงานผลิต Session สำหรับจัดการคิวรี่ฐานข้อมูล
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """แม่แบบหลักสำหรับ ORM Models"""
    pass


def get_db():
    """เปิด-ปิด Session เพื่อใช้งานฐานข้อมูล (Dependency Injection)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()