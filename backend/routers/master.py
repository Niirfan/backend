# backend/routers/master.py
# Router สำหรับข้อมูลพื้นฐาน (Master Data - สาขา, ประเภทวัสดุ, จุดบริการ)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from backend.database import get_db
from backend.models.master import Branch, MaterialType, ServicePoint 
from backend.schemas.master import BranchResponse, MaterialTypeResponse, ServicePointResponse, MaterialTypeCreate 
from backend.login.dependencies import get_current_user, verify_admin

# 🎯 ปรับแก้ไข: ถอน prefix="/master" ออก เพื่อให้ดิ่งเข้าหาพาธตรงของ React 
# แต่ยังคงเก็บระดับความปลอดภัยสูงสุด บังคับต้องล็อกอินเข้าสู่ระบบก่อนดึงข้อมูลเสมอ
router = APIRouter(
    tags=["Master Data"],
    dependencies=[Depends(get_current_user)]
)


# 🎯 ปรับแก้ลิงก์: เปลี่ยนจาก /branche เป็น /branches เติม s ให้ตรงตามที่หน้าบ้านมองหา
@router.get("/branches", response_model=List[BranchResponse])
def get_all_branches(db: Session = Depends(get_db)):
    """ดึงรายชื่อสาขาทั้งหมด ส่งตรงเข้าฟอร์มสร้างพนักงาน"""
    return db.query(Branch).all()


# 🎯 ปรับแก้ลิงก์: วางพาธเดี่ยว /service-point ไม่มี s ตรงล็อกตามที่ React ยิงเป๊ะๆ
@router.get("/service-point", response_model=List[ServicePointResponse])
def get_all_service_points(db: Session = Depends(get_db)):
    """ดึงข้อมูลจุดบริการทั้งหมด พร้อมโครงสร้าง Loader ดึงสาขาพ่วงไร้รอยต่อ"""
    return db.query(ServicePoint).options(joinedload(ServicePoint.branch)).all()


@router.get("/material-type", response_model=List[MaterialTypeResponse])
def get_all_material_types(db: Session = Depends(get_db)):
    """ดึงประเภทวัสดุทั้งหมด"""
    return db.query(MaterialType).all()

@router.post("/material-type", response_model=MaterialTypeResponse)
def create_material_type(
    data: MaterialTypeCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin)
):
    """เพิ่มประเภทวัสดุใหม่"""
    existing = db.query(MaterialType).filter(MaterialType.mat_type_name == data.mat_type_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="ประเภทวัสดุนี้มีอยู่แล้ว")
    
    new_type = MaterialType(**data.model_dump())
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return new_type