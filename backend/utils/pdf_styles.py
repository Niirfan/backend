# backend/utils/pdf_styles.py
import os
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_FONT_DIR = os.path.join(_BASE_DIR, "..", "fonts")

try:
    pdfmetrics.registerFont(TTFont("Sarabun", os.path.join(_FONT_DIR, "Sarabun-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("Sarabun-Bold", os.path.join(_FONT_DIR, "Sarabun-Bold.ttf")))
    THAI_FONT = "Sarabun"
    THAI_FONT_BOLD = "Sarabun-Bold"
except Exception as e:
    print(f"[pdf_styles] ไม่พบฟอนต์ไทย: {e}")
    THAI_FONT = "Helvetica"
    THAI_FONT_BOLD = "Helvetica-Bold"

ORG_NAME_TH = "สหกรณ์อิสลามอัศศิดดีก จำกัด"
ORG_NAME_EN = "As-Siddeek Islamic Cooperative"


def th(size: int, bold: bool = False, align: int = 0) -> ParagraphStyle:
    return ParagraphStyle(
        f"th_{size}_{'b' if bold else 'n'}_{align}",
        fontName=THAI_FONT_BOLD if bold else THAI_FONT,
        fontSize=size,
        leading=size + 5,
        alignment=align,
    )