# เอกสารสถาปัตยกรรมระบบหลังบ้านและแนวทางความปลอดภัยขั้นสูง (SAMS V2 Backend Architecture & Security Masterclass)

เอกสารฉบับนี้รวบรวมพิมพ์เขียวเชิงเทคนิค การออกแบบระบบรักษาความปลอดภัย การปรับจูนประสิทธิภาพฐานข้อมูล และหลักการเขียนคิวรี่ทั้งหมดในระบบหลังบ้านของโปรเจกต์ **SAMS (ระบบจัดการวัสดุสำนักงาน)** สำหรับนักพัฒนาและทีมเทคนิคใช้เป็นฐานข้อมูลและเตรียมความพร้อมในการนำเสนอระดับองค์กร

---

## 🗺️ สารบัญ (Table of Contents)
1. **สถาปัตยกรรมระบบหลังบ้านและโครงสร้างเว็บเซิร์ฟเวอร์ (Server Architecture)**
2. **ระบบความปลอดภัยและการยืนยันสิทธิ์ขั้นสูง (Authentication & Authorization)**
3. **การออกแบบระบบคัดกรองข้อมูลและความถูกต้อง (Pydantic Serialization)**
4. **การทำงานร่วมกับฐานข้อมูลและการปรับจูนประสิทธิภาพ (SQLAlchemy ORM Tuning)**
5. **ระบบประมวลผลสต็อกและระบบธุรกรรมแบบปลอดภัย (Inventory Control & Transactions)**
6. **ระบบพิมพ์รายงานสถิติและระบบส่งออกไฟล์ (Document Generation Engine)**
7. **ระบบความปลอดภัยของตัวแปรสภาพแวดล้อมและการตั้งค่า (.env Security)**
8. **ระบบการผูกบัญชีและการวิเคราะห์ลายเซ็น LINE Notify (LINE Integration Flow)**
9. **เก็งคำถาม-คำตอบเชิงเทคนิคสำหรับการนำเสนอ (Technical Q&A)**

---

## 🏛️ 1. สถาปัตยกรรมระบบหลังบ้านและโครงสร้างเว็บเซิร์ฟเวอร์ (Server Architecture)

ระบบหลังบ้านเลือกใช้งาน **FastAPI** ซึ่งพัฒนาขึ้นบนรากฐานของ **Starlette** (สำหรับการรับส่งข้อมูลผ่าน HTTP/WebSockets) และ **Uvicorn** (เป็น ASGI Web Server ความเร็วสูง) โดยมีรูปแบบโครงสร้างการไหลของข้อมูลแบ่งเป็น **3 ชั้นหลัก (3-Layer Architecture Pattern)**:

```text
[ Client/Frontend ]
       │  (ยิง HTTP Request)
       ▼
 ┌──────────┐      ┌─────────────┐
 │  Router  ├─────►│ Pydantic    │  (คัดกรองฟอร์แมตข้อมูลและเช็กความถูกต้อง)
 └────┬─────┘      │ Schema      │
      │            └─────────────┘
      ▼
 ┌──────────┐      ┌─────────────┐
 │ Service  ├─────►│ Dependency  │  (จัดการ Database Session และยืนยันสิทธิ์)
 └────┬─────┘      │ Injection   │
      │            └─────────────┘
      ▼
 ┌──────────┐      ┌─────────────┐
 │  Model   ├─────►│ Database    │  (คุยกับ PostgreSQL ผ่าน SQLAlchemy)
 └──────────┘      └─────────────┘
```

### 1.1 การปิดการเข้าถึงคู่มือระบบบนโปรดักชัน (Environment Separation)
เพื่อป้องกันแฮกเกอร์ตรวจค้นรายชื่อ URL และโครงสร้างคอลัมน์ของ API หลังบ้าน ระบบจะปิดการใช้งาน Swagger UI และ ReDoc อัตโนมัติเมื่อค่าตัวแปรสิ่งแวดล้อมอยู่ในระดับ `production`

*   **ตัวอย่างโค้ดจริง ([main.py](file:///d:/assiddeek/samss/backend/main.py#L33-L42)):**
    ```python
    _ENV = os.getenv("ENV", "development")

    app = FastAPI(
        title="SAMS API",
        docs_url=None if _ENV == "production" else "/docs",
        redoc_url=None if _ENV == "production" else "/redoc",
        openapi_url=None if _ENV == "production" else "/openapi.json",
    )
    ```

### 1.2 การปิดระบบการเปลี่ยนทางอัตโนมัติ (Disable Redirect Slashes)
ในการเขียน API หากผู้ใช้ส่งค่าที่ลงท้ายด้วยเครื่องหมายทับ เช่น `/admin/users/` แทนที่จะเป็น `/admin/users` FastAPI ปกติจะทำการ Redirect (HTTP 307) ซึ่งจะส่งผลให้โปรโตคอลฝั่งหน้าบ้านถูกรีเซ็ตและค่าข้อมูล (Payload) ของคำขอประเภท `POST`, `PUT` หล่นหายกลางคัน เราจึงปิดคุณสมบัตินี้ในจุดสำคัญ
*   **ตัวอย่างโค้ดจริง ([admin_users.py](file:///d:/assiddeek/samss/backend/routers/admin_users.py#L25)):**
    ```python
    router = APIRouter(prefix="/admin/users", redirect_slashes=False)
    ```

---

## 🔒 2. ระบบความปลอดภัยและการยืนยันสิทธิ์ขั้นสูง (Authentication & Authorization)

ระบบใช้สถาปัตยกรรมแบบ **Stateless Authentication** ผ่านกระบวนการจับคู่รหัสลับและความยินยอมผ่าน Token เพื่อความปลอดภัยและขยายสาขาเซิร์ฟเวอร์ได้ง่าย

### 2.1 การแฮชรหัสผ่านด้วยฟังก์ชันถ่วงเวลา (BCrypt Hashing)
ระบบใช้ไลบรารี `passlib` ร่วมกับตัวแปรอัลกอริทึม **BCrypt** ในการแปลงรหัสผ่านเป็นชุดอักษรลับ โดยคุณสมบัติพิเศษคือ:
*   **ระบบสุ่มเกลือ (Random Salt):** สุ่มหยอดข้อความต่อท้ายรหัสผ่านก่อนนำไปแฮช ทำให้แฮกเกอร์ไม่สามารถแฮกด้วยวิธี Rainbow Table ได้
*   **ความเร็วหน่วง (Work Factor):** ถ่วงเวลาในการแปลงค่า ป้องกันการเดารหัสสุ่มเร็วสูง (Brute-Force Protection)
*   **ตัวอย่างโค้ดจริง ([auth_utils.py](file:///d:/assiddeek/samss/backend/login/auth_utils.py#L6-L16)):**
    ```python
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)  # แปลงรหัสเป็นค่าแฮชทางเดียว

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)  # ตรวจสอบรหัสผ่านจริง
    ```

### 2.2 โครงสร้างระบบยืนยันสิทธิ์ (JWT Token Design)
เมื่อพนักงานล็อกอินสำเร็จ ระบบจะส่งรหัสสิทธิ์ในลักษณะ JSON Web Token (JWT) เพื่อนำไปแนบกับคำขอในส่วนหัว HTTP Header (`Authorization: Bearer <Token>`) ทุกครั้ง
*   **โค้ดตัวอย่างการถอดรหัสและการดักจับสิทธิ์ ([dependencies.py](file:///d:/assiddeek/samss/backend/login/dependencies.py#L19-L38)):**
    ```python
    from jose import jwt, JWTError
    from fastapi import Depends, HTTPException, status
    from fastapi.security import OAuth2PasswordBearer

    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

    def get_current_user(token: str = Depends(oauth2_scheme)):
        try:
            # ถอดรหัสลับด้วย SECRET_KEY และตรวจจับอายุการใช้งาน
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            emp_code: str = payload.get("sub")
            role: str = payload.get("role")
            if emp_code is None:
                raise HTTPException(status_code=401, detail="Token ไม่ถูกต้อง")
            return {"emp_code": emp_code, "role": role}
        except JWTError:
            raise HTTPException(status_code=401, detail="หมดเวลาใช้งาน กรุณาล็อกอินใหม่")
    ```

### 2.3 การป้องกันการยิงถล่มด้วย SlowAPI Rate Limiting
ดักจับหมายเลข IP ของเครื่องที่ส่งคำขอเข้ามา หากยิงรัวสปอยล์หรือสุ่มเดารหัสผ่านเกินเกณฑ์ที่ระบบกำหนด ระบบจะส่งข้อความปฏิเสธ (HTTP 429 Too Many Requests) กลับไปทันที
*   **ตัวอย่างโค้ดจริง ([login/auth.py](file:///d:/assiddeek/samss/backend/login/auth.py#L31-L32)):**
    ```python
    @router.post("/login")
    @limiter.limit("5/minute")  # ล็อกสิทธิ์ยิงล็อกอินสูงสุด 5 ครั้งต่อ 1 นาที
    def login(request: Request, login_data: UserLogin, db: Session = Depends(get_db)):
        ...
    ```

---

## 🗂️ 3. การออกแบบระบบคัดกรองข้อมูลและความถูกต้อง (Pydantic Serialization)

หลังบ้านควบคุมความแข็งแกร่งของโครงสร้างส่งข้อมูลผ่าน **Pydantic V2** โดยจะทำหน้าที่คัดกรองและส่งออกข้อมูล (Serialization) อย่างปลอดภัย

### 3.1 การตรวจสอบข้อมูลและเงื่อนไขแบบก้าวหน้า (Pydantic Fields Validators)
ใช้สำหรับจัดรูปแบบข้อมูลและบล็อกค่าตัวเลขที่ผิดพลาดตั้งแต่ปากทางเข้าเซิร์ฟเวอร์
*   **ตัวอย่างโค้ดจริง ([schemas/users.py](file:///d:/assiddeek/samss/backend/schemas/users.py#L88-L103)):**
    ```python
    from pydantic import BaseModel, EmailStr, field_validator

    class PasswordChange(BaseModel):
        current_password: str
        new_password: str

        @field_validator("new_password")
        @classmethod
        def validate_password(cls, v):
            if len(v) < 6:
                raise ValueError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
            return v
    ```

### 3.2 ระบบสกัดค่าข้อมูลเชิงลึกอัตโนมัติ (Model Validator BEFORE)
ในบางจุด หน้าบ้านของระบบออกแบบมาเพื่อดึงค่าชื่อตรง ๆ จากตารางที่สอง (เช่น ชื่อสาขา หรือชื่อจุดบริการ) แต่ในตารางข้อมูลหลักของเรามีเพียงค่าไอดีคีย์นอก เพื่อให้โค้ดสะอาดและระบบเร็วขึ้น เราจึงเขียน Validator ไปดึงความสัมพันธ์ออบเจกต์ฐานข้อมูลมารอไว้ตั้งแต่ขั้นตอนแปลงข้อมูล
*   **ตัวอย่างโค้ดจริง ([schemas/users.py](file:///d:/assiddeek/samss/backend/schemas/users.py#L40-L51)):**
    ```python
    from pydantic import model_validator

    class UserResponse(UserBase):
        user_id: int
        branch_name: Optional[str] = None

        @model_validator(mode="before")
        @classmethod
        def extract_branch_name(cls, obj):
            # ดึงชื่อสาขาขึ้นมาจากโมเดล Relationship อัตโนมัติก่อนส่งข้อมูลออก
            if hasattr(obj, "branch") and obj.branch:
                obj.__dict__["branch_name"] = obj.branch.branch_name
            return obj
    ```

---

## 💾 4. การทำงานร่วมกับฐานข้อมูลและการปรับจูนประสิทธิภาพ (SQLAlchemy ORM Tuning)

ฐานข้อมูลกลางเก็บข้อมูลในระบบ **PostgreSQL** และควบคุมผ่าน **SQLAlchemy ORM** ซึ่งเราตั้งค่าและจูนคำสั่ง (SQL Tuning) ให้รับภาระงานได้ดีที่สุด

### 4.1 การจูนท่อเชื่อมฐานข้อมูล (Database Connection Pool Parameters)
*   **`pool_size=5`:** เปิดสิทธิ์สายเชื่อมต่อค้างรอไว้สำหรับประมวลผลทันที 5 ท่อส่งข้อมูล
*   **`max_overflow=10`:** อนุญาตให้ขยายสายเพิ่มเติมชั่วคราวได้ถึง 10 สาย (รวมเป็น 15 สาย) เมื่อเซิร์ฟเวอร์โดนยิงกระหน่ำพร้อมกัน
*   **`pool_pre_ping=True`:** ป้องกันสายหลุดกลางคัน โดยตัว ORM จะ Ping ไปคุยกับฐานข้อมูลก่อนสั่งรันคำสั่งจริง เพื่อป้องกันข้อผิดพลาดการเชื่อมต่อพังค้างคาสาย
*   **`pool_recycle=3600`:** รีเซ็ตตัดสายและเชื่อมต่อท่อใหม่ทุก ๆ 1 ชั่วโมง ป้องกันปัญหารอยต่อแรมรั่วไหลจากฝั่ง Database Server

### 4.2 วิธีแก้ปัญหา N+1 Query Problem ด้วย Eager Loading
การตั้งค่าการคิวรีข้อมูลปกติจะเป็นแบบ Lazy Loading (ข้อมูลลูกจะยังไม่ถูกโหลดมาจนกว่าจะถูกเรียกใช้งานจริงในโค้ด) ซึ่งจะทำให้ฐานข้อมูลต้องรันคำสั่ง SQL ย่อยซ้ำ ๆ หลายรอบตามจำนวนแถวผลลัพธ์ เราจึงเปลี่ยนมาใช้ **Eager Loading** ในจุดสำคัญ
*   **ตัวอย่างโค้ดคิวรี ([admin_users.py](file:///d:/assiddeek/samss/backend/routers/admin_users.py#L53)):**
    ```python
    from sqlalchemy.orm import joinedload
    
    # ยิงคำสั่งดึงพนักงานและสาขาพ่วงมารอบเดียวด้วย SQL LEFT OUTER JOIN
    query = db.query(User).options(joinedload(User.branch))
    ```

### 4.3 วิธีเขียนคำสั่งจอยนอกแบบแสดงผลลัพธ์ครบทุกแถว (Left Outer Join)
ใช้ในส่วนที่ต้องการรายชื่อตารางหลักขึ้นมาให้หมด แม้รายการเชื่อมโยงในตารางที่สองจะไม่มีค่าเลยก็ตาม (เช่น ดึงรายชื่อสาขาทั้งหมดขึ้นมาแสดงยอดเบิก แม้บางสาขาสถิติยอดรวมจะเป็น 0)
*   **ตัวอย่างโค้ดคิวรี ([report_service.py](file:///d:/assiddeek/samss/backend/services/report_service.py#L170-L177)):**
    ```python
    results = db.query(User, Branch)\
                .join(MaterialReq, MaterialReq.user_id == User.emp_code)\
                .outerjoin(Branch, Branch.branch_id == User.branch_id)\
                .all()
    ```

### 4.4 การคำนวณข้อมูลแบบมีเงื่อนไขในคิวรีเดียว (Conditional Aggregation using CASE)
ระบบหลีกเลี่ยงการยิงคำสั่ง SQL ย่อยเพื่อแยกนับยอดสถานะต่าง ๆ ของระบบ โดยเปลี่ยนมาใช้เงื่อนไขตรวจสอบ `case` ภายในคำสั่ง SQL บรรทัดหลักคำสั่งเดียว:
*   **ตัวอย่างคิวรีจริง ([branch_dashboard.py](file:///d:/assiddeek/samss/backend/routers/branch_dashboard.py#L69-L73)):**
    ```python
    from sqlalchemy import case, func

    stats_row = db.query(
        func.count().label("total_requests"),
        # หากสถานะเป็น PENDING ให้นับยอดสะสมเพิ่มทีละ 1 หากไม่ใช่ให้เป็น 0
        func.sum(case((MaterialReq.req_status == ReqStatus.PENDING, 1), else_=0)).label("pending_count"),
        func.sum(case((MaterialReq.req_status == ReqStatus.APPROVED, 1), else_=0)).label("approved_count"),
    ).one()
    ```

---

## 📦 5. ระบบประมวลผลสต็อกและระบบธุรกรรมแบบปลอดภัย (Inventory Control & Transactions)

การอนุมัติและเบิกจ่ายวัสดุเป็นจุดวิกฤตของระบบหลังบ้าน (Critical Section) เนื่องจากมีประเด็นเรื่องจำนวนสต็อกและโอกาสการแย่งบันทึกข้อมูลชนกัน

### 5.1 ระบบล็อกระดับแถวข้อมูลป้องกันการแย่งพัสดุ (Row-Level Locking)
เมื่อเจ้าหน้าที่คลังกดบันทึกตัดจ่ายพัสดุพร้อมกัน ระบบจะทำการล็อกแถวข้อมูลสต็อกชิ้นนั้นด้วยฟังก์ชัน `.with_for_update()` เพื่อป้องกันไม่ให้คำสั่งขนานชุดอื่นเข้ามาปรับเปลี่ยนตัวเลขพร้อมกัน ซึ่งเป็นสาเหตุให้จำนวนของจริงเกิดยอดติดลบหรือแสดงผลคลาดเคลื่อน
*   **ตัวอย่างโค้ดจริง ([admin_requests.py](file:///d:/assiddeek/samss/backend/routers/admin_requests.py#L320-L326)):**
    ```python
    # ล็อกข้อมูลแถวสต็อกชิ้นนี้ไว้บน Database ห้ามโปรแกรมอื่นแก้ไขจนกว่า Transaction นี้จะสิ้นสุด
    stocks = {
        s.mat_id: s for s in
        db.query(MaterialStock)
        .filter(MaterialStock.mat_id.in_(mat_ids))
        .with_for_update()
        .all()
    }
    ```

### 5.2 การออกแบบโครงสร้างจองสต็อกล่วงหน้า (Stock Reservation System)
ระบบจะไม่หักลบจำนวนจริงจากสต็อกหลักเมื่อพนักงานส่งคำขอเบิกเข้ามาใหม่ แต่ระบบจะเพิ่มยอดลงตาราง **`material_reserved`** เพื่อตั้งจองไว้ชั่วคราว
*   **กระบวนการ:** `available_qty` (พัสดุที่กดเบิกได้จริง) = `stock_qty` (ยอดคงคลังทั้งหมด) - `reserved_qty` (ยอดสะสมที่จองอยู่จากใบคำขอที่รออนุมัติ) 
*   แนวทางนี้จะช่วยการันตีได้ว่าจะไม่มีปัญหาพนักงานกดเบิกของเกินจำนวนคงคลังจริงเด็ดขาด

---

## 📊 6. ระบบพิมพ์รายงานสถิติและระบบส่งออกไฟล์ (Document Generation Engine)

ระบบพัฒนาประสิทธิภาพการสกัดข้อมูลและรวบรวมพิมพ์เขียวเอกสารทางการทั้งในรูปแบบ **PDF** และ **Excel**

### 6.1 ระบบควบคุมสไตล์ตารางและบีบตัดคำภาษาไทย (ReportLab CJK Formatting)
แก้ปัญหาระบบพิมพ์ PDF ภาษาไทยตัวอักษรวิ่งชนขอบตารางและแสดงผลผิดพลาด โดยบังคับใช้งานฟังก์ชันจัดย่อหน้าแบบ `wordWrap="CJK"`
*   **ตัวอย่างโค้ดสไตล์ ([admin_report_export.py](file:///d:/assiddeek/samss/backend/routers/admin_report_export.py#L78-L89)):**
    ```python
    def _ps(name, font=None, size=11, bold=False, align=0, color=colors.black):
        return ParagraphStyle(
            name,
            fontName=(_FONT_BOLD if bold else _FONT),
            fontSize=size,
            leading=size + 3,
            textColor=color,
            wordWrap="CJK",  # ดักตัดคำแบ่งบรรทัดภาษาไทยอัตโนมัติ
            splitLongWords=1 # หักแบ่งตัวอักษรเมื่อยาวล้นขอบคอลัมน์
        )
    ```

### 6.2 ระบบขยายความกว้างช่องคอลัมน์ Excel อัตโนมัติ (openpyxl Auto-fit Width)
*   **ตัวอย่างโค้ดจริง ([admin_report_export.py](file:///d:/assiddeek/samss/backend/routers/admin_report_export.py#L281-L285)):**
    ```python
    def _xl_autowidth(ws):
        for col in ws.columns:
            letter = get_column_letter(col[0].column)
            # หาขนาดของข้อความที่ยาวที่สุดในคอลัมน์ แล้วขยายความกว้าง Excel คอลัมน์นั้นตามค่าสูงสุด
            width = max((len(str(cell.value or "")) for cell in col), default=8)
            ws.column_dimensions[letter].width = min(width + 4, 42)
    ```

---

## ⚙️ 7. ระบบความปลอดภัยของตัวแปรสภาพแวดล้อมและการตั้งค่า (.env Security)

การจัดเก็บข้อมูลการเชื่อมโยงระบบและความลับสำคัญทั้งหมด จะถูกควบคุมและโหลดใช้งานอย่างมั่นคงปลอดภัยผ่านไลบรารี `dotenv`

### 7.1 ระบบเฝ้าระวังคีย์ลับพังและสั้นเกินไป (Fail-Safe Verification)
ระบบจะทำการเช็กค่าข้อมูลความลับทันทีก่อนสตาร์ตเครื่องหลังบ้าน หากตัวแปรสำคัญหายไปหรือสั้นจนสุ่มเดาง่ายเกินเกณฑ์ จะสั่ง **Crash ระบบ** ทันที เพื่อป้องกันแอปพลิเคชันทำงานแบบเปิดเผยความปลอดภัยต่ำ
*   **ตัวอย่างโค้ดจริง ([config.py](file:///d:/assiddeek/samss/backend/config.py#L12-L31)):**
    ```python
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set in .env")  # หยุดรันเครื่องทันที

    SECRET_KEY = os.getenv("SECRET_KEY")
    # ตรวจสอบความปลอดภัยของ Secret key ป้องกันแฮกเกอร์ถอดลายเซ็น JWT
    if not SECRET_KEY or len(SECRET_KEY) < 32:
        raise RuntimeError("SECRET_KEY is not set or too short")
    ```

---

## 💬 8. ระบบการผูกบัญชีและการวิเคราะห์ลายเซ็น LINE Notify (LINE Integration Flow)

หลังบ้านเชื่อมระบบเข้าหาแชตบอตและแจ้งเตือนพนักงานผ่านโปรโตคอล LINE Messaging API และ LINE LIFF (Line Front-end Framework)

### 8.1 การถอดรหัสตรวจสอบความถูกต้องของแชตบอต Webhook (HMAC-SHA256)
*   **การทำงาน:** เมื่อมีการเคลื่อนไหวเกิดขึ้นบน LINE ระบบจะยิง Webhook event มาหาหลังบ้าน ในขั้นแรกหลังบ้านต้องแปลงตัวข้อความที่ส่งมา (`raw_body`) ผสมรวมกับรหัสช่องส่ง (`LINE_CHANNEL_SECRET`) ด้วยวิธีเข้ารหัสสมมาตรประเภท HMAC-SHA256 แล้วนำไปเปรียบเทียบค่าแบบปลอดภัยกับ `X-Line-Signature` ใน Header เพื่อรับประกันว่าข้อมูลถูกส่งมาจากเซิร์ฟเวอร์ LINE จริง ๆ
*   **ตัวอย่างโค้ดตรวจสอบลายเซ็นจริง ([line_router.py](file:///d:/assiddeek/samss/backend/routers/line_router.py#L109-L114)):**
    ```python
    import hmac, hashlib, base64

    signature = request.headers.get("X-Line-Signature", "")
    expected = base64.b64encode(
        hmac.new(LINE_CHANNEL_SECRET.encode(), raw_body, hashlib.sha256).digest()
    ).decode()
    
    # ตรวจเปรียบเทียบลายเซ็นแบบป้องกันความพยายามเดาช่องว่างของเวลา (Timing Attacks)
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=403, detail="Signature Verification Failed")
    ```

---

## ❓ 9. เก็งคำถาม-คำตอบเชิงเทคนิคสำหรับการนำเสนอ (Technical Q&A)

### Q1: ทำไมสถาปัตยกรรมหลังบ้านถึงต้องใช้ ORM (SQLAlchemy) แทนการคิวรีเขียน SQL เองโดยตรง?
**คำตอบ:** 
1.  **ลดโอกาสเกิดช่องโหว่ SQL Injection 100%:** เนื่องจาก ORM ใช้รูปแบบการแปลงเป็น Parameterized Queries อัตโนมัติ ทำให้ผู้ใช้ไม่สามารถฉีดคำสั่ง SQL ดิบแฝงเข้ามาในช่องกรอกข้อมูลได้
2.  **ความเป็นอิสระจากประเภทฐานข้อมูล (Database Agnostic):** หากวันใดต้องการย้ายระบบจาก PostgreSQL ไปทำงานบน MySQL หรือ Oracle เราแก้ไขคีย์ที่ตัวแปรใน `.env` เพียงบรรทัดเดียวได้เลยโดยไม่ต้องมานั่งไล่ตามแก้ไวยากรณ์ SQL ในโค้ดอีกต่อไป

### Q2: ในระดับการอนุมัติและตัดของในคลังพร้อมกัน ป้องกันปัญหา "ของเกินคงเหลือจริง" หรือ "ตัดสต็อกติดลบ" อย่างไร?
**คำตอบ:** 
ระบบใช้กระบวนการแก้ไขปัญหา 2 ด่านหลัก:
1.  **ตารางจองสต็อกชั่วคราว (MaterialReserved):** เมื่อคำขอส่งมาจะเข้าแถวจองก่อน ทำให้คนเบิกรายถัดไปจะดึงข้อมูลมาเทียบและเบิกเกิน `available_qty` ไม่ได้
2.  **Row-Level Locking (`with_for_update`):** ขณะที่แอดมินกำลังกดยืนยันจ่ายวัสดุจริง ระบบจะทำการทำเครื่องหมายล็อกแถวสต็อกรายการชิ้นนั้นบนฐานข้อมูลทันที ทำให้สิทธิ์คำสั่งยิงพร้อมกันจากแอดมินคนอื่น ๆ ต้องเข้าคิวรอก่อน เพื่อตัดปัญหาแย่งแก้ข้อมูลชนกัน (Race Condition)

### Q3: มีมาตรการการป้องกัน Token ล็อกอินรั่วไหล และกำหนดความคุ้มครองอย่างไร?
**คำตอบ:** 
1.  **การแฮชลายเซ็นดิจิทัล:** ทุก Token ที่ส่งออกมาจะถูกเข้ารหัสลงชื่อด้วยคีย์สิทธิ์ลับ `SECRET_KEY` ยาวเกิน 32 อักขระและถอดรหัสด้วยวิธีสมมาตรผ่านโปรโตคอล `HS256` 
2.  **ระบบสิ้นสุดอายุการใช้งานอัตโนมัติ (Expiration Time):** ตัว Token จะเก็บข้อมูลคีย์ `exp` ระบุเวลาหมดอายุใช้งานชัดเจน โดยระบบเรากำหนดไว้ที่ 1440 นาที (24 ชั่วโมง) เพื่อลดหน้าต่างเวลาสำหรับแฮกเกอร์หากแอบแฝงขโมย Token ของผู้ใช้ไปรันระบบภายนอก
3.  **เก็บข้อมูลประวัติการทำงานแบบไร้สถานะ (Stateless):** ไม่มีเซสชันค้างบนแรมของหลังบ้าน ทำให้หลังบ้านรับปริมาณโหลดงานเบิกพัสดุและขยายเซิร์ฟเวอร์ขึ้นคลาวด์ได้ทันที
