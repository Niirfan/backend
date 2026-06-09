# ไฟล์นี้เก็บโครงสร้างข้อมูล (Schema) สำหรับตรวจสอบและส่งผ่านข้อมูล
# ใช้สำหรับ สาขา (Branch), ประเภทวัสดุ (Material Type) และ จุดบริการ (Service Point)

# 🎯 จุดอุดรอยรั่ว: นำเข้า model_validator มาใช้งานร่วมด้วยให้ถูกต้องตามหลัก Pydantic v2
from pydantic import BaseModel, ConfigDict, field_validator, model_validator 
from typing import Optional  # ให้สามารถกำหนดข้อมูลไม่บังคับได้


# ==================== สาขา (Branch) ====================

class BranchBase(BaseModel):
    branch_id: str      
    branch_name: str      


class BranchResponse(BranchBase):
    model_config = ConfigDict(from_attributes=True)


# ==================== ประเภทวัสดุ (Material Type) ====================

class MaterialTypeBase(BaseModel):
    mat_type_name: str    


class MaterialTypeCreate(MaterialTypeBase):
    pass  


class MaterialTypeResponse(MaterialTypeBase):
    mat_type_id: int
    model_config = ConfigDict(from_attributes=True)


# ==================== จุดบริการ (Service Point) ====================

class ServicePointCreate(BaseModel):
    service_point_name: str
    branch_id: str
    service_point_code: Optional[str] = None


class ServicePointUpdate(BaseModel):
    service_point_name: Optional[str] = None
    branch_id: Optional[str] = None
    service_point_code: Optional[str] = None


class ServicePointResponse(BaseModel):
    service_point_id: int
    service_point_name: str
    branch_id: Optional[str] = None
    service_point_code: Optional[str] = None
    branch_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    # ⭐ แก้ไขตามคอมเมนต์ M7: ใช้ @model_validator(mode="before") แทนการ Override model_validate แบบเก่า
    @model_validator(mode="before")
    @classmethod
    def extract_branch_name(cls, data):
        # 1. เคสปกติเมื่อดึงข้อมูลผ่าน SQLAlchemy ORM (.branch)
        if hasattr(data, "branch") and data.branch:
            # ใช้พ่นค่าใส่ __dict__ หรือใช้ setattr เพื่อไม่ให้กระทบสถานะเดิมของอ็อบเจกต์ฐานข้อมูล
            if hasattr(data, "__dict__"):
                data.__dict__["branch_name"] = data.branch.branch_name
            else:
                setattr(data, "branch_name", data.branch.branch_name)
        
        # 2. เผื่อเคสที่ข้อมูลวิ่งเข้ามาเป็น dict (เช่น ข้อมูลดิบ หรือตอนรัน Unit Test)
        elif isinstance(data, dict) and "branch" in data and data["branch"]:
            branch_data = data["branch"]
            if isinstance(branch_data, dict):
                data["branch_name"] = branch_data.get("branch_name")
            elif hasattr(branch_data, "branch_name"):
                data["branch_name"] = branch_data.branch_name
                
        return data