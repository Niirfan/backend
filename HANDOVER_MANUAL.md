# 📘 คู่มือส่งต่อโปรเจ็ค — ระบบจัดการวัสดุสำนักงาน (SAMS V2)
## Smart Asset Management System — Backend API

**จัดทำโดย:** นักศึกษาสหกิจศึกษา  
**สถานประกอบการ:** สหกรณ์อิสลามอัศศิดดีก จำกัด  
**วันที่จัดทำ:** มิถุนายน 2569  
**เวอร์ชัน:** 2.0.0

---

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [ข้อกำหนดเบื้องต้น (Prerequisites)](#2-ข้อกำหนดเบื้องต้น-prerequisites)
3. [การติดตั้งและตั้งค่า (Installation)](#3-การติดตั้งและตั้งค่า-installation)
4. [การตั้งค่าตัวแปรสภาพแวดล้อม (.env)](#4-การตั้งค่าตัวแปรสภาพแวดล้อม-env)
5. [การตั้งค่าฐานข้อมูล (Database)](#5-การตั้งค่าฐานข้อมูล-database)
6. [การรันระบบ (Running the Application)](#6-การรันระบบ-running-the-application)
7. [โครงสร้างโปรเจ็ค (Project Structure)](#7-โครงสร้างโปรเจ็ค-project-structure)
8. [โครงสร้างฐานข้อมูล (Database Schema)](#8-โครงสร้างฐานข้อมูล-database-schema)
9. [ระบบยืนยันตัวตน (Authentication)](#9-ระบบยืนยันตัวตน-authentication)
10. [API Endpoints ทั้งหมด](#10-api-endpoints-ทั้งหมด)
11. [ระบบ LINE Integration](#11-ระบบ-line-integration)
12. [ระบบรายงาน (Report System)](#12-ระบบรายงาน-report-system)
13. [วงจรใบเบิกวัสดุ (Request Lifecycle)](#13-วงจรใบเบิกวัสดุ-request-lifecycle)
14. [ระบบสต็อกและการจอง (Stock & Reservation)](#14-ระบบสต็อกและการจอง-stock--reservation)
15. [ระบบรักษาความปลอดภัย (Security)](#15-ระบบรักษาความปลอดภัย-security)
16. [การสำรองและกู้คืนข้อมูล (Backup & Restore)](#16-การสำรองและกู้คืนข้อมูล-backup--restore)
17. [เครื่องมือช่วยเหลือ (Utility Tools)](#17-เครื่องมือช่วยเหลือ-utility-tools)
18. [การแก้ปัญหาที่พบบ่อย (Troubleshooting)](#18-การแก้ปัญหาที่พบบ่อย-troubleshooting)
19. [แนวทางการพัฒนาต่อ (Future Development)](#19-แนวทางการพัฒนาต่อ-future-development)
20. [ข้อมูลติดต่อ](#20-ข้อมูลติดต่อ)

---

## 1. ภาพรวมระบบ

### ระบบทำอะไร
SAMS V2 คือระบบ Backend API สำหรับจัดการวัสดุสำนักงานแบบครบวงจร ตั้งแต่:

```
พนักงานสร้างใบเบิก → Admin อนุมัติ → Admin จ่ายวัสดุ → ตัดสต็อกอัตโนมัติ
                                                        ↓
                                              แจ้งเตือนผ่าน LINE ทุกขั้นตอน
```

### เทคโนโลยีหลัก

| รายการ | เทคโนโลยี | เวอร์ชัน |
|--------|-----------|---------|
| ภาษา | Python | 3.x |
| Framework | FastAPI | 0.135.3 |
| ฐานข้อมูล | PostgreSQL | — |
| ORM | SQLAlchemy | 2.0.49 |
| แจ้งเตือน | LINE Messaging API + LIFF | — |

### สถิติโปรเจ็ค

| รายการ | จำนวน |
|--------|-------|
| ไฟล์ Python | ~45 ไฟล์ |
| บรรทัดโค้ด | ~4,500+ บรรทัด |
| API Modules | 15 modules |
| ตารางฐานข้อมูล | 11 ตาราง |
| ประเภทรายงาน | 7 รายงาน (PDF + Excel) |

---

## 2. ข้อกำหนดเบื้องต้น (Prerequisites)

### ซอฟต์แวร์ที่ต้องติดตั้งก่อน

| ซอฟต์แวร์ | เวอร์ชันขั้นต่ำ | ลิงก์ดาวน์โหลด |
|-----------|---------------|---------------|
| **Python** | 3.10+ | https://www.python.org/downloads/ |
| **PostgreSQL** | 14+ | https://www.postgresql.org/download/ |
| **pgAdmin** (แนะนำ) | 4+ | https://www.pgadmin.org/download/ |
| **Git** | 2.30+ | https://git-scm.com/downloads |
| **Visual Studio Code** (แนะนำ) | ล่าสุด | https://code.visualstudio.com/ |

### ตรวจสอบว่าติดตั้งแล้ว

```bash
python --version        # ควรแสดง Python 3.10+
pip --version           # ควรแสดงเวอร์ชัน pip
psql --version          # ควรแสดง PostgreSQL 14+
git --version           # ควรแสดงเวอร์ชัน Git
```

---

## 3. การติดตั้งและตั้งค่า (Installation)

### ขั้นตอนที่ 1: Clone โปรเจ็ค

```bash
git clone <repository-url>
cd samss
```

### ขั้นตอนที่ 2: สร้าง Virtual Environment

```bash
# สร้าง virtual environment
python -m venv .venv

# เปิดใช้งาน (Windows)
.venv\Scripts\activate

# เปิดใช้งาน (macOS/Linux)
source .venv/bin/activate
```

### ขั้นตอนที่ 3: ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

> **หมายเหตุ:** ไฟล์ `requirements.txt` ล็อกเวอร์ชันทุก dependency ไว้แล้ว เพื่อให้ติดตั้งได้ผลลัพธ์เหมือนกันทุกครั้ง

### ขั้นตอนที่ 4: คัดลอกไฟล์ค่ากำหนด

```bash
# คัดลอกไฟล์ตัวอย่างค่า config
cp .env.example .env
```

จากนั้นแก้ไขไฟล์ `.env` ตามคำแนะนำในหัวข้อถัดไป

---

## 4. การตั้งค่าตัวแปรสภาพแวดล้อม (.env)

### ไฟล์ `.env` ทั้งหมดที่ต้องตั้งค่า

```env
# ──────────────────────────────────────
# 🗄️ Database — การเชื่อมต่อฐานข้อมูล
# ──────────────────────────────────────
DATABASE_URL=postgresql://username:password@localhost:5432/sams_db

# ──────────────────────────────────────
# 🔒 Security — ความปลอดภัย
# ──────────────────────────────────────
# ⚠️ SECRET_KEY ต้องยาวอย่างน้อย 32 ตัวอักษร (ไม่งั้นระบบจะไม่รันเลย)
# วิธีสร้าง: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=ใส่คีย์ลับยาว32ตัวอักษรขึ้นไป

# ระยะเวลา Token หมดอายุ (นาที) — ค่าแนะนำ = 480 (8 ชั่วโมง = 1 กะทำงาน)
ACCESS_TOKEN_EXPIRE_MINUTES=480

# ──────────────────────────────────────
# 🌐 App — URL สาธารณะ
# ──────────────────────────────────────
# URL ที่ Frontend จะเชื่อมต่อมา (ใส่เมื่อ deploy จริง)
PUBLIC_URL=https://your-domain.com

# ──────────────────────────────────────
# 💬 LINE — ค่ากำหนดระบบแจ้งเตือน
# ──────────────────────────────────────
# ดูจาก LINE Developers Console → Channel Settings
LINE_TOKEN=ใส่_Channel_Access_Token
LINE_GROUP_ID=ใส่_Group_ID_สำหรับแจ้ง_Admin
LINE_CHANNEL_SECRET=ใส่_Channel_Secret
LIFF_ID=ใส่_LIFF_App_ID
```

### ⚠️ ข้อควรระวัง

| ตัวแปร | ข้อจำกัด | ถ้าไม่ตั้งค่า |
|--------|---------|-------------|
| `DATABASE_URL` | ต้องมี | ❌ ระบบหยุดทำงานทันที (RuntimeError) |
| `SECRET_KEY` | ต้องยาว ≥ 32 ตัวอักษร | ❌ ระบบหยุดทำงานทันที |
| `LINE_TOKEN` | ต้องมี | ❌ ระบบหยุดทำงานทันที |
| `LINE_CHANNEL_SECRET` | ต้องมี | ❌ ระบบหยุดทำงานทันที |
| `LIFF_ID` | ต้องมี | ❌ ระบบหยุดทำงานทันที |
| `LINE_GROUP_ID` | แนะนำให้มี | ⚠️ ไม่แจ้ง Admin กลุ่ม (แต่ยังรันได้) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ค่าเริ่มต้น = 1440 | ✅ ใช้ค่าเริ่มต้นได้ |
| `PUBLIC_URL` | แนะนำให้มี | ⚠️ CORS อาจมีปัญหา |

### วิธีสร้าง SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

จะได้ค่าเช่น: `a1b2c3d4e5f6...` (64 ตัวอักษร) ให้นำไปใส่ในไฟล์ `.env`

---

## 5. การตั้งค่าฐานข้อมูล (Database)

### ขั้นตอนที่ 1: สร้างฐานข้อมูลใหม่

```bash
# เข้า PostgreSQL
psql -U postgres

# สร้างฐานข้อมูล
CREATE DATABASE sams_db ENCODING 'UTF8';

# ออกจาก psql
\q
```

### ขั้นตอนที่ 2: นำเข้าข้อมูลจากไฟล์ SQL

```bash
# นำเข้าโครงสร้างและข้อมูลจากไฟล์ sams.sql
psql -U postgres -d sams_db -f sams.sql
```

> **หมายเหตุ:** ไฟล์ `sams.sql` มีทั้งโครงสร้างตาราง, Trigger, Function, และข้อมูลตัวอย่าง (ถ้ามี)

### ขั้นตอนที่ 3: ตรวจสอบตาราง

```bash
psql -U postgres -d sams_db

# ดูตารางทั้งหมด
\dt

# ควรเห็นตารางเหล่านี้:
#  sams_users
#  sams_branch
#  sams_service
#  sams_material
#  material_type
#  material_stock
#  material_req
#  material_req_detail
#  material_reserved
#  material_issue
#  material_history
```

### การใช้ Alembic (Database Migration)

Alembic ใช้สำหรับจัดการเวอร์ชันโครงสร้างฐานข้อมูล เมื่อมีการเปลี่ยนแปลง Model

```bash
# ดูเวอร์ชันปัจจุบัน
cd backend
alembic current

# สร้าง migration ใหม่ (เมื่อแก้ไข model)
alembic revision --autogenerate -m "คำอธิบายสิ่งที่เปลี่ยน"

# อัปเดตฐานข้อมูลเป็นเวอร์ชันล่าสุด
alembic upgrade head

# ย้อนกลับ 1 เวอร์ชัน
alembic downgrade -1
```

> **ไฟล์ที่เกี่ยวข้อง:**
> - `backend/alembic.ini` — ค่ากำหนด Alembic
> - `backend/alembic/env.py` — ตั้งค่าเชื่อมต่อ DB (ดึง URL จาก `.env` อัตโนมัติ)
> - `backend/alembic/versions/` — ไฟล์ migration ทั้งหมด

---

## 6. การรันระบบ (Running the Application)

### รันแบบ Development

```bash
# จากโฟลเดอร์ root ของโปรเจ็ค (samss/)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

- `--reload` = โหลดใหม่อัตโนมัติเมื่อแก้โค้ด (ใช้ตอน dev เท่านั้น)
- `--host 0.0.0.0` = เปิดให้เข้าถึงจากเครื่องอื่นได้
- `--port 8000` = พอร์ตที่ใช้

### รันแบบ Production

```bash
# ไม่ใส่ --reload, ตั้งค่า ENV=production
ENV=production uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

- `--workers 4` = รัน 4 process พร้อมกัน (ปรับตาม CPU)
- `ENV=production` = ซ่อน Swagger UI และ ReDoc อัตโนมัติ

### ตรวจสอบว่ารันสำเร็จ

```
เปิดเบราว์เซอร์:
  ✅ http://localhost:8000          → {"message": "✅ SAMS Backend V2 is running!"}
  ✅ http://localhost:8000/health   → {"status": "healthy", "database": "connected"}
  📋 http://localhost:8000/docs     → Swagger UI (เฉพาะ dev mode)
```

---

## 7. โครงสร้างโปรเจ็ค (Project Structure)

```
samss/
│
├── .env                           # ⚠️ ค่าความลับ (ห้ามอัปโหลด Git)
├── .env.example                   # ตัวอย่างค่า config
├── .gitignore                     # กฎไม่ให้ Git ติดตาม
├── requirements.txt               # รายการ Dependencies (ล็อกเวอร์ชัน)
├── sams.sql                       # ⚠️ ไฟล์ SQL สำหรับสร้างฐานข้อมูล
│
├── static/                        # ไฟล์ที่อัปโหลด
│   ├── profiles/                  #   รูปโปรไฟล์พนักงาน
│   └── materials/                 #   รูปวัสดุ
│
├── tests/                         # ไฟล์ทดสอบ
│
└── backend/                       # ⭐ โค้ดหลักทั้งหมด
    ├── main.py                    # 🚀 จุดเริ่มต้น — ตั้งค่า FastAPI, Middleware, Router
    ├── config.py                  # ⚙️ ค่ากำหนดกลาง — โหลด .env + ตรวจสอบค่า
    ├── database.py                # 🗄️ เชื่อมต่อ DB — Connection Pool + Session
    │
    ├── login/                     # 🔐 ระบบยืนยันตัวตน
    │   ├── auth.py                #   API Login + Rate Limiting
    │   ├── auth_utils.py          #   BCrypt Hash + JWT Token
    │   └── dependencies.py        #   Guard Functions (ตรวจสิทธิ์)
    │
    ├── models/                    # 📐 ORM Models (แปลง Python ↔ SQL)
    │   ├── users.py               #   ตาราง sams_users
    │   ├── material.py            #   ตาราง sams_material, material_stock
    │   ├── master.py              #   ตาราง sams_branch, sams_service, material_type
    │   └── request.py             #   ตาราง material_req, detail, reserved, issue, history
    │
    ├── schemas/                   # 📋 Pydantic Schemas (ตรวจสอบข้อมูลเข้า-ออก)
    │   ├── users.py               #   Schema ผู้ใช้ + Login + Token
    │   ├── material.py            #   Schema วัสดุ
    │   ├── request.py             #   Schema ใบเบิก (Approve/Reject)
    │   ├── stock.py               #   Schema สต็อก
    │   ├── master.py              #   Schema สาขา/จุดบริการ
    │   └── branch_dashboard.py    #   Schema แดชบอร์ดสาขา
    │
    ├── routers/                   # 🛣️ API Endpoints (15 ไฟล์)
    │   ├── admin_requests.py      #   อนุมัติ/ปฏิเสธ/จ่ายวัสดุ
    │   ├── admin_report.py        #   API รายงาน
    │   ├── admin_report_export.py #   ส่งออก PDF/Excel
    │   ├── admin_stock.py         #   จัดการสต็อก
    │   ├── admin_users.py         #   จัดการผู้ใช้
    │   ├── branch_dashboard.py    #   แดชบอร์ดสาขา
    │   ├── dashboard.py           #   แดชบอร์ดรวม
    │   ├── inventory.py           #   คงคลัง + ส่งออก
    │   ├── line_router.py         #   LINE Webhook + LIFF
    │   ├── master.py              #   ข้อมูลมาสเตอร์
    │   ├── material_images.py     #   อัปโหลดรูปวัสดุ
    │   ├── materials.py           #   CRUD วัสดุ
    │   ├── requests.py            #   สร้าง/ดู/ยกเลิกใบเบิก
    │   └── users.py               #   โปรไฟล์ผู้ใช้
    │
    ├── services/                  # 💼 Business Logic
    │   └── report_service.py      #   Query กลางสำหรับรายงาน
    │
    ├── utils/                     # 🔧 เครื่องมือช่วย
    │   ├── line_notify.py         #   ส่ง LINE Push + Retry
    │   ├── pdf_generator.py       #   สร้าง PDF ใบเบิก
    │   ├── pdf_styles.py          #   สไตล์ฟอนต์ไทย (Sarabun)
    │   └── file_validation.py     #   ตรวจสอบไฟล์อัปโหลด
    │
    ├── fonts/                     # 🔤 ฟอนต์ภาษาไทย
    │   ├── Sarabun-Regular.ttf
    │   └── Sarabun-Bold.ttf
    │
    ├── tools/                     # 🛠️ สคริปต์ช่วย dev
    │   └── fix_login.py           #   สร้าง Hash รหัสผ่าน
    │
    └── alembic/                   # 📦 Database Migration
        ├── env.py
        └── versions/
```

### ไฟล์สำคัญที่ต้องระวัง

| ไฟล์ | ความสำคัญ | หมายเหตุ |
|------|----------|---------|
| `.env` | ⚠️ สูงมาก | มีรหัสผ่าน DB, SECRET_KEY, LINE Token — **ห้ามแชร์** |
| `sams.sql` | ⚠️ สูง | โครงสร้างฐานข้อมูลทั้งหมด + Trigger |
| `config.py` | สูง | ตรวจสอบค่า config — ถ้าค่าหาย ระบบหยุดทันที |
| `database.py` | สูง | ค่า Connection Pool — อย่าเปลี่ยนถ้าไม่จำเป็น |
| `fonts/` | ปานกลาง | ฟอนต์ Sarabun สำหรับ PDF ภาษาไทย — ห้ามลบ |

---

## 8. โครงสร้างฐานข้อมูล (Database Schema)

### ER Diagram (ตาราง 11 ตาราง)

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  sams_branch   │     │  sams_service  │     │ material_type  │
│  (สาขา)        │◄────│  (จุดบริการ)    │     │ (ประเภทวัสดุ)   │
│  branch_id PK  │     │  service_id PK │     │ mat_type_id PK │
│  branch_name   │     │  service_name  │     │ mat_type_name  │
└───────┬────────┘     │  branch_id FK  │     └───────┬────────┘
        │              └────────┬───────┘             │
        │                       │                     │
        ▼                       ▼                     ▼
┌──────────────────────────────────────┐   ┌──────────────────────┐
│           sams_users                  │   │   sams_material       │
│           (ผู้ใช้งาน)                  │   │   (วัสดุ)              │
│  user_id PK                          │   │  mat_id PK            │
│  emp_code UNIQUE                     │   │  mat_code UNIQUE      │
│  full_name, position, phone, email   │   │  mat_name             │
│  branch_id FK → sams_branch          │   │  mat_type_id FK       │
│  service_point_id FK → sams_service  │   │  unit_pack, unit_sub  │
│  user_role (User/Admin/BranchManager)│   │  price_per_pack       │
│  password (BCrypt Hash)              │   │  is_active, min_qty   │
│  is_active, can_request              │   │  image                │
│  line_user_id (LINE ผูกบัญชี)         │   └──────────┬───────────┘
│  profile_image                       │              │
└───────────────┬──────────────────────┘              │
                │                                     │
                ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│     material_req         │           │     material_stock       │
│     (ใบเบิก)             │           │     (สต็อกรับเข้า)       │
│  mat_req_id PK           │           │  stock_id PK             │
│  mat_req_code UNIQUE     │           │  mat_id FK               │
│  user_id FK → sams_users │           │  quantity                │
│  req_date                │           │  unit_price              │
│  total_price             │           │  import_date             │
│  req_status (Enum)       │           │  is_active               │
│  admin_note              │           └─────────────────────────┘
│  approved_at             │
│  rejected_at             │
│  issued_at               │
└──────────┬──────────────┘
           │
     ┌─────┼──────────────────┐
     ▼     ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ req_detail    │ │ reserved     │ │ issue        │
│ (รายการเบิก)  │ │ (จองสต็อก)   │ │ (จ่ายจริง)   │
│ detail_id PK │ │ reserve_id PK│ │ issue_id PK  │
│ mat_req_id FK│ │ mat_id FK    │ │ mat_id FK    │
│ mat_id FK    │ │ req_id FK    │ │ quantity     │
│ req_qty      │ │ quantity     │ │ issued_by    │
│ approve_qty  │ │ status (Enum)│ │ mat_req_id FK│
└──────────────┘ └──────────────┘ │ status (Enum)│
                                  └──────────────┘

┌──────────────────────────┐
│   material_history        │
│   (ประวัติเคลื่อนไหว)      │
│  history_id PK            │
│  mat_id FK                │
│  action_type (IN/OUT/     │
│    RESERVE/ADJUST)        │
│  quantity                 │
│  balance_after            │
│  emp_code                 │
│  ref_table, ref_id        │
│  action_date, created_at  │
└──────────────────────────┘
```

### สถานะ Enum ที่ใช้ในระบบ

**ReqStatus (สถานะใบเบิก):**
| สถานะ | ความหมาย |
|-------|---------|
| `PENDING` | รออนุมัติ |
| `APPROVED` | อนุมัติแล้ว (รอจ่ายวัสดุ) |
| `REJECTED` | ถูกปฏิเสธ |
| `CANCELLED` | ถูกยกเลิก (โดยผู้เบิก) |
| `ISSUED` | จ่ายวัสดุแล้ว (เสร็จสิ้น) |

**ReservedStatus (สถานะจองสต็อก):**
| สถานะ | ความหมาย |
|-------|---------|
| `RESERVED` | จองอยู่ (รออนุมัติ) |
| `APPROVED` | อนุมัติแล้ว (รอจ่าย) |
| `RELEASED` | ปล่อยคืน (ยกเลิก) |
| `ISSUED` | จ่ายแล้ว |
| `CANCELLED` | ยกเลิก |

**HistoryActionType (ประเภทเคลื่อนไหว):**
| ประเภท | ความหมาย |
|--------|---------|
| `IN` | รับของเข้าคลัง |
| `OUT` | เบิก/จ่ายออก |
| `RESERVE` | จองสต็อก |
| `ADJUST` | ปรับปรุงยอดด้วยมือ |

---

## 9. ระบบยืนยันตัวตน (Authentication)

### วิธีการทำงาน

```
1. พนักงานส่ง emp_code + password ไปที่ POST /auth/login
2. ระบบตรวจรหัสผ่านด้วย BCrypt
3. ถ้าถูกต้อง → สร้าง JWT Token ส่งกลับ
4. ทุกคำขอหลังจากนี้ → ส่ง Token ในส่วนหัว Authorization: Bearer <token>
5. Token หมดอายุ → ต้อง Login ใหม่
```

### ระดับสิทธิ์ (3 ระดับ)

| บทบาท | สิทธิ์ | ค่าใน DB |
|--------|-------|---------|
| **User** | เบิกวัสดุ, ดูใบเบิกตัวเอง, แก้โปรไฟล์ | `User` |
| **BranchManager** | สิทธิ์ User + ดูแดชบอร์ดสาขา | `BranchManager` |
| **Admin** | ทุกอย่าง: อนุมัติ, จัดการสต็อก/ผู้ใช้, รายงาน | `Admin` |

### การเปลี่ยนบทบาทผู้ใช้

```sql
-- เปลี่ยนพนักงาน emp_code = 'E001' เป็น Admin
UPDATE sams_users SET user_role = 'Admin' WHERE emp_code = 'E001';

-- เปลี่ยนเป็น BranchManager
UPDATE sams_users SET user_role = 'BranchManager' WHERE emp_code = 'E001';
```

หรือใช้ API: `PUT /admin/users/{user_id}` (ต้อง Login ด้วย Admin)

### Rate Limiting

- Login จำกัด **5 ครั้ง/นาที/IP** — ป้องกันการสุ่มเดารหัสผ่าน
- ถ้าเกิน → HTTP 429 "กรุณารอ 1 นาที"

---

## 10. API Endpoints ทั้งหมด

### วิธีดู API ทั้งหมด
เปิด **Swagger UI** (เฉพาะ dev mode): `http://localhost:8000/docs`

### สรุป API แบ่งตามกลุ่ม

#### 🔐 Authentication (`/auth`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| POST | `/auth/login` | เข้าสู่ระบบ | ทุกคน |
| GET | `/auth/me` | ดูข้อมูลตัวเอง | Login แล้ว |

#### 📦 Materials (`/materials`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| GET | `/materials/` | ดูวัสดุทั้งหมด | Login แล้ว |
| POST | `/materials/` | เพิ่มวัสดุใหม่ | Admin |
| PUT | `/materials/{id}` | แก้ไขวัสดุ | Admin |
| DELETE | `/materials/{id}` | ลบวัสดุ (soft delete) | Admin |

#### 📋 Requests (`/requests`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| POST | `/requests/` | สร้างใบเบิกวัสดุ | User (ที่ can_request=true) |
| GET | `/requests/` | ดูใบเบิกของตัวเอง | Login แล้ว |
| GET | `/requests/{id}` | ดูรายละเอียดใบเบิก | Login แล้ว |
| POST | `/requests/{id}/cancel` | ยกเลิกใบเบิก | เจ้าของใบเบิก |

#### ✅ Admin Requests (`/admin/requests`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| GET | `/admin/requests/pending` | ดูใบเบิกที่รออนุมัติ | Admin |
| GET | `/admin/requests/all` | ดูใบเบิกทั้งหมด (+ filter + pagination) | Admin |
| GET | `/admin/requests/{id}` | ดูรายละเอียดใบเบิก | Admin |
| POST | `/admin/requests/{id}/approve` | อนุมัติใบเบิก | Admin |
| POST | `/admin/requests/{id}/reject` | ปฏิเสธใบเบิก | Admin |
| POST | `/admin/requests/{id}/issue` | จ่ายวัสดุ (ตัดสต็อก) | Admin |
| GET | `/admin/requests/{id}/pdf` | ดาวน์โหลด PDF ใบเบิก | Admin / เจ้าของ |

#### 📊 Admin Stock (`/admin/stock`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| GET | `/admin/stock/overview` | ภาพรวมสต็อก (stock, reserved, available) | Admin |
| GET | `/admin/stock/low-stock` | วัสดุที่ available ≤ min_qty | Admin |
| GET | `/admin/stock/history` | ประวัติเคลื่อนไหวสต็อก | Admin |
| POST | `/admin/stock/receive` | รับวัสดุเข้าคลัง | Admin |
| PATCH | `/admin/stock/{id}/stock` | ปรับสต็อก (mode: set หรือ add) | Admin |

#### 👥 Admin Users (`/admin/users`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| GET | `/admin/users/` | ดูรายชื่อผู้ใช้ทั้งหมด | Admin |
| POST | `/admin/users/` | เพิ่มผู้ใช้ใหม่ | Admin |
| PUT | `/admin/users/{id}` | แก้ไขข้อมูลผู้ใช้ | Admin |
| DELETE | `/admin/users/{id}` | ลบผู้ใช้ (soft delete) | Admin |
| POST | `/admin/users/{id}/restore` | กู้คืนผู้ใช้ | Admin |

#### 👤 Users (`/users`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| GET | `/users/profile` | ดูโปรไฟล์ | Login แล้ว |
| PUT | `/users/profile` | แก้ไขโปรไฟล์ | Login แล้ว |
| PATCH | `/users/change-password` | เปลี่ยนรหัสผ่าน | Login แล้ว |

#### 📈 Dashboard
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| GET | `/dashboard/` | แดชบอร์ดรวม | Admin / BranchManager |
| GET | `/branch-dashboard/` | แดชบอร์ดสาขา | BranchManager |

#### 📊 Reports (`/admin/report`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| GET | `/admin/report/monthly` | สรุปรายเดือน | Admin |
| GET | `/admin/report/monthly-detail` | รายละเอียดใบเบิกรายเดือน | Admin |
| GET | `/admin/report/top-materials` | วัสดุยอดนิยม Top N | Admin |
| GET | `/admin/report/inventory-value` | มูลค่าคงคลัง | Admin |
| GET | `/admin/report/by-user` | สรุปแยกรายพนักงาน | Admin |
| GET | `/admin/report/export/*` | ส่งออก PDF / Excel | Admin |

#### 💬 LINE (`/line`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| POST | `/line/webhook` | รับ Event จาก LINE | LINE Server |
| GET | `/line/liff/register` | หน้าผูกบัญชี (LIFF HTML) | ทุกคน |
| POST | `/line/liff/register` | บันทึกการผูกบัญชี | ทุกคน |

#### 🗃️ Master Data (`/master`)
| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|--------|----------|---------|--------|
| GET | `/master/branches` | ดูสาขาทั้งหมด | Login แล้ว |
| GET | `/master/service-points` | ดูจุดบริการ | Login แล้ว |
| GET | `/master/material-types` | ดูประเภทวัสดุ | Login แล้ว |

---

## 11. ระบบ LINE Integration

### ภาพรวม

```
                    ┌─────────────┐
                    │   LINE App   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        [Follow Bot]  [LIFF Page]  [Receive Push]
              │            │            ▲
              ▼            ▼            │
     ┌────────────┐  ┌──────────┐  ┌───────────┐
     │  Webhook   │  │ ผูกบัญชี  │  │ แจ้งเตือน  │
     │  /line/    │  │ /liff/   │  │ อนุมัติ/   │
     │  webhook   │  │ register │  │ ปฏิเสธ/จ่าย│
     └────────────┘  └──────────┘  └───────────┘
```

### การตั้งค่า LINE (ทำครั้งเดียว)

#### ขั้นตอนที่ 1: สร้าง LINE Official Account
1. ไปที่ https://developers.line.biz/
2. สร้าง Provider → สร้าง Channel (Messaging API)
3. จดค่า:
   - **Channel Access Token** → ใส่ `LINE_TOKEN` ใน `.env`
   - **Channel Secret** → ใส่ `LINE_CHANNEL_SECRET` ใน `.env`

#### ขั้นตอนที่ 2: ตั้งค่า Webhook
1. ใน LINE Developers Console → Messaging API → Webhook Settings
2. เปิดใช้งาน Webhook
3. ใส่ Webhook URL: `https://your-domain.com/line/webhook`
4. กดปุ่ม Verify เพื่อทดสอบ

#### ขั้นตอนที่ 3: สร้าง LIFF App
1. ไปที่ LINE Developers Console → เลือก Channel
2. กดสร้าง LIFF App
3. ตั้งค่า:
   - Endpoint URL: `https://your-domain.com/line/liff/register`
   - Scope: `profile`
   - Size: `Tall` หรือ `Full`
4. จด **LIFF ID** → ใส่ `LIFF_ID` ใน `.env`

#### ขั้นตอนที่ 4: หา Group ID (ถ้าต้องการแจ้งกลุ่ม Admin)
1. เชิญ Bot เข้ากลุ่ม LINE ของ Admin
2. Group ID จะได้จาก Webhook event เมื่อ Bot ถูกเชิญ
3. ใส่ `LINE_GROUP_ID` ใน `.env`

### การแจ้งเตือนอัตโนมัติ

| เหตุการณ์ | แจ้งใคร | ข้อความ |
|-----------|--------|---------|
| สร้างใบเบิกใหม่ | Admin (กลุ่ม) | 📋 มีใบเบิกใหม่... |
| อนุมัติใบเบิก | User (ส่วนตัว) | ✅ ใบเบิกได้รับการอนุมัติ... |
| ปฏิเสธใบเบิก | User (ส่วนตัว) | ❌ ใบเบิกถูกปฏิเสธ... |
| จ่ายวัสดุ | User (ส่วนตัว) | 📦 เบิกจ่ายเรียบร้อย... |
| ผูกบัญชีสำเร็จ | User (ส่วนตัว) | ✅ ผูกบัญชีสำเร็จ... |

> **หมายเหตุ:** ระบบมี Retry อัตโนมัติ 3 ครั้ง (หน่วงเวลา 1 วินาที) หากส่ง LINE ไม่สำเร็จ

---

## 12. ระบบรายงาน (Report System)

### รายงานทั้ง 7 ประเภท

| # | ชื่อรายงาน | API | PDF | Excel | Filter |
|---|-----------|-----|-----|-------|--------|
| 1 | สรุปรายเดือน | `/admin/report/monthly` | ✅ | ✅ | ปี, สาขา |
| 2 | รายละเอียดใบเบิกรายเดือน | `/admin/report/monthly-detail` | ✅ | ✅ | ปี, สาขา |
| 3 | วัสดุยอดนิยม Top N | `/admin/report/top-materials` | ✅ | ✅ | ปี, สาขา, N |
| 4 | มูลค่าคงคลัง | `/admin/report/inventory-value` | ✅ | ✅ | สาขา |
| 5 | สรุปแยกรายพนักงาน | `/admin/report/by-user` | ✅ | ✅ | ปี, สาขา |
| 6 | รายงานคงคลัง | `/inventory/export/*` | ✅ | ✅ | — |
| 7 | ใบเบิกวัสดุ (เฉพาะราย) | `/admin/requests/{id}/pdf` | ✅ | — | — |

### ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|------|--------|
| `routers/admin_report.py` | API ดึงข้อมูลรายงาน |
| `routers/admin_report_export.py` | สร้าง PDF + Excel (720 บรรทัด) |
| `services/report_service.py` | Query กลาง 4 functions |
| `utils/pdf_generator.py` | สร้าง PDF ใบเบิกวัสดุ |
| `utils/pdf_styles.py` | สไตล์ฟอนต์ไทย Sarabun |
| `fonts/Sarabun-*.ttf` | ไฟล์ฟอนต์ (ห้ามลบ!) |

### ข้อมูลองค์กรใน PDF

ชื่อองค์กรที่แสดงใน PDF ตั้งค่าที่ `backend/utils/pdf_styles.py`:
```python
ORG_NAME_TH = "สหกรณ์อิสลามอัศศิดดีก จำกัด"
ORG_NAME_EN = "As-Siddeek Islamic Cooperative"
```

---

## 13. วงจรใบเบิกวัสดุ (Request Lifecycle)

### แผนภาพ State Machine

```
                     ┌─── User ยกเลิก ───→ CANCELLED
                     │                     (คืนสต็อกจอง)
                     │
สร้างใบเบิก → PENDING ─── Admin อนุมัติ ──→ APPROVED
(จองสต็อก)       │                             │
                  │                    ┌───────┴───────┐
                  │                    │               │
                  │              Admin จ่ายวัสดุ   User ยกเลิก
                  │               (ตัดสต็อก)     (คืนสต็อกจอง)
                  │                    │               │
                  │                    ▼               ▼
                  │                  ISSUED         CANCELLED
                  │
                  └─── Admin ปฏิเสธ ──→ REJECTED
                                       (คืนสต็อกจอง)
```

### สิ่งที่เกิดขึ้นในแต่ละขั้นตอน

| ขั้นตอน | เกิดอะไรขึ้น |
|---------|------------|
| **สร้างใบเบิก** | ตรวจ can_request → จองสต็อก (MaterialReserved) → แจ้ง Admin ผ่าน LINE |
| **อนุมัติ** | ปรับจำนวน approve_qty → อัปเดต Reserved → คำนวณ total_price → แจ้ง User |
| **จ่ายวัสดุ** | ล็อกแถวสต็อก → ตรวจสต็อกเพียงพอ → สร้าง MaterialIssue → DB Trigger ตัดสต็อก → บันทึก History → แจ้ง User |
| **ปฏิเสธ** | คืนสต็อกจอง (CANCELLED) → แจ้ง User พร้อมหมายเหตุ |
| **ยกเลิก** | ตรวจ ownership → คืนสต็อกจอง (RELEASED) |

---

## 14. ระบบสต็อกและการจอง (Stock & Reservation)

### สูตรคำนวณ

```
available_qty = stock_qty − SUM(reserved_qty ที่สถานะ RESERVED หรือ APPROVED)
```

- `stock_qty` = จำนวนจริงในคลัง
- `reserved_qty` = จำนวนที่ถูกจองจากใบเบิกที่รออนุมัติ/อนุมัติแล้ว
- `available_qty` = จำนวนที่เบิกได้จริง ณ ขณะนั้น

### ทำไมต้องมี Stock Reservation?

**ปัญหาเดิม:** พนักงาน A กับ B เบิกของชิ้นเดียวกัน (เหลือ 5 ชิ้น) เบิก 3 ชิ้นทั้งคู่ → ถ้าอนุมัติทั้ง 2 ใบ = ตัดสต็อก 6 ชิ้น → ติดลบ!

**วิธีแก้:** เมื่อ A สร้างใบเบิก 3 ชิ้น → จองทันที → B เห็น available = 2 ชิ้น → เบิกได้แค่ 2

### Row-Level Locking

เมื่อ Admin กดจ่ายวัสดุ ระบบจะล็อกแถวสต็อกบน Database:
```
SELECT ... FROM material_stock WHERE mat_id IN (...) FOR UPDATE
```
คำสั่งอื่นที่ทำพร้อมกันต้องรอจน Transaction นี้เสร็จ → ป้องกันตัดสต็อกชนกัน

---

## 15. ระบบรักษาความปลอดภัย (Security)

### มาตรการทั้ง 15 ข้อ

| # | มาตรการ | ป้องกันอะไร |
|---|---------|-----------|
| 1 | JWT HS256 Token | ยืนยันตัวตนทุกคำขอ |
| 2 | Token หมดอายุอัตโนมัติ | ลดเวลาเสี่ยงหาก Token หลุด |
| 3 | BCrypt Hashing + Random Salt | ป้องกันอ่านรหัสผ่านจาก DB |
| 4 | Rate Limiting (5/นาที/IP) | ป้องกัน Brute Force Login |
| 5 | RBAC 3 ระดับ + 4 Guards | ป้องกันเข้าถึงข้อมูลไม่มีสิทธิ์ |
| 6 | Magic Bytes Validation | ป้องกันอัปโหลดไฟล์ปลอม |
| 7 | File Size Limit 2MB | ป้องกัน DoS via ไฟล์ใหญ่ |
| 8 | escape_like() | ป้องกัน SQL Wildcard Injection |
| 9 | _safe_emp_code() | ป้องกัน Directory Traversal |
| 10 | Fail-fast Config | หยุดระบบทันทีถ้า config หาย |
| 11 | HMAC-SHA256 Webhook | ตรวจ LINE Webhook ปลอม |
| 12 | CORS Whitelist | ป้องกัน Cross-Origin Attack |
| 13 | ซ่อน Stack Trace | ป้องกัน Information Leakage |
| 14 | ซ่อน Swagger ใน Production | ป้องกันดูโครงสร้าง API |
| 15 | ORM Parameterized Queries | ป้องกัน SQL Injection 100% |

---

## 16. การสำรองและกู้คืนข้อมูล (Backup & Restore)

### สำรองข้อมูล (Backup)

```bash
# สำรองฐานข้อมูลทั้งหมด
pg_dump -U postgres -d sams_db -F c -f backup_$(date +%Y%m%d).dump

# สำรองเฉพาะข้อมูล (ไม่รวมโครงสร้าง)
pg_dump -U postgres -d sams_db --data-only -f data_backup.sql

# สำรองเป็น SQL ธรรมดา
pg_dump -U postgres -d sams_db -f backup.sql
```

### กู้คืนข้อมูล (Restore)

```bash
# กู้คืนจากไฟล์ .dump
pg_restore -U postgres -d sams_db -c backup_20260611.dump

# กู้คืนจากไฟล์ .sql
psql -U postgres -d sams_db -f backup.sql
```

### สำรองไฟล์อัปโหลด

```bash
# สำรองรูปโปรไฟล์ + รูปวัสดุ
cp -r static/profiles/ backup_profiles/
cp -r static/materials/ backup_materials/
```

### แนะนำ: ตั้งเวลาสำรองอัตโนมัติ

```bash
# สร้างไฟล์ backup_daily.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
pg_dump -U postgres -d sams_db -F c -f /path/to/backups/sams_$DATE.dump
echo "Backup completed: sams_$DATE.dump"
```

```bash
# ตั้งเวลารันทุกวันตี 2 (Linux crontab)
0 2 * * * /path/to/backup_daily.sh
```

---

## 17. เครื่องมือช่วยเหลือ (Utility Tools)

### สร้าง Hash รหัสผ่าน (กรณีลืมรหัสผ่าน)

```bash
cd backend
python tools/fix_login.py
# จะถาม: กรอกรหัสผ่าน:
# แล้วจะแสดง Hash ให้ก๊อปปี้ไปอัปเดตในฐานข้อมูล
```

หรือใส่รหัสผ่านตรง:
```bash
python tools/fix_login.py "NewPassword123"
```

จากนั้นนำ Hash ไปอัปเดตในฐานข้อมูล:
```sql
UPDATE sams_users SET password = '$2b$12$...(hash ที่ได้)...' WHERE emp_code = 'E001';
```

### เพิ่ม Admin คนแรก (กรณี DB ว่าง)

```sql
-- 1. สร้าง Hash ก่อนด้วย fix_login.py
-- 2. INSERT เข้า DB
INSERT INTO sams_users (emp_code, full_name, position, branch_id, phone, email, user_role, password, is_active, can_request)
VALUES ('ADMIN01', 'ผู้ดูแลระบบ', 'IT Admin', '001', '0800000000', 'admin@example.com', 'Admin', '$2b$12$...HASH...', true, false);
```

### ตรวจสอบสุขภาพระบบ

```bash
# ตรวจว่าระบบรันอยู่
curl http://localhost:8000/

# ตรวจว่า DB เชื่อมต่อได้
curl http://localhost:8000/health
```

---

## 18. การแก้ปัญหาที่พบบ่อย (Troubleshooting)

### ❌ ระบบไม่ยอมรัน — RuntimeError

| ข้อความ Error | สาเหตุ | วิธีแก้ |
|--------------|--------|--------|
| `DATABASE_URL is not set in .env` | ไม่มีไฟล์ `.env` หรือไม่มีค่า `DATABASE_URL` | สร้าง `.env` จาก `.env.example` แล้วใส่ค่า |
| `SECRET_KEY is not set or too short` | SECRET_KEY ไม่มีหรือสั้นกว่า 32 ตัว | สร้างใหม่: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `LINE_TOKEN is not set in .env` | ไม่ได้ตั้งค่า LINE Token | ดูค่าจาก LINE Developers Console |
| `LIFF_ID is not set in .env` | ไม่ได้ตั้งค่า LIFF ID | สร้าง LIFF App ใน LINE Developers Console |

### ❌ Login ไม่ได้

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|--------|
| "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง" | รหัสผ่านผิดหรือ emp_code ไม่มีใน DB | ตรวจสอบใน DB หรือรีเซ็ตด้วย `fix_login.py` |
| "รหัสพนักงานนี้ถูกปิดใช้งาน" | `is_active = false` | `UPDATE sams_users SET is_active = true WHERE emp_code = '...'` |
| HTTP 429 "พยายามเข้าสู่ระบบบ่อยเกินไป" | ลองเกิน 5 ครั้ง/นาที | รอ 1 นาทีแล้วลองใหม่ |

### ❌ PDF ภาษาไทยแสดงผลผิดหรือเป็นกล่อง

| สาเหตุ | วิธีแก้ |
|--------|--------|
| ไม่พบไฟล์ฟอนต์ Sarabun | ตรวจว่ามี `backend/fonts/Sarabun-Regular.ttf` และ `Sarabun-Bold.ttf` |
| ไฟล์ฟอนต์เสียหาย | ดาวน์โหลด Sarabun จาก Google Fonts ใหม่ |

### ❌ LINE แจ้งเตือนไม่ส่ง

| สาเหตุ | วิธีแก้ |
|--------|--------|
| `LINE_TOKEN` หมดอายุ | สร้าง Token ใหม่ใน LINE Developers Console |
| User ไม่ได้ผูก LINE | ให้พนักงานผูกบัญชีผ่าน LIFF |
| Bot ถูก Block | ให้พนักงานเพิ่มเพื่อน Bot ใหม่ |
| Webhook URL ไม่ถูกต้อง | ตรวจสอบ URL ใน LINE Developers Console |

### ❌ สต็อกแสดงผลไม่ถูกต้อง

| สาเหตุ | วิธีแก้ |
|--------|--------|
| มี Reserved ค้าง (ใบเบิกถูกยกเลิกแล้วแต่ Reserved ไม่ได้อัปเดต) | ตรวจตาราง `material_reserved` ที่ status ยังเป็น RESERVED/APPROVED |

```sql
-- ดู Reserved ที่ค้างอยู่
SELECT r.*, m.mat_name
FROM material_reserved r
JOIN sams_material m ON r.mat_id = m.mat_id
WHERE r.status IN ('RESERVED', 'APPROVED');

-- ถ้าใบเบิกถูกยกเลิกแล้ว ให้ปลด Reserved ด้วยมือ
UPDATE material_reserved SET status = 'CANCELLED'
WHERE req_id = <mat_req_id> AND status IN ('RESERVED', 'APPROVED');
```

### ❌ DB Connection หลุดบ่อย

| สาเหตุ | วิธีแก้ |
|--------|--------|
| Connection timeout จากฝั่ง DB | ระบบมี `pool_pre_ping=True` อยู่แล้ว ควรจะ auto-recover |
| PostgreSQL ปิดตัว | ตรวจ service: `systemctl status postgresql` |

---

## 19. แนวทางการพัฒนาต่อ (Future Development)

### สิ่งที่ยังพัฒนาต่อได้

| ลำดับ | ฟีเจอร์ | ความยาก | คำอธิบาย |
|-------|---------|---------|---------|
| 1 | **แจ้งเตือนวัสดุใกล้หมด** | ง่าย | ส่ง LINE เมื่อ available ≤ min_qty |
| 2 | **Unit Test** | ปานกลาง | เพิ่ม pytest ทดสอบ API ทุก endpoint |
| 3 | **Docker** | ปานกลาง | สร้าง Dockerfile + docker-compose.yml |
| 4 | **CI/CD** | ปานกลาง | GitHub Actions auto-deploy |
| 5 | **ระบบจัดซื้อ** | ยาก | เชื่อมวงจรเบิก → ขออนุมัติจัดซื้อ |
| 6 | **Mobile App** | ยาก | React Native หรือ Flutter |
| 7 | **WebSocket Dashboard** | ปานกลาง | Real-time update |

### ข้อแนะนำสำหรับนักพัฒนาคนถัดไป

1. **อ่าน Model ก่อน** — เริ่มจาก `backend/models/` เพื่อเข้าใจโครงสร้างข้อมูล
2. **ดู Router ที่ง่ายก่อน** — เริ่มจาก `master.py` (สั้น 80 บรรทัด) ก่อนไปอ่าน `admin_requests.py` (461 บรรทัด)
3. **ใช้ Swagger UI** — เปิด `/docs` แล้วลองเรียก API จะเข้าใจเร็วกว่าอ่านโค้ด
4. **อย่าลบฟอนต์** — `backend/fonts/` จำเป็นสำหรับ PDF ภาษาไทย
5. **อย่าเปลี่ยน Enum ใน Model** — ถ้าเปลี่ยนต้องอัปเดต DB ด้วย Alembic
6. **ดู `.env.example`** — ก่อนตั้งค่า production ใหม่

---

## 20. ข้อมูลติดต่อ

| รายการ | ข้อมูล |
|--------|-------|
| ผู้พัฒนา (V2) | [ใส่ชื่อคุณ] |
| อีเมล | [ใส่อีเมล] |
| โทรศัพท์ | [ใส่เบอร์] |
| GitHub | [ใส่ลิงก์ repository] |
| อาจารย์ที่ปรึกษา | ผศ. อาหมาน หมัดเจริญ |
| พี่เลี้ยง | นายศักรินทร์ สงฆ์รักษ์ (เจ้าหน้าที่พัฒนาระบบ) |

---

> **เอกสารนี้จัดทำขึ้นเพื่อส่งต่อโปรเจ็ค SAMS V2 ให้สหกรณ์อิสลามอัศศิดดีก จำกัด**
> **สำหรับใช้เป็นคู่มืออ้างอิงในการดูแลรักษาและพัฒนาระบบต่อไป**
