"""
=============================================================================
📝 รีวิวโค้ดโดย Antigravity (Code Review)
ไฟล์: backend/main.py
หน้าที่: ไฟล์หลักสำหรับรันเซิร์ฟเวอร์ FastAPI และผูก Router ต่างๆ

✅ สิ่งที่เขียนได้ดี:
- มีการแบ่ง Router ย่อยๆ ออกไป (`app.include_router()`) ไม่เอาทุก API มารวมกันในไฟล์เดียว ทำให้จัดการง่าย
- มีการใส่ Title, Description, Version ชัดเจน (เป็นมิตรกับหน้าระบบ API Docs)
- มี CORS Middleware เปิดรับให้ Frontend เข้าใช้งานได้ 

💡 ข้อควรระวังและการแก้ไขปัญหา (มีโค้ดตัวอย่างในเอกสารรวม):
- ในขั้น Production ควรเปลี่ยน `allow_origins=["*"]` ให้เป็นชื่อเว็บไซต์ของคุณเองเท่านั้นเพื่อความปลอดภัย
=============================================================================
"""
from fastapi import FastAPI
from backend.login import auth
from backend.routers import materials
from backend.routers import requests
from backend.routers import admin_requests
from fastapi.middleware.cors import CORSMiddleware # 1. ต้องนำเข้าตัวนี้ครับ

app = FastAPI(
    title="SAMS API (Version 2)",
    description="ระบบจัดการวัสดุสำนักงาน สหกรณ์อิสลามอัศศิดดีก (Rewrite Version)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ✅ อนุญาตทุก origin
    allow_credentials=False,  # ⚠️ ต้องเป็น False ถ้าใช้ "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(materials.router)
app.include_router(requests.router)
app.include_router(admin_requests.router)

@app.get("/")
def read_root():
    return {"message": "✅ SAMS Backend V2 is running successfully!"}