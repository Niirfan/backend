# สคริปต์ช่วยสร้าง Hash รหัสผ่าน (ใช้สำหรับ dev เท่านั้น)

import sys
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password = sys.argv[1] if len(sys.argv) > 1 else input("กรอกรหัสผ่าน: ")
hashed = pwd_context.hash(password)

print("--" * 25)
print("ก๊อปปี้ Hash นี้ไปใส่ใน PASSWORD:")
print(hashed)
print("--" * 25)