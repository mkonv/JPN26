#!/usr/bin/env python3
"""Build the mobile-first PDF from the same JSON used by the website."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

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
SHOPPING = load_json("shopping-guide.json")


def clean(value) -> str:
    """Escape text for ReportLab and enforce PDF-safe ASCII hyphens."""
    text = str(value)
    # The bundled SC face lacks the Japanese simplified glyph 麺; its
    # traditional form 麵 is semantically equivalent and present in the font.
    text = text.replace("麺", "麵")
    for old, new in (("–", "-"), ("—", "-"), ("‑", "-"), ("−", "-"), ("→", "->")):
        text = text.replace(old, new)
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # ReportLab does not provide automatic font fallback. Wrap any CJK run so
    # mixed Latin/Cyrillic lines (addresses, dish names) keep valid Unicode
    # glyphs instead of extracting as NUL characters.
    text = re.sub(
        r"([\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]+)",
        r'<font name="NotoSansSC">\1</font>',
        text,
    )
    return text


def canonical_google_maps_url(raw_url: str, fallback_query: str = "") -> str:
    """Use Google's documented Maps URL API for text and Place-ID bookmarks."""
    if not raw_url:
        return raw_url
    try:
        parsed = urlparse(raw_url)
    except ValueError:
        return raw_url
    if parsed.hostname not in {"google.com", "www.google.com"} or not parsed.path.startswith("/maps/"):
        return raw_url
    if parsed.path.startswith("/maps/search"):
        return raw_url
    if parsed.path.rstrip("/") == "/maps/place":
        query = parse_qs(parsed.query).get("q", [""])[0]
        if query.startswith("place_id:"):
            place_id = query.removeprefix("place_id:").strip()
            label = fallback_query.strip() or place_id
            if place_id and label:
                return f"https://www.google.com/maps/search/?api=1&query={quote_plus(label)}&query_place_id={quote_plus(place_id)}"
        return raw_url
    prefix = "/maps/place/"
    if not parsed.path.startswith(prefix):
        return raw_url
    remainder = parsed.path[len(prefix):].rstrip("/")
    if not remainder or "/@" in remainder or "/data=" in remainder:
        return raw_url
    query = unquote(remainder.replace("+", " ")).strip()
    if not query:
        return raw_url
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus(query)}"


def link_text(text: str, url: str, color: str = "#345C73") -> str:
    safe_url = canonical_google_maps_url(url, text)
    return f'<link href="{clean(safe_url)}" color="{color}"><u>{clean(text)}</u></link>'


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
    "toc_heading": ParagraphStyle("TOCHeading", fontName="DejaVu-Bold", fontSize=7.2, leading=8.6, textColor=INK, leftIndent=0, firstLineIndent=0),
    "toc_sub": ParagraphStyle("TOCSub", fontName="DejaVu", fontSize=6.2, leading=7.6, textColor=MUTED, leftIndent=4 * mm, firstLineIndent=0),
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
            title="Япония 2026 - мобильный маршрут",
            author="Виктория и Миша",
            subject="Поездка по Японии через Китай, 19 сентября - 3 октября 2026",
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
    canvas.drawString(MARGIN_X, 4.8 * mm, "ЯПОНИЯ 2026 - МОБИЛЬНЫЙ ОФЛАЙН-МАРШРУТ")
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
        rows.extend([[spacer(4)], [Table([[badge(item, GOLD_SOFT, HexColor("#5A4312")) for item in details]], hAlign="LEFT", style=[("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 2*mm)])]])
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
        maps = item.get("mapLinks") or ([{"label": "Google Maps", "url": item["mapUrl"]}] if item.get("mapUrl") else [])
        map_html = ""
        if maps:
            map_html = "<br/><font size='6.3'>" + " · ".join(link_text(m.get("label", "Google Maps"), m["url"]) for m in maps) + "</font>"
        data.append([
            Paragraph(clean(item.get("time", "")), ParagraphStyle("TLTime", fontName="DejaVu-Bold", fontSize=7.2, leading=10, textColor=color)),
            Paragraph(f"<b>{clean(title)}</b><br/><font color='#66716C' size='6.7'>{clean(detail)}</font>{map_html}", ParagraphStyle("TLBody", fontName="DejaVu", fontSize=8, leading=10.5, textColor=INK)),
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
        [p("ТРИГГЕР", "white_label"), p(decision["trigger"], "white_small")],
        [p("СОХРАНЯЕМ", "white_label"), p(decision["protect"], "white_small")],
        [p("СОКРАЩАЕМ", "white_label"), p(decision["cut"], "white_small")],
        [p("ДЕЙСТВУЕМ", "white_label"), p(decision["fallback"], "white_small")],
    ]
    table = Table(rows, colWidths=[20 * mm, CONTENT_W - 20 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), PINE),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LINEBELOW", (0,0), (-1,-2), 0.4, HexColor("#5F756B")),
        ("LEFTPADDING", (0,0), (-1,-1), 3 * mm),
        ("RIGHTPADDING", (0,0), (-1,-1), 3 * mm),
        ("TOPPADDING", (0,0), (-1,-1), 2.4 * mm),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2.4 * mm),
        ("ROUNDEDCORNERS", [3 * mm]),
    ]))
    return table


def photo_spot_cards(day: dict):
    spots = day.get("photoSpots", [])
    if not spots:
        return []
    guide = EXTRA["photoGuide"]
    output = [
        label("Фототочки дня"),
        spacer(1),
        p(guide["principle"], "small"),
        spacer(1),
        card([
            rich(f"<b>FUJI WATCH:</b> {clean(guide['fujiWatch'])}", "tiny"),
            rich(f"<b>ВАЖНО:</b> {clean(guide['exclusion'])}", "tiny"),
        ], background=LAKE_SOFT, border=HexColor("#B9CCD5"), left_bar=LAKE),
        spacer(2),
    ]
    for spot in spots:
        priority = spot["priority"]
        accent = CORAL if priority == "PHOTO MUST" else LAKE if priority == "FUJI WATCH" else PINE_2
        accent_hex = "#D85A42" if priority == "PHOTO MUST" else "#345C73" if priority == "FUJI WATCH" else "#225D4F"
        signature = " · SIGNATURE SHOT" if spot.get("signature") else ""
        map_line = None
        if spot.get("googleMapsUrl"):
            map_line = rich(link_text("Google Maps", spot["googleMapsUrl"]), "small")
        elif spot.get("mapExemptReason"):
            map_line = rich(f"<b>БЕЗ ОТДЕЛЬНОЙ ТОЧКИ:</b> {clean(spot['mapExemptReason'])}", "tiny")
        body = [
            rich(f"<font color='{accent_hex}'><b>{clean(priority + signature)}</b></font>", "tiny"),
            p(spot["name"], "card_title"),
            p(spot["shot"], "small"),
            rich(f"<b>СВЕТ / МОМЕНТ:</b> {clean(spot['timing'])}", "tiny"),
        ]
        if map_line:
            body.extend([spacer(0.6), map_line])
        output.extend([KeepTogether(card(body, background=HexColor("#F4F7F3"), border=HexColor("#C9D7CE"), left_bar=accent)), spacer(1.5)])
    return output


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
    status_copy = {"action": "действие", "verify": "проверить", "watch": "по ситуации", "done": "подтверждено"}
    groups: dict[str, list[dict]] = {}
    for task in sorted(TRIP["bookingTasks"], key=lambda item: item["sortDate"]):
        group = task.get("group", "Билеты, транспорт и подготовка")
        groups.setdefault(group, []).append(task)
    for group, tasks in groups.items():
        output.extend([label(group), spacer(1)])
        for task in tasks:
            color = status_color[task["status"]]
            head = Table([[p(task["deadline"], "label"), Paragraph(clean(status_copy[task["status"]].upper()), ParagraphStyle("Status", fontName="DejaVu-Bold", fontSize=6.2, leading=8, textColor=color, alignment=TA_RIGHT))]], colWidths=[CONTENT_W/2-8*mm, CONTENT_W/2-8*mm])
            head.setStyle(TableStyle([("ALIGN", (1,0), (1,-1), "RIGHT"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0)]))
            body = [head, spacer(1), p(task["title"], "card_title"), p(task["price"], "small"), spacer(1), p(task["action"], "body"), spacer(1), rich(f"<b>СОХРАНИТЬ ОФЛАЙН:</b> {clean(task['offline'])}", "small")]
            if task.get("url"):
                body.extend([spacer(1), rich(link_text("Открыть страницу", task["url"]), "small")])
            output.extend([KeepTogether(card(body, left_bar=color)), spacer(2)])
        output.append(spacer(2))
    return output


def china_stop(stop: dict, title: str, color=CHINA):
    output = [PageBreak(), OutlineHeading(title, 0, STYLES["h1"]), p(stop["dateLabel"], "label"), spacer(1), p(stop["summary"], "body"), spacer(3), label("По времени"), spacer(1), timeline_table(stop["timeline"], color), spacer(4)]
    if stop.get("places"):
        output.extend([label("Китайские адреса + Amap"), spacer(1)])
        for place in stop["places"]:
            output.extend([KeepTogether(card([
                Paragraph(clean(place["name"]), STYLES["cn"]),
                Paragraph(clean(place["address"]), STYLES["cn"]),
                rich(link_text('Amap', place['amap']) + ' · ' + link_text('Apple Maps', place['appleMapsUrl']) + ' · ' + link_text('Google Maps', place['googleMapsUrl']), 'small')
            ], background=LAKE_SOFT, border=HexColor("#C3CFD6"))), spacer(1)])
        output.append(spacer(2))
    food_cards = []
    for item in stop["food"]:
        food_body = [
            rich(f"<b>{clean(item['name'])}</b> · <font color='#D85A42'>{clean(item['dish'])}</font>", "body"),
            p(item["fit"], "small")
        ]
        food_links = []
        if item.get("amapUrl"):
            food_links.append(link_text("Amap", item["amapUrl"]))
        if item.get("appleMapsUrl"):
            food_links.append(link_text("Apple Maps", item["appleMapsUrl"]))
        if item.get("googleMapsUrl"):
            food_links.append(link_text("Google Maps", item["googleMapsUrl"]))
        if food_links:
            food_body.append(rich(" · ".join(food_links), "small"))
        food_cards.append(card(food_body, background=HexColor("#F5E9DF"), border=HexColor("#E5CFC0")))
    output.extend([card([
        p(EXTRA["meta"]["foodSafety"]["title"], "card_title"),
        p(EXTRA["meta"]["foodSafety"]["summary"], "small"),
        Paragraph(EXTRA["meta"]["foodSafety"]["ja"], STYLES["cn"])
    ], background=GOLD_SOFT, border=GOLD, left_bar=GOLD), spacer(2)])
    output.append(KeepTogether([label("Еда - soft preference"), spacer(1), food_cards[0], spacer(1.5)]))
    for food_card in food_cards[1:]:
        output.extend([KeepTogether(food_card), spacer(1.5)])
    if stop["id"] == "beijing-stopover":
        output.extend([spacer(2), card([rich("<b>КУДА ОФОРМЛЕН БАГАЖ:</b> Прочитать код назначения на бирке в SVO. PEK - получить в Пекине; KIX - багаж оформлен до Осаки. Ещё раз подтвердить на стойке транзита в PEK.", "body")], background=GOLD_SOFT, border=GOLD, left_bar=GOLD)])
    return output


def day_story(day: dict):
    enriched = EXTRA["dayEnrichment"][day["id"]]
    day_color = PINE if "Киото" in day["city"] else LAKE if "Хаконе" in day["city"] else HexColor("#283630") if "Токио" in day["city"] else CORAL
    hero_details = [f"{day['load']} · {day['distance']}", f"подъём {day['wake']}"]
    output = [PageBreak(), OutlineHeading(f"День {day['number']}. {day['title']}", 0, STYLES["h1"])]
    output.extend([
        hero_block(f"ДЕНЬ {day['number']} ИЗ 12 · {day['dateLabel']}", day["title"], f"{day['city']} · {day['summary']}", day_color, hero_details),
        spacer(3),
        label("Принцип дня"), spacer(1),
        card([p(day["principle"], "body")], background=CORAL_SOFT, border=HexColor("#E7C4BA"), left_bar=CORAL),
        spacer(3),
    ])
    anchor_badges = [badge(f"{anchor['time']}  {anchor['label']}", GOLD_SOFT, HexColor("#775716")) for anchor in day["anchors"]]
    anchor_rows = [anchor_badges[index:index + 2] for index in range(0, len(anchor_badges), 2)]
    if len(anchor_rows[-1]) == 1:
        anchor_rows[-1].append(Spacer(1, 1))
    anchors = Table(anchor_rows, colWidths=[CONTENT_W / 2, CONTENT_W / 2], hAlign="LEFT")
    anchors.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 2*mm)]))
    output.extend([anchors, spacer(3), label("Основной маршрут"), spacer(1), timeline_table(day["timeline"], day_color)])
    if day.get("decision"):
        output.extend([spacer(4), label(day["decision"]["title"]), spacer(1), decision_card(day["decision"])])
    if day.get("alternate"):
        alt = day["alternate"]
        output.extend([spacer(4), label("Полный альтернативный сценарий"), spacer(1), p(alt["title"], "h3"), p(alt.get("note", ""), "small"), spacer(1), timeline_table(alt["timeline"], LAKE)])

    output.extend([PageBreak(), OutlineHeading(f"День {day['number']} - параллельные треки", 1, STYLES["h2"]), p(day["dateLabel"], "label"), spacer(2)])
    output.extend(photo_spot_cards(day))
    if day.get("photoSpots"):
        output.append(spacer(2))
    output.extend([label("Если освободилось время"), spacer(1), p("Выберите только один вариант рядом. В каждой карточке указано, когда он подходит и что заменяет.", "small"), spacer(2)])
    for index, item in enumerate(enriched["alternatives"], start=1):
        output.extend([KeepTogether(card([
            rich(f"<font color='#D85A42'><b>{index}. {clean(item['name'])}</b></font> · {clean(item['delta'])}", "body"),
            rich(f"<b>КОГДА:</b> {clean(item['when'])}", "small"),
            rich(f"<b>КАК ВСТРОИТЬ:</b> {clean(item['swap'])}", "small"),
            rich(link_text('Google Maps', item['googleMapsUrl']) + ((" · " + link_text('Источник', item['url'])) if item.get('url') else ''), 'small')
        ], background=HexColor("#F0F4EE"), border=HexColor("#CBD7CD"))), spacer(1.5)])

    output.extend([
        spacer(3), label("Гастрономическое путешествие"), spacer(1),
        p("Базовый вариант выбирается по качеству и логистике. Свинина - soft preference, не запрет; блюда со свининой не маркируются как pork-free и при известном составе помечаются явно.", "small"),
        spacer(1), card([
            p(EXTRA["meta"]["foodSafety"]["title"], "card_title"),
            p(EXTRA["meta"]["foodSafety"]["summary"], "tiny"),
            Paragraph(EXTRA["meta"]["foodSafety"]["ja"], STYLES["cn"]),
            p(EXTRA["meta"]["tabelogNote"], "tiny")
        ], background=GOLD_SOFT, border=HexColor("#D5B963"), left_bar=GOLD), spacer(2)
    ])
    for meal in enriched["meals"]:
        option_rows = []
        for option in meal["options"]:
            marker = "БАЗА" if option.get("pick") else "ЗАМЕНА"
            score = option["score"] if str(option["score"]).startswith("Tabelog") or option["score"] == "включено" else ("проверить на месте" if option["score"] == "—" else f"Tabelog {option['score']}")
            name = link_text(option['name'], option.get('googleMapsUrl') or option.get('url')) if (option.get('googleMapsUrl') or option.get('url')) else clean(option['name'])
            option_rows.append([
                Paragraph(clean(marker), ParagraphStyle("MealMarker", fontName="DejaVu-Bold", fontSize=5.5, leading=8, textColor=CORAL if marker == "БАЗА" else MUTED)),
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

    return output


def shopping_guide():
    output = [PageBreak(), OutlineHeading("Shopping guide", 0, STYLES["h1"]),
              p(SHOPPING["meta"]["principle"], "body"), spacer(4)]
    for city in SHOPPING["cities"]:
        output.extend([OutlineHeading(city["name"], 1, STYLES["h2"]), spacer(1)])
        for cluster in city["clusters"]:
            rows = []
            for store in cluster["stores"]:
                rows.append([rich(
                    f"<b>{clean(store['name'])}</b><br/>"
                    f"<font color='#66716C' size='6.4'>{clean(store['address'])}<br/>{clean(store['hours'])}</font><br/>"
                    f"<font size='7'>{clean(store['products'])}</font><br/>"
                    f"{link_text('Google Maps', store['googleMapsUrl'])} · {link_text('Источник', store['url'])}" +
                    (f" · {link_text('Amap', store['amapUrl'])}" if store.get('amapUrl') else '') +
                    (f" · {link_text('Apple Maps', store['appleMapsUrl'])}" if store.get('appleMapsUrl') else ''), "small")])
            table = Table(rows, colWidths=[CONTENT_W], splitByRow=1)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,-1), CARD), ("BOX", (0,0), (-1,-1), 0.6, HexColor("#D5C6D4")),
                ("LINEBELOW", (0,0), (-1,-2), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
                ("LEFTPADDING", (0,0), (-1,-1), 2.5*mm), ("RIGHTPADDING", (0,0), (-1,-1), 2.5*mm),
                ("TOPPADDING", (0,0), (-1,-1), 2.2*mm), ("BOTTOMPADDING", (0,0), (-1,-1), 2.2*mm),
            ]))
            output.extend([KeepTogether(card([p(cluster["name"], "card_title"), p(cluster["note"], "tiny")],
                                               background=HexColor("#EFE7EF"), border=HexColor("#D5C6D4"), left_bar=HexColor("#6E536B"))),
                           spacer(1), table, spacer(3)])
    return output


def food_passport():
    output = [PageBreak(), OutlineHeading("Паспорт блюд", 0, STYLES["h1"]), p("Коллекция после аудита и финальных решений: качество и логистика важнее строгого pork-free фильтра; свинина отмечается явно, но не блокирует сильное блюдо.", "body"), spacer(3), card([
        p(EXTRA["meta"]["foodSafety"]["title"], "card_title"),
        p(EXTRA["meta"]["foodSafety"]["summary"], "small"),
        Paragraph(EXTRA["meta"]["foodSafety"]["ja"], STYLES["cn"])
    ], background=GOLD_SOFT, border=GOLD, left_bar=GOLD), spacer(4)]
    for group, title in (("must", "ГЛАВНЫЕ БЛЮДА"), ("bonus", "БОНУСЫ - БЕЗ КРЮКА")):
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
    output = [PageBreak(), OutlineHeading("Карманная памятка", 0, STYLES["h1"]), p("Отели, экстренные номера и офлайн-правила в одном месте.", "body"), spacer(4), label("Отели по ходу поездки"), spacer(1)]
    for hotel in hotels:
        body = [p(f"{hotel['city']} · {hotel['dates']}", "label"), p(hotel["name"], "card_title")]
        if hotel.get("localAddress"):
            body.extend([Paragraph(hotel["localAddress"], STYLES["cn"])])
        body.extend([p(hotel['address'], 'small'), rich(f"<b>{clean(hotel['phone'])}</b>", 'body')])
        map_url = hotel.get('googleMapsUrl') or hotel.get('mapUrl')
        if map_url:
            body.append(rich(link_text('Google Maps', map_url), 'small'))
        if hotel.get("note"):
            body.append(p(hotel["note"], "tiny"))
        output.extend([KeepTogether(card(body)), spacer(1.5)])
    output.extend([spacer(3), label("Экстренные номера"), spacer(1)])
    nums = Table([
        [badge("ЯПОНИЯ · ПОЛИЦИЯ 110", CORAL_SOFT, CORAL), badge("ЯПОНИЯ · СКОРАЯ/ПОЖАРНЫЕ 119", CORAL_SOFT, CORAL)],
        [badge("КИТАЙ · ПОЛИЦИЯ 110", LAKE_SOFT, CHINA), badge("КИТАЙ · СКОРАЯ 120 / ПОЖАРНЫЕ 119", LAKE_SOFT, CHINA)]
    ], colWidths=[CONTENT_W/2, CONTENT_W/2])
    nums.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 2*mm), ("TOPPADDING", (0,0), (-1,-1), 1*mm)]))
    output.extend([nums, spacer(4), label("Важные правила"), spacer(1)])
    rules = [
        *TRIP["pocket"]["rules"],
        "Для Китая сохранить офлайн билеты дальше по маршруту, брони отелей и адреса на китайском.",
        "Проверить пункт назначения на физической багажной бирке; не считать PEK или KIX само собой разумеющимся.",
        "2 октября быть в NRT T1 около 13:15 к рейсу 3U3962 в 16:40.",
    ]
    for i, rule in enumerate(rules, 1):
        output.extend([KeepTogether(card([rich(f"<b>{i}.</b> {clean(rule)}", "body")], background=HexColor("#F8F6F0"))), spacer(1.3)])
    return output


def build_story():
    story = []
    story.extend([
        hero_block("ВИКТОРИЯ + МИША · МОБИЛЬНАЯ ВЕРСИЯ", "Япония 2026", "19 сентября - 3 октября · Пекин -> Осака -> Киото -> Хаконе -> Токио -> Чэнду -> Москва", PINE, ["15 календарных дней", "12 дней в Японии", "4 перелёта"]),
        spacer(6),
        label("Для поездки, а не для журнального столика"), spacer(1),
        p("Откройте оглавление PDF в приложении Файлы или Книги и сразу перейдите к сегодняшнему дню. Основной маршрут идёт первым; альтернативы и еда вынесены в параллельный слой, а shopping guide сгруппирован отдельно по городам и районам.", "body"),
        spacer(4),
        card([rich("<b>1. Маршрут:</b> следовать плану по времени.<br/><b>2. Освободилось время:</b> выбрать одну альтернативу рядом.<br/><b>3. Еда:</b> взять базовый вариант, ссылку открывать для проверки часов.<br/><b>4. Задержка:</b> защищать якорь и применять правило сокращения.", "body")], background=PINE_SOFT, border=HexColor("#C5D6CF"), left_bar=PINE),
        spacer(6),
        p(f"Версия {EXTRA['meta']['version']} · источники проверены {EXTRA['meta']['sourceChecked']}", "tiny"),
        PageBreak(),
        OutlineHeading("Быстрое оглавление", 0, STYLES["h1"]),
        p("Нажмите на пункт. Номера страниц также указаны для офлайн-навигации.", "body"),
        spacer(4),
    ])
    toc = TableOfContents()
    toc.levelStyles = [STYLES["toc_heading"], STYLES["toc_sub"]]
    toc.dotsMinLevel = 0
    story.extend([toc, PageBreak(), OutlineHeading("Перелёты", 0, STYLES["h1"]), p("Все четыре билета входят в маршрут. Время соответствует текущим данным бронирований; терминалы перепроверить в приложении авиакомпании.", "body"), spacer(4), *flight_cards()])

    story.extend([PageBreak(), OutlineHeading("Что сделать до поездки", 0, STYLES["h1"]), p("Сроки бронирований, подготовка к Китаю и точный список того, что сохранить офлайн.", "body"), spacer(4), *todo_cards()])

    rule = EXTRA["china"]["rule"]
    story.extend([PageBreak(), OutlineHeading("Правило транзита через Китай", 0, STYLES["h1"]), card([
        p(rule["title"], "h3"), p(rule["summary"], "body"), spacer(2), rich(f"<b>СОХРАНИТЬ:</b> {clean(rule['protect'])}", "small"), rich(f"<b>ПЕРЕПРОВЕРИТЬ:</b> {clean(rule['check'])}", "small"), spacer(2), rich(link_text("Официальные правила NIA", EXTRA["china"]["links"][0]["url"]), "small")
    ], background=LAKE_SOFT, border=HexColor("#BECED6"), left_bar=CHINA)])

    story.extend(china_stop(EXTRA["china"]["outbound"], "Остановка в Пекине"))
    for day in TRIP["days"]:
        story.extend(day_story(day))
    story.extend(china_stop(EXTRA["china"]["return"], "Остановка в Чэнду"))

    story.extend([PageBreak(), OutlineHeading("Подготовка к Китаю", 0, STYLES["h1"]), p("Сделать до обеих промежуточных остановок.", "body"), spacer(4)])
    for index, item in enumerate(EXTRA["china"]["prep"], 1):
        story.extend([KeepTogether(card([rich(f"<b>{index}.</b> {clean(item)}", "body")], background=LAKE_SOFT, border=HexColor("#C3CFD6"), padding=2.4 * mm)), spacer(0.8)])
    story.extend([spacer(3), label("Официальные источники"), spacer(1)])
    source_cells = [rich(link_text(item["label"], item["url"]), "small") for item in EXTRA["china"]["links"]]
    source_rows = [source_cells[index:index + 2] for index in range(0, len(source_cells), 2)]
    if len(source_rows[-1]) == 1:
        source_rows[-1].append(Spacer(1, 1))
    sources = Table(source_rows, colWidths=[CONTENT_W / 2, CONTENT_W / 2], hAlign="LEFT")
    sources.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 1 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1 * mm),
    ]))
    story.append(sources)

    story.extend(food_passport())
    story.extend(shopping_guide())
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
