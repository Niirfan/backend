from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

# นำเข้าการตั้งค่า Database
from backend.database import get_db

# นำเข้า Models (ตัวแทนตารางใน Database)
# **จุดสังเกต:** เช็คให้แน่ใจว่า import path ตรงกับโครงสร้างไฟล์ของคุณ
from backend.models.master import Branch, MaterialType 

# นำเข้า Schemas (ตัวกรองข้อมูลที่เราเพิ่งสร้างเมื่อกี้)
from backend.schemas.master import BranchResponse, MaterialTypeResponse

# สร้าง Router (ไม่ต้องใส่ prefix รวม เพราะเราจะแยก path ชัดเจนตามที่หน้าบ้านเรียก)
router = APIRouter(tags=["Master Data"])

# ---------------------------------------------------------
# 1. API สำหรับดึงข้อมูล "สาขา" ทั้งหมด
# ---------------------------------------------------------
@router.get("/branches/", response_model=List[BranchResponse])
def get_all_branches(db: Session = Depends(get_db)):
    """
    ดึงรายชื่อสาขาทั้งหมด เพื่อนำไปแสดงใน Dropdown
    """
    branches = db.query(Branch).all()
    return branches

# ---------------------------------------------------------
# 2. API สำหรับดึงข้อมูล "ประเภทวัสดุ" ทั้งหมด
# ---------------------------------------------------------
@router.get("/material-type/", response_model=List[MaterialTypeResponse])
def get_all_material_types(db: Session = Depends(get_db)):
    """
    ดึงประเภทวัสดุทั้งหมด เพื่อนำไปแสดงใน Dropdown หน้าจัดหมวดหมู่
    """
    material_types = db.query(MaterialType).all()
    return material_types