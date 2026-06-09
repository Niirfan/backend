
from pydantic import BaseModel, ConfigDict
from typing import Optional

class MaterialBase(BaseModel):
    mat_code: str
    mat_name: str
    mat_type_id: int
    unit_pack: Optional[str] = None
    qty_per_pack: Optional[int] = None
    unit_sub: Optional[str] = None
    price_per_pack: Optional[float] = None
    is_active: bool = True
    min_qty: int = 10
    image: Optional[str] = None

# ตอนแอดมินกดเพิ่มวัสดุ จะใช้ Schema นี้
class MaterialCreate(MaterialBase):
    pass

# ตอนส่งข้อมูลไปโชว์ที่ตารางหน้าเว็บ จะใช้ Schema นี้ (มี mat_id แนบไปด้วย)
class MaterialResponse(MaterialBase):
    mat_id: int
    
    # เปิดให้แปลงจาก SQLAlchemy Model เป็น JSON อัตโนมัติ
    model_config = ConfigDict(from_attributes=True)

class MaterialUpdate(BaseModel):
    mat_code: Optional[str] = None
    mat_name: Optional[str] = None
    mat_type_id: Optional[int] = None
    unit_pack: Optional[str] = None
    qty_per_pack: Optional[int] = None
    unit_sub: Optional[str] = None
    price_per_pack: Optional[float] = None
    is_active: Optional[bool] = None
    min_qty: Optional[int] = None