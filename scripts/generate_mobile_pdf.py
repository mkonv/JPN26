#!/usr/bin/env python3
"""Build the mobile-first PDF from the same JSON used by the website."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Japan_2026_mobile_itinerary.pdf"
# 393 x 852 is the iPhone 15 Pro CSS-pixel ratio; keeping that ratio reduces
# artificial page breaks when the PDF is viewed fit-to-width on the phone.
PAGE = (108 * mm, (108 * 852 / 393) * mm)
PAGE_W, PAGE_H = PAGE
MARGIN_X = 10 * mm
TOP = 11 * mm
BOTTOM = 12 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X

PAPER = HexColor("#F4F1E9")
CARD = HexColor("#FFFDF8")
INK = HexColor("#17231F")
MUTED = HexColor("#66716C")
LINE = HexColor("#D9D3C7")
PINE = HexColor("#123D34")
PINE_2 = HexColor("#225D4F")
PINE_SOFT = HexColor("#DCE9E4")
CORAL = HexColor("#D85A42")
CORAL_SOFT = HexColor("#F7E1DB")
GOLD = HexColor("#C9962F")
GOLD_SOFT = HexColor("#F5EAD2")
LAKE = HexColor("#345C73")
LAKE_SOFT = HexColor("#DFEAF0")
CHINA = HexColor("#3A4665")


def load_json(name: str):
    with (ROOT / "data" / name).open(encoding="utf-8") as stream:
        return json.load(stream)


TRIP = load_json("trip.json")
EXTRA = load_json("travel-enrichment.json")


def clean(value) -> str:
    """Escape text for ReportLab and enforce PDF-safe ASCII hyphens."""
    text = str(value)
    for old, new in (("–", "-"), ("—", "-"), ("‑", "-"), ("−", "-"), ("→", "->")):
        text = text.replace(old, new)
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return text


def link_text(text: str, url: str, color: str = "#345C73") -> str:
    return f'<link href="{clean(url)}" color="{color}"><u>{clean(text)}</u></link>'


pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Oblique", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu-Oblique")
pdfmetrics.registerFont(TTFont("NotoSansSC", str(ROOT / "assets" / "fonts" / "NotoSansSC-Regular.ttf")))


BASE = getSampleStyleSheet()
STYLES = {
    "body": ParagraphStyle("Body", fontName="DejaVu", fontSize=8.4, leading=12, textColor=INK, spaceAfter=0),
    "small": ParagraphStyle("Small", fontName="DejaVu", fontSize=6.8, leading=9.5, textColor=MUTED),
    "tiny": ParagraphStyle("Tiny", fontName="DejaVu", fontSize=5.8, leading=8, textColor=MUTED),
    "label": ParagraphStyle("Label", fontName="DejaVu-Bold", fontSize=6.2, leading=8, textColor=CORAL, tracking=1.25, uppercase=True),
    "h1": ParagraphStyle("H1", fontName="DejaVu-Bold", fontSize=24, leading=26, textColor=INK, spaceAfter=5 * mm),
    "h2": ParagraphStyle("H2", fontName="DejaVu-Bold", fontSize=16, leading=19, textColor=INK, spaceAfter=3 * mm),
    "h3": ParagraphStyle("H3", fontName="DejaVu-Bold", fontSize=10.5, leading=13, textColor=INK, spaceAfter=1.5 * mm),
    "hero_title": ParagraphStyle("HeroTitle", fontName="DejaVu-Bold", fontSize=27, leading=29, textColor=colors.white),
    "hero_sub": ParagraphStyle("HeroSub", fontName="DejaVu", fontSize=8.5, leading=12.5, textColor=HexColor("#D2E1DC")),
    "white_small": ParagraphStyle("WhiteSmall", fontName="DejaVu", fontSize=7, leading=10, textColor=HexColor("#E9EEEC")),
    "white_label": ParagraphStyle("WhiteLabel", fontName="DejaVu-Bold", fontSize=6.2, leading=8, textColor=HexColor("#EFC969"), tracking=1.1),
    "time": ParagraphStyle("Time", fontName="DejaVu-Bold", fontSize=8.2, leading=10, textColor=CORAL),
    "card_title": ParagraphStyle("CardTitle", fontName="DejaVu-Bold", fontSize=9, leading=11, textColor=INK),
    "toc_heading": ParagraphStyle("TOCHeading", fontName="DejaVu-Bold", fontSize=8, leading=11, textColor=INK, leftIndent=0, firstLineIndent=0),
    "toc_sub": ParagraphStyle("TOCSub", fontName="DejaVu", fontSize=7, leading=10, textColor=MUTED, leftIndent=4 * mm, firstLineIndent=0),
    "cn": ParagraphStyle("CN", fontName="NotoSansSC", fontSize=9.5, leading=13, textColor=INK),
}


class OutlineHeading(Paragraph):
    def __init__(self, text: str, level: int = 0, style=None):
        super().__init__(clean(text), style or STYLES["h1"])
        self.outline_text = clean(text)
        self.outline_level = level


class MobileDoc(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=PAGE,
            leftMargin=MARGIN_X,
            rightMargin=MARGIN_X,
            topMargin=TOP,
            bottomMargin=BOTTOM,
            title="Japan 2026 - mobile itinerary",
            author="Victoria and Misha",
            subject="Japan and China trip, 19 September - 3 October 2026",
        )
        frame = Frame(MARGIN_X, BOTTOM, CONTENT_W, PAGE_H - TOP - BOTTOM, id="mobile", showBoundary=0)
        self.addPageTemplates([PageTemplate(id="content", frames=[frame], onPage=draw_page)])
        self._outline_counter = 0

    def beforeDocument(self):
        self._outline_counter = 0
        super().beforeDocument()

    def afterFlowable(self, flowable):
        if not isinstance(flowable, OutlineHeading):
            return
        key = f"outline-{self._outline_counter}"
        self._outline_counter += 1
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(flowable.outline_text, key, level=flowable.outline_level, closed=False)
        self.notify("TOCEntry", (flowable.outline_level, flowable.outline_text, self.page, key))


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN_X, 8 * mm, PAGE_W - MARGIN_X, 8 * mm)
    canvas.setFont("DejaVu", 6.2)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 4.8 * mm, "JAPAN 2026 - OFFLINE MOBILE PLAN")
    canvas.drawRightString(PAGE_W - MARGIN_X, 4.8 * mm, f"{doc.page}")
    canvas.restoreState()


def p(text, style="body"):
    return Paragraph(clean(text), STYLES[style])


def rich(html, style="body"):
    return Paragraph(html, STYLES[style])


def label(text):
    return p(text.upper(), "label")


def section_title(text, level=1, outline=False):
    if outline:
        return OutlineHeading(text, level, STYLES["h2"] if level else STYLES["h1"])
    return p(text, "h2")


def card(contents: Iterable, background=CARD, border=LINE, padding=3.2 * mm, left_bar=None):
    inner = list(contents)
    if not inner:
        inner = [Spacer(1, 1)]
    table = Table([[inner]], colWidths=[CONTENT_W - (0.3 * mm if left_bar else 0)], hAlign="LEFT")
    commands = [
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.6, border),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
        ("ROUNDEDCORNERS", [3 * mm]),
    ]
    if left_bar:
        commands.append(("LINEBEFORE", (0, 0), (0, -1), 2.4, left_bar))
    table.setStyle(TableStyle(commands))
    return table


def badge(text, bg=PINE_SOFT, fg=PINE):
    table = Table([[Paragraph(clean(text), ParagraphStyle("Badge", fontName="DejaVu-Bold", fontSize=6.3, leading=8, textColor=fg, alignment=TA_CENTER))]])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0, bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 1.4 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.4 * mm),
        ("ROUNDEDCORNERS", [2.2 * mm]),
    ]))
    return table


def spacer(size=2.5):
    return Spacer(1, size * mm)


def hero_block(kicker: str, title: str, subtitle: str, color=PINE, details: list[str] | None = None):
    rows = [[p(kicker.upper(), "white_label")], [spacer(4)], [p(title, "hero_title")], [spacer(2)], [p(subtitle, "hero_sub")]]
    if details:
        rows.extend([[spacer(4)], [Table([[badge(item, HexColor("#FFFFFF22"), colors.white) for item in details]], hAlign="LEFT", style=[("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 2*mm)])]])
    outer = Table(rows, colWidths=[CONTENT_W])
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), color),
        ("LEFTPADDING", (0,0), (-1,-1), 5 * mm),
        ("RIGHTPADDING", (0,0), (-1,-1), 5 * mm),
        ("TOPPADDING", (0,0), (-1,-1), 3 * mm),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3 * mm),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("ROUNDEDCORNERS", [4 * mm]),
    ]))
    return outer


def timeline_table(items: list[dict], color=CORAL):
    data = []
    for item in items:
        detail = item.get("detail", "")
        title = item.get("title", "")
        data.append([
            Paragraph(clean(item.get("time", "")), ParagraphStyle("TLTime", fontName="DejaVu-Bold", fontSize=7.2, leading=10, textColor=color)),
            Paragraph(f"<b>{clean(title)}</b><br/><font color='#66716C' size='6.7'>{clean(detail)}</font>", ParagraphStyle("TLBody", fontName="DejaVu", fontSize=8, leading=10.5, textColor=INK)),
        ])
    table = Table(data, colWidths=[22 * mm, CONTENT_W - 22 * mm], splitByRow=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LINEBELOW", (0,0), (-1,-2), 0.4, LINE),
        ("LEFTPADDING", (0,0), (-1,-1), 2.2 * mm),
        ("RIGHTPADDING", (0,0), (-1,-1), 2.2 * mm),
        ("TOPPADDING", (0,0), (-1,-1), 2.3 * mm),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2.3 * mm),
        ("BACKGROUND", (0,0), (-1,-1), CARD),
        ("BOX", (0,0), (-1,-1), 0.6, LINE),
    ]))
    return table


def decision_card(decision: dict):
    rows = [
        [p("TRIGGER", "white_label"), p(decision["trigger"], "white_small")],
        [p("PROTECT", "white_label"), p(decision["protect"], "white_small")],
        [p("CUT", "white_label"), p(decision["cut"], "white_small")],
        [p("ACT", "white_label"), p(decision["fallback"], "white_small")],
    ]
    table = Table(rows, colWidths=[20 * mm, CONTENT_W - 20 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), PINE),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LINEBELOW", (0,0), (-1,-2), 0.4, HexColor("#FFFFFF22")),
        ("LEFTPADDING", (0,0), (-1,-1), 3 * mm),
        ("RIGHTPADDING", (0,0), (-1,-1), 3 * mm),
        ("TOPPADDING", (0,0), (-1,-1), 2.4 * mm),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2.4 * mm),
        ("ROUNDEDCORNERS", [3 * mm]),
    ]))
    return table


def flight_cards():
    output = []
    for flight in EXTRA["flights"]:
        route = Table([
            [p(flight["from"], "tiny"), p(flight["to"], "tiny")],
            [p(flight["depart"], "card_title"), Paragraph(clean(flight["arrive"]), ParagraphStyle("Arrive", parent=STYLES["card_title"], alignment=TA_RIGHT))],
        ], colWidths=[CONTENT_W/2 - 6*mm, CONTENT_W/2 - 6*mm])
        route.setStyle(TableStyle([("ALIGN", (1,0), (1,-1), "RIGHT"), ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0)]))
        output.extend([
            KeepTogether(card([
                Table([[p(flight["date"], "label"), Paragraph(clean(flight["flight"]), ParagraphStyle("Flight", fontName="DejaVu-Bold", fontSize=11, leading=13, textColor=CHINA, alignment=TA_RIGHT))]], colWidths=[CONTENT_W/2 - 8*mm, CONTENT_W/2 - 8*mm], style=[("ALIGN", (1,0), (1,-1), "RIGHT"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0)]),
                spacer(2), route, spacer(1.5), p(f"{flight['terminal']} · {flight['status']}", "small")
            ], border=HexColor("#C9CDD8"))), spacer(2)
        ])
    return output


def todo_cards():
    output = []
    status_color = {"action": CORAL, "verify": GOLD, "watch": LAKE, "done": PINE_2}
    for task in sorted(TRIP["bookingTasks"], key=lambda item: item["sortDate"]):
        color = status_color[task["status"]]
        head = Table([[p(task["deadline"], "label"), Paragraph(clean(task["status"].upper()), ParagraphStyle("Status", fontName="DejaVu-Bold", fontSize=6.2, leading=8, textColor=color, alignment=TA_RIGHT))]], colWidths=[CONTENT_W/2-8*mm, CONTENT_W/2-8*mm])
        head.setStyle(TableStyle([("ALIGN", (1,0), (1,-1), "RIGHT"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0)]))
        body = [head, spacer(1), p(task["title"], "card_title"), p(task["price"], "small"), spacer(1), p(task["action"], "body"), spacer(1), rich(f"<b>OFFLINE:</b> {clean(task['offline'])}", "small")]
        if task.get("url"):
            body.extend([spacer(1), rich(link_text("Official page", task["url"]), "small")])
        output.extend([KeepTogether(card(body, left_bar=color)), spacer(2)])
    return output


def china_stop(stop: dict, title: str, color=CHINA):
    output = [PageBreak(), OutlineHeading(title, 0, STYLES["h1"]), p(stop["dateLabel"], "label"), spacer(1), p(stop["summary"], "body"), spacer(3), label("Hour by hour"), spacer(1), timeline_table(stop["timeline"], color), spacer(4), label("One local taste - no detour"), spacer(1)]
    for item in stop["food"]:
        output.extend([KeepTogether(card([
            rich(f"<b>{clean(item['name'])}</b> · <font color='#D85A42'>{clean(item['dish'])}</font>", "body"),
            p(item["fit"], "small")
        ], background=HexColor("#F5E9DF"), border=HexColor("#E5CFC0"))), spacer(1.5)])
    if stop["id"] == "beijing-stopover":
        output.extend([spacer(2), card([rich("<b>BAGGAGE FORK:</b> Read the destination on the tag at SVO. PEK means collect in Beijing; KIX means it is checked through. Confirm again at the PEK transfer desk.", "body")], background=GOLD_SOFT, border=GOLD, left_bar=GOLD)])
    return output


def day_story(day: dict):
    enriched = EXTRA["dayEnrichment"][day["id"]]
    day_color = PINE if "Киото" in day["city"] else LAKE if "Хаконе" in day["city"] else HexColor("#283630") if "Токио" in day["city"] else CORAL
    hero_details = [f"{day['load']} · {day['distance']}", f"wake {day['wake']}"]
    output = [PageBreak(), OutlineHeading(f"Day {day['number']}. {day['title']}", 0, STYLES["h1"])]
    output.extend([
        hero_block(f"DAY {day['number']} OF 12 · {day['dateLabel']}", day["title"], f"{day['city']} · {day['summary']}", day_color, hero_details),
        spacer(3),
        label("Principle of the day"), spacer(1),
        card([p(day["principle"], "body")], background=CORAL_SOFT, border=HexColor("#E7C4BA"), left_bar=CORAL),
        spacer(3),
    ])
    anchors = Table([[badge(f"{anchor['time']}  {anchor['label']}", GOLD_SOFT, HexColor("#775716")) for anchor in day["anchors"]]], hAlign="LEFT")
    anchors.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 2*mm)]))
    output.extend([anchors, spacer(3), label("Main route"), spacer(1), timeline_table(day["timeline"], day_color)])
    if day.get("decision"):
        output.extend([spacer(4), label(day["decision"]["title"]), spacer(1), decision_card(day["decision"])])
    if day.get("alternate"):
        alt = day["alternate"]
        output.extend([spacer(4), label("Full alternate scenario"), spacer(1), p(alt["title"], "h3"), p(alt.get("note", ""), "small"), spacer(1), timeline_table(alt["timeline"], LAKE)])

    output.extend([PageBreak(), OutlineHeading(f"Day {day['number']} - parallel tracks", 1, STYLES["h2"]), p(day["dateLabel"], "label"), spacer(2), label("If time opened up"), spacer(1), p("Choose one nearby option only. Each card says when it works and what it replaces.", "small"), spacer(2)])
    for index, item in enumerate(enriched["alternatives"], start=1):
        output.extend([KeepTogether(card([
            rich(f"<font color='#D85A42'><b>{index}. {clean(item['name'])}</b></font> · {clean(item['delta'])}", "body"),
            rich(f"<b>WHEN:</b> {clean(item['when'])}", "small"),
            rich(f"<b>FIT:</b> {clean(item['swap'])}", "small"),
            rich(link_text("Open online", item["url"]), "small")
        ], background=HexColor("#F0F4EE"), border=HexColor("#CBD7CD"))), spacer(1.5)])

    output.extend([spacer(3), label("Gastronomic journey"), spacer(1), p("The first restaurant is the base choice. The rest protect against queues, closures, budget or a different signature dish.", "small"), spacer(2)])
    for meal in enriched["meals"]:
        option_rows = []
        for option in meal["options"]:
            marker = "BASE" if option.get("pick") else "ALT"
            score = option["score"] if str(option["score"]).startswith("Tabelog") or option["score"] == "включено" else f"Tabelog {option['score']}"
            name = link_text(option["name"], option["url"]) if option.get("url") else clean(option["name"])
            option_rows.append([
                Paragraph(clean(marker), ParagraphStyle("MealMarker", fontName="DejaVu-Bold", fontSize=6, leading=8, textColor=CORAL if marker == "BASE" else MUTED)),
                rich(f"<b>{name}</b> · {clean(score)}<br/><font color='#D85A42'>{clean(option['dish'])}</font><br/><font color='#66716C' size='6.4'>{clean(option['why'])} {clean(option['route'])}</font>", "small"),
            ])
        options = Table(option_rows, colWidths=[12 * mm, CONTENT_W - 20 * mm], splitByRow=1)
        options.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LINEBELOW", (0,0), (-1,-2), 0.35, LINE),
            ("LEFTPADDING", (0,0), (-1,-1), 1.5*mm),
            ("RIGHTPADDING", (0,0), (-1,-1), 1.5*mm),
            ("TOPPADDING", (0,0), (-1,-1), 2*mm),
            ("BOTTOMPADDING", (0,0), (-1,-1), 2*mm),
        ]))
        output.extend([KeepTogether(card([
            rich(f"<b>{clean(meal['time'])} · {clean(meal['label'])}</b>", "card_title"),
            p(meal["note"], "small"), spacer(1), options
        ], background=HexColor("#F8EFE8"), border=HexColor("#E5CEC0"), left_bar=CORAL)), spacer(2)])

    if day.get("shopping"):
        shop = day["shopping"]
        output.extend([spacer(2), label("Shopping in parallel"), spacer(1), card([
            rich(f"<b>{clean(shop['window'])}</b><br/>{clean(shop['goal'])}", "body"),
            spacer(1), p(" -> ".join(shop["stops"]), "small"),
            spacer(1), rich(f"<b>STOP RULE:</b> {clean(shop['rule'])}", "small")
        ], background=HexColor("#EFE7EF"), border=HexColor("#D5C6D4"), left_bar=HexColor("#6E536B"))])

    output.extend([spacer(3), card([p(EXTRA["meta"]["tabelogNote"], "tiny")], background=GOLD_SOFT, border=HexColor("#E2D3A8"))])
    return output


def food_passport():
    output = [PageBreak(), OutlineHeading("Food passport", 0, STYLES["h1"]), p("A realistic collection: core missions first, bonuses only when the route naturally matches.", "body"), spacer(4)]
    for group, title in (("must", "CORE DISHES"), ("bonus", "BONUS - NO DETOUR")):
        output.extend([label(title), spacer(1)])
        rows = []
        for item in EXTRA["foodPassport"]:
            if item["level"] != group:
                continue
            rows.append([
                Paragraph("□", ParagraphStyle("Box", fontName="DejaVu", fontSize=13, leading=14, textColor=PINE_2)),
                rich(f"<b>{clean(item['dish'])}</b><br/><font color='#D85A42' size='6.2'>{clean(item['region'])} · {clean(item['day'])}</font><br/><font color='#66716C' size='6.2'>{clean(item['note'])}</font>", "small")
            ])
        table = Table(rows, colWidths=[9*mm, CONTENT_W-9*mm], splitByRow=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), CARD),
            ("BOX", (0,0), (-1,-1), 0.6, LINE),
            ("LINEBELOW", (0,0), (-1,-2), 0.4, LINE),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING", (0,0), (-1,-1), 2.4*mm),
            ("RIGHTPADDING", (0,0), (-1,-1), 2.4*mm),
            ("TOPPADDING", (0,0), (-1,-1), 2.3*mm),
            ("BOTTOMPADDING", (0,0), (-1,-1), 2.3*mm),
        ]))
        output.extend([table, spacer(4)])
    return output


def pocket_pages():
    hotels = [EXTRA["additionalHotels"][0], *TRIP["hotels"], EXTRA["additionalHotels"][1]]
    output = [PageBreak(), OutlineHeading("Pocket reference", 0, STYLES["h1"]), p("Hotels, numbers and offline rules in one place.", "body"), spacer(4), label("Hotels in travel order"), spacer(1)]
    for hotel in hotels:
        body = [p(f"{hotel['city']} · {hotel['dates']}", "label"), p(hotel["name"], "card_title")]
        if hotel.get("localAddress"):
            body.extend([Paragraph(hotel["localAddress"], STYLES["cn"])])
        body.extend([p(hotel["address"], "small"), rich(f"<b>{clean(hotel['phone'])}</b>", "body")])
        if hotel.get("note"):
            body.append(p(hotel["note"], "tiny"))
        output.extend([KeepTogether(card(body)), spacer(1.5)])
    output.extend([spacer(3), label("Emergency"), spacer(1)])
    nums = Table([
        [badge("JAPAN POLICE 110", CORAL_SOFT, CORAL), badge("JAPAN AMBULANCE/FIRE 119", CORAL_SOFT, CORAL)],
        [badge("CHINA POLICE 110", LAKE_SOFT, CHINA), badge("CHINA AMBULANCE 120 / FIRE 119", LAKE_SOFT, CHINA)]
    ], colWidths=[CONTENT_W/2, CONTENT_W/2])
    nums.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 2*mm), ("TOPPADDING", (0,0), (-1,-1), 1*mm)]))
    output.extend([nums, spacer(4), label("Rules that matter"), spacer(1)])
    rules = [
        *TRIP["pocket"]["rules"],
        "For China keep onward tickets, hotel bookings and Chinese addresses offline.",
        "Check baggage destination on the physical tag; do not assume PEK or KIX.",
        "On 2 October reach NRT T1 around 13:15 for 3U3962 at 16:40.",
    ]
    for i, rule in enumerate(rules, 1):
        output.extend([KeepTogether(card([rich(f"<b>{i}.</b> {clean(rule)}", "body")], background=HexColor("#F8F6F0"))), spacer(1.3)])
    return output


def build_story():
    story = []
    story.extend([
        hero_block("VICTORIA + MISHA · FINAL MOBILE EDITION", "Japan 2026", "19 September - 3 October · Beijing -> Osaka -> Kyoto -> Hakone -> Tokyo -> Chengdu -> Moscow", PINE, ["15 calendar days", "12 Japan days", "4 flights"]),
        spacer(6),
        label("On the go, not a coffee-table book"), spacer(1),
        p("Open the PDF outline in Files or Books and jump straight to today's day. The main route comes first; alternatives, food and shopping stay on a second parallel page so they never obscure the next anchor.", "body"),
        spacer(4),
        card([rich("<b>1. Route:</b> follow the hour-by-hour list.<br/><b>2. Time opened:</b> choose one nearby alternative.<br/><b>3. Meal:</b> take the base choice, open the link only to check live hours.<br/><b>4. Delay:</b> protect the anchor and apply the cut rule.", "body")], background=PINE_SOFT, border=HexColor("#C5D6CF"), left_bar=PINE),
        spacer(6),
        p(f"Version {EXTRA['meta']['version']} · sources checked {EXTRA['meta']['sourceChecked']}", "tiny"),
        PageBreak(),
        OutlineHeading("Quick index", 0, STYLES["h1"]),
        p("Tap an entry. Page numbers are also shown for offline navigation.", "body"),
        spacer(4),
    ])
    toc = TableOfContents()
    toc.levelStyles = [STYLES["toc_heading"], STYLES["toc_sub"]]
    toc.dotsMinLevel = 0
    story.extend([toc, PageBreak(), OutlineHeading("Flights", 0, STYLES["h1"]), p("All four tickets are now part of the route. Times below follow the current booking data; recheck terminals in the airline app.", "body"), spacer(4), *flight_cards()])

    story.extend([PageBreak(), OutlineHeading("To do before departure", 0, STYLES["h1"]), p("Booking deadlines, China setup and the exact offline proof to keep.", "body"), spacer(4), *todo_cards()])

    rule = EXTRA["china"]["rule"]
    story.extend([PageBreak(), OutlineHeading("China transit rule", 0, STYLES["h1"]), card([
        p(rule["title"], "h3"), p(rule["summary"], "body"), spacer(2), rich(f"<b>KEEP:</b> {clean(rule['protect'])}", "small"), rich(f"<b>RECHECK:</b> {clean(rule['check'])}", "small"), spacer(2), rich(link_text("Official NIA rule", EXTRA["china"]["links"][0]["url"]), "small")
    ], background=LAKE_SOFT, border=HexColor("#BECED6"), left_bar=CHINA)])

    story.extend(china_stop(EXTRA["china"]["outbound"], "Beijing stopover"))
    for day in TRIP["days"]:
        story.extend(day_story(day))
    story.extend(china_stop(EXTRA["china"]["return"], "Chengdu stopover"))

    story.extend([PageBreak(), OutlineHeading("China preparation", 0, STYLES["h1"]), p("Complete before the two stopovers.", "body"), spacer(4)])
    for index, item in enumerate(EXTRA["china"]["prep"], 1):
        story.extend([KeepTogether(card([rich(f"<b>{index}.</b> {clean(item)}", "body")], background=LAKE_SOFT, border=HexColor("#C3CFD6"))), spacer(1.5)])
    story.extend([spacer(3), label("Official sources"), spacer(1)])
    for item in EXTRA["china"]["links"]:
        story.extend([rich(link_text(item["label"], item["url"]), "body"), spacer(1)])

    story.extend(food_passport())
    story.extend(pocket_pages())
    return story


def assert_ascii_hyphens(path: Path):
    from pypdf import PdfReader
    text = "\n".join(page.extract_text() or "" for page in PdfReader(path).pages)
    forbidden = [char for char in ("–", "—", "‑", "−") if char in text]
    if forbidden:
        raise RuntimeError(f"Forbidden dash characters in PDF text: {forbidden}")


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = MobileDoc(str(OUTPUT))
    doc.multiBuild(build_story())
    assert_ascii_hyphens(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
