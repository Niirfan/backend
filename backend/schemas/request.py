"""
=============================================================================
📝 รีวิวโค้ดโดย Antigravity (Code Review)
ไฟล์: backend/schemas/request.py
หน้าที่: โครงสร้างตรวจสอบข้อมูลใบเบิก (Data Validation)

✅ สิ่งที่เขียนได้ดี:
- การซ้อน Schema เข้าด้วยกัน (Nested Schema) โดยเอา Detail ไปฝังไว้ใน Header (`List[ReqDetailCreate]`) ทำให้รับข้อมูลจาก Frontend ฝั่งรถเข็น (Cart) มาทั้งหมดได้ในออเดอร์เดียว เจ๋งมากครับ!
=============================================================================
"""
#ระบบใบเบิกจะมีความซับซ้อนขึ้นมานิดหน่อย เพราะ 1 ใบเบิก 
#จะมี "รายการวัสดุย่อยๆ" อยู่ข้างในครับ เราเลยต้องสร้าง Schema แบบรับข้อมูลเป็น Array (List)
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

# --- ส่วนของรายการวัสดุย่อย (Detail) ---
class ReqDetailCreate(BaseModel):
    mat_id: int
    req_qty: int

class ReqDetailResponse(ReqDetailCreate):
    detail_id: int
    approve_qty: int
    model_config = ConfigDict(from_attributes=True)

# --- ส่วนของใบเบิกหลัก (Header) ---
# ตอน User กด "ยืนยันการเบิก" หน้าเว็บจะส่งข้อมูลมาในรูปแบบนี้
class RequestCreate(BaseModel):
    items: List[ReqDetailCreate]  # รับรายการวัสดุที่เลือกมาเป็น List

# ตอน User หรือ Admin กดดูประวัติใบเบิก
class RequestResponse(BaseModel):
    mat_req_id: int
    mat_req_code: str
    user_id: str
    req_date: datetime
    req_status: str
    total_price: float
    
    # ถ้าอยากให้แนบรายการวัสดุกลับไปพร้อมใบเบิกเลย ก็เปิดคอมเมนต์บรรทัดล่างได้ครับ
    # details: List[ReqDetailResponse] = [] 
    
    model_config = ConfigDict(from_attributes=True)