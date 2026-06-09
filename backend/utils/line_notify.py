import httpx
import asyncio
import logging
from backend.config import LINE_TOKEN, LINE_GROUP_ID  

logger = logging.getLogger(__name__)


async def send_line_message(message: str):
    """ส่งไปกลุ่ม"""
    await _push(LINE_GROUP_ID, message)


async def send_line_message_to_user(line_user_id: str, message: str):
    """ส่งหา user ส่วนตัว"""
    await _push(line_user_id, message)


async def _push(to: str, message: str, max_retries: int = 3):
    if not to:
        logger.warning("LINE notify skipped: ไม่มี target (to=None)")
        return

    url = "https://api.line.me/v2/bot/message/push"
    headers = {
        "Authorization": f"Bearer {LINE_TOKEN}",
        "Content-Type": "application/json",
    }
    data = {
        "to": to,
        "messages": [{"type": "text", "text": message}],
    }

    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=data)
                if resp.status_code == 200:
                    return
                logger.warning(
                    "LINE API returned %s (attempt %d/%d): %s",
                    resp.status_code, attempt, max_retries, resp.text,
                )
        except Exception:
            logger.exception("LINE notify error (attempt %d/%d)", attempt, max_retries)

        if attempt < max_retries:
            await asyncio.sleep(1)

    logger.error("LINE notify failed after %d attempts — to=%s", max_retries, to)