from backend.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE material_req
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS issued_at   TIMESTAMP;
    """))
    conn.commit()
    print("✅ เพิ่ม column สำเร็จ")