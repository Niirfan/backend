# backend/routers/line_router.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.users import User
from backend.utils.line_notify import send_line_message_to_user
from backend.schemas.users import LiffRegisterRequest
from backend.config import LINE_CHANNEL_SECRET, LIFF_ID, LIFF_URL
import hmac, hashlib, base64, httpx, json

router = APIRouter(prefix="/line", tags=["LINE"])


@router.get("/liff/register", response_class=HTMLResponse)
async def liff_register_page():
    return HTMLResponse(content=f"""
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ผูกบัญชี LINE</title>
  <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
  <style>
    * {{ box-sizing: border-box; }}
    body {{ font-family: sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f0f0; padding: 16px; margin: 0; }}
    .card {{ background: #fff; border-radius: 12px; padding: 24px; width: 100%; max-width: 360px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }}
    h2 {{ text-align: center; color: #06C755; margin-bottom: 16px; }}
    .line-user {{ text-align: center; color: #666; font-size: 14px; margin-bottom: 12px; }}
    input {{ width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 16px; margin-bottom: 12px; }}
    button {{ width: 100%; padding: 12px; background: #06C755; color: #fff; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }}
    button:disabled {{ opacity: 0.6; }}
    #message {{ margin-top: 12px; text-align: center; font-size: 14px; }}
  </style>
</head>
<body>
  <div class="card">
    <h2>ผูกบัญชี LINE</h2>
    <p id="lineUser" class="line-user"></p>
    <input id="empCode" type="text" placeholder="กรอกรหัสพนักงาน" onkeydown="if(event.key==='Enter') handleSubmit()" />
    <button id="btn" onclick="handleSubmit()">ยืนยัน</button>
    <p id="message"></p>
  </div>

  <script>
    let lineUserId = "";
    let liffAccessToken = "";

    liff.init({{ liffId: "{LIFF_ID}" }}).then(async () => {{
      if (!liff.isLoggedIn()) {{ liff.login(); return; }}
      const profile = await liff.getProfile();
      lineUserId = profile.userId;
      liffAccessToken = liff.getAccessToken();
      document.getElementById("lineUser").innerText = "LINE: " + profile.displayName;
    }}).catch(err => {{
      document.getElementById("message").innerText = "❌ เกิดข้อผิดพลาด: " + err.message;
    }});

    async function handleSubmit() {{
      const empCode = document.getElementById("empCode").value.trim();
      const btn = document.getElementById("btn");
      const msg = document.getElementById("message");

      if (!empCode) {{ msg.innerText = "กรุณากรอกรหัสพนักงาน"; return; }}
      if (!lineUserId) {{ msg.innerText = "กำลังโหลด กรุณารอสักครู่..."; return; }}

      btn.disabled = true;
      btn.innerText = "กำลังผูกบัญชี...";
      msg.innerText = "";

      try {{
        const res = await fetch("/line/liff/register", {{
          method: "POST",
          headers: {{ "Content-Type": "application/json" }},
          body: JSON.stringify({{
            emp_code: empCode,
            line_user_id: lineUserId,
            liff_access_token: liffAccessToken
          }})
        }});
        const data = await res.json();
        if (res.ok) {{
          msg.innerText = "✅ ผูกบัญชีสำเร็จ ยินดีต้อนรับ " + data.full_name;
          btn.innerText = "สำเร็จ";
        }} else {{
          msg.innerText = "❌ " + (data.detail || "เกิดข้อผิดพลาด");
          btn.disabled = false;
          btn.innerText = "ยืนยัน";
        }}
      }} catch {{
        msg.innerText = "❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
        btn.disabled = false;
        btn.innerText = "ยืนยัน";
      }}
    }}
  </script>
</body>
</html>
""")


@router.post("/webhook")
async def line_webhook(request: Request, db: Session = Depends(get_db)):
    raw_body = await request.body()
    if not raw_body:
        return JSONResponse(content={}, status_code=200)

    signature = request.headers.get("X-Line-Signature", "")
    expected = base64.b64encode(
        hmac.new(LINE_CHANNEL_SECRET.encode(), raw_body, hashlib.sha256).digest()
    ).decode()
    if not hmac.compare_digest(signature, expected):
        return JSONResponse(status_code=403, content={"error": "Invalid signature"})

    try:
        body = json.loads(raw_body)
    except Exception:
        return JSONResponse(content={}, status_code=200)

    for event in body.get("events", []):
        line_user_id = event["source"].get("userId")
        if not line_user_id:
            continue

        if event["type"] == "follow":
            await send_line_message_to_user(
                line_user_id,
                f"👋 ยินดีต้อนรับสู่ระบบเบิกพัสดุ!\n"
                f"กรุณาผูกบัญชีของคุณโดยกดลิงก์ด้านล่าง\n"
                f"{LIFF_URL}"
            )

    return JSONResponse(content={"status": "ok"}, status_code=200)


@router.post("/liff/register")
async def liff_register(data: LiffRegisterRequest, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.line.me/oauth2/v2.1/verify",
            params={"access_token": data.liff_access_token}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="LIFF token ไม่ถูกต้อง")

    user = db.query(User).filter(User.emp_code == data.emp_code).first()
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบรหัสพนักงานนี้ในระบบ")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="บัญชีนี้ถูกปิดใช้งานแล้ว")

    if user.line_user_id and user.line_user_id != data.line_user_id:
        raise HTTPException(status_code=400, detail="รหัสพนักงานนี้ถูกผูกกับ LINE อื่นไปแล้ว")

    existing = db.query(User).filter(
        User.line_user_id == data.line_user_id,
        User.emp_code != data.emp_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="LINE นี้ถูกผูกกับบัญชีอื่นแล้ว")

    user.line_user_id = data.line_user_id
    db.commit()

    await send_line_message_to_user(
        data.line_user_id,
        f"✅ ผูกบัญชีสำเร็จ\nยินดีต้อนรับ {user.full_name}\nคุณจะได้รับแจ้งเตือนผ่าน LINE นี้"
    )

    return {"message": "ผูกบัญชีสำเร็จ", "full_name": user.full_name}