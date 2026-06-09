# Schema สำหรับใบเบิกวัสดุ

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


# Schema สำหรับรายละเอียดวัสดุแต่ละรายการในใบเบิก (ฝั่ง Input)
class ReqDetailCreate(BaseModel):
    mat_id: int
    req_qty: int

# Schema สำหรับส่งรายละเอียดวัสดุกลับ (เพิ่มข้อมูลที่ได้จากฐานข้อมูล)
class ReqDetailResponse(ReqDetailCreate):
    detail_id: int
    approve_qty: int
    model_config = ConfigDict(from_attributes=True)

# Schema สำหรับสร้างใบเบิกใหม่ (รับรายการวัสดุหลายรายการพร้อมกัน)
class RequestCreate(BaseModel):
    items: List[ReqDetailCreate]

# Schema สำหรับส่งข้อมูลใบเบิกกลับ (เพิ่มข้อมูลที่ได้จากฐานข้อมูล)
class RequestResponse(BaseModel):
    mat_req_id: int
    mat_req_code: str
    user_id: str
    req_date: datetime
    req_status: str
    total_price: float
    model_config = ConfigDict(from_attributes=True)

class ApproveItem(BaseModel):
    mat_id: int
    approve_qty: int

class ApproveRequest(BaseModel):
    items: list[ApproveItem]
    admin_note: Optional[str] = None  # ← เพิ่ม

class RejectRequest(BaseModel):
    admin_note: Optional[str] = None
    
class RemoveItemsBody(BaseModel):
    remove_ids: List[int]