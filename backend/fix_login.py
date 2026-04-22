from passlib.context import CryptContext

# ตั้งค่าตัวเข้ารหัสแบบ bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# คำว่า 123456 คือรหัสผ่านที่เราต้องการปั่นให้เป็น Hash
hashed_password = pwd_context.hash("123456")

print("--------------------------------------------------")
print("ก๊อปปี้ข้อความด้านล่างนี้ไปใส่ในช่อง PASSWORD ของ pgAdmin ได้เลย:")
print(hashed_password)
print("--------------------------------------------------")