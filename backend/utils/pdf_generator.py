# backend/routers/pdf_generator.py
import io
import os
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import ParagraphStyle

from backend.utils.pdf_styles import th as _th, THAI_FONT, ORG_NAME_TH, ORG_NAME_EN

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_LOGO_PATH = os.path.join(_BASE_DIR, "..", "static", "logo.png")


def build_request_pdf(req: dict, user_fullname: str, items: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=15*mm, bottomMargin=15*mm,
    )

    story = []

    logo_cell = ""
    if os.path.exists(_LOGO_PATH):
        logo_cell = Image(_LOGO_PATH, width=22*mm, height=22*mm)

    org_block = [
        Paragraph(ORG_NAME_TH, _th(14, bold=True, align=0)),
        Paragraph(ORG_NAME_EN, _th(10, align=0)),
    ]
    doc_title_block = [
        Paragraph("ใบเบิกวัสดุ / อุปกรณ์", _th(16, bold=True, align=2)),
        Paragraph("Material Requisition Form", _th(10, align=2)),
    ]

    header_top = Table([[logo_cell, org_block, doc_title_block]], colWidths=[28*mm, 70*mm, 72*mm])
    header_top.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("ALIGN", (2, 0), (2, 0), "RIGHT"),
    ]))
    story.append(header_top)

    story.append(Spacer(1, 2*mm))
    story.append(Table([[""]], colWidths=[170*mm], style=TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 1.0, colors.black),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ])))
    story.append(Spacer(1, 5*mm))

    req_date = req.get("req_date")
    req_date_str = req_date.strftime("%d/%m/%Y %H:%M") if isinstance(req_date, datetime) else "-"
    req_code = req.get("mat_req_code", "-")
    emp_code = req.get("user_id", "-")
    branch = req.get("branch_name", req.get("branch_id", "-"))

    info_table = Table([
        [
            Paragraph(f"<b>เลขที่ใบเบิก:</b> {req_code}", _th(11)),
            Paragraph(f"<b>วันที่ทำรายการ:</b> {req_date_str}", _th(11)),
        ],
        [
            Paragraph(f"<b>รหัสพนักงาน:</b> {emp_code}", _th(11)),
            Paragraph(f"<b>ชื่อผู้ขอเบิก:</b> {user_fullname}", _th(11)),
        ],
        [
            Paragraph(f"<b>สาขา / ส่วนงาน:</b> {branch}", _th(11)),
            Paragraph("", _th(11)),
        ]
    ], colWidths=[85*mm, 85*mm])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 8*mm))

    rows = [[
        Paragraph("ลำดับ", _th(10, True, align=1)),
        Paragraph("รหัสวัสดุ", _th(10, True, align=1)),
        Paragraph("รายการวัสดุ", _th(10, True, align=1)),
        Paragraph("หน่วยนับ", _th(10, True, align=1)),
        Paragraph("ขอเบิก", _th(10, True, align=1)),
        Paragraph("อนุมัติ", _th(10, True, align=1)),
        Paragraph("หมายเหตุ", _th(10, True, align=1)),
    ]]

    for i, item in enumerate(items, 1):
        rows.append([
            Paragraph(str(i), _th(10, align=1)),
            Paragraph(str(item.get("mat_id", "-")), _th(10, align=1)),
            Paragraph(str(item.get("mat_name", "-")), _th(10)),
            Paragraph(str(item.get("unit") or "-"), _th(10, align=1)),
            Paragraph(str(item.get("req_qty", "-")), _th(10, align=1)),
            Paragraph(str(item.get("approve_qty", "-")), _th(10, align=1)),
            Paragraph("", _th(10, align=1)),
        ])

    item_table = Table(rows, colWidths=[12*mm, 20*mm, 60*mm, 18*mm, 18*mm, 18*mm, 24*mm], repeatRows=1)
    item_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 20*mm))

    sign_table = Table([
        [
            Paragraph("ผู้ขอเบิก", _th(10, align=1)),
            Paragraph("ผู้อนุมัติ / ผู้จ่ายพัสดุ", _th(10, align=1))
        ],
        [
            Paragraph("______________________", _th(10, align=1)),
            Paragraph("______________________", _th(10, align=1))
        ],
        [
            Paragraph(f"({user_fullname})", _th(10, align=1)),
            Paragraph("(................................)", _th(10, align=1))
        ],
        [
            Paragraph("วันที่ _______/_______/_______", _th(9, align=1)),
            Paragraph("วันที่ _______/_______/_______", _th(9, align=1))
        ],
    ], colWidths=[85*mm, 85*mm])
    sign_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(sign_table)

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        f"{datetime.now().strftime('%d/%m/%Y %H:%M')}",
        ParagraphStyle("footer", fontName=THAI_FONT, fontSize=8,
                       textColor=colors.black, alignment=2)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()