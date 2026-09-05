#!/usr/bin/env python3
"""Executable release checks for the generated mobile itinerary PDF."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = ROOT / "output" / "pdf" / "Japan_2026_mobile_itinerary.pdf"
DATA_FILES = (
    ROOT / "data" / "trip.json",
    ROOT / "data" / "travel-enrichment.json",
    ROOT / "data" / "shopping-guide.json",
)


def collect_navigation_urls(value, google_maps: set[str], amap: set[str]) -> None:
    if isinstance(value, dict):
        for key, item in value.items():
            if isinstance(item, str) and "google.com/maps/" in item:
                google_maps.add(item)
            if key == "amap" and isinstance(item, str):
                amap.add(item)
            collect_navigation_urls(item, google_maps, amap)
    elif isinstance(value, list):
        for item in value:
            collect_navigation_urls(item, google_maps, amap)


def main() -> None:
    pdf_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_PDF
    reader = PdfReader(pdf_path)
    if not 90 <= len(reader.pages) <= 150:
        raise RuntimeError(f"Unexpected page count: {len(reader.pages)}")
    if reader.metadata.title != "Япония 2026 - мобильный маршрут":
        raise RuntimeError(f"Unexpected PDF title: {reader.metadata.title!r}")
    if "/AcroForm" in reader.root_object:
        raise RuntimeError("The itinerary must not contain an AcroForm")

    page_sizes = {
        (round(float(page.mediabox.width), 3), round(float(page.mediabox.height), 3))
        for page in reader.pages
    }
    if len(page_sizes) != 1:
        raise RuntimeError(f"Inconsistent page sizes: {sorted(page_sizes)}")

    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    normalized = re.sub(r"\s+", " ", text)
    required = (
        "Mizuho 601",
        "Car 4, seats 9-A/9-B",
        "Sakura 766",
        "Car 4, seats 8-A/8-B",
        "Hikari 642",
        "Car 6, seats 9-D/9-E",
        "IC Card for Boarding пока не назначены",
        "¥24,200 / 2 человека",
    )
    missing_text = [item for item in required if item not in normalized]
    if missing_text:
        raise RuntimeError(f"Critical PDF facts missing: {missing_text}")
    if "SmartEX confirmation day" in normalized:
        raise RuntimeError("Stale SmartEX confirmation task remains in the PDF")
    if "ИЗ 12" in normalized:
        raise RuntimeError("Stale 12-day counter remains in the PDF")
    if "ДЕНЬ 15 ИЗ 15" not in normalized:
        raise RuntimeError("Dynamic 15-day counter is missing from the PDF")
    forbidden_content = (
        "вечерняя бронь Imaasa в 19:15 защищена",
        "Imaasa - защищённый сукияки-вечер",
        "Бронь обязательна. Курс Take",
    )
    stale = [item for item in forbidden_content if item in normalized]
    if stale:
        raise RuntimeError(f"Stale content-integrity text remains in PDF: {stale}")
    required_integrity = (
        "Без обязательной брони. Imaasa",
        "Hiroshige · TNM 30.09 · Plan B",
        "Edo-Tokyo Museum · 30.09 · Plan B",
        "Fairfield -> PEK T2",
        "PEK -> KIX",
        "Kanzan-no-Yu",
        "В Японии такси не является базовым транспортом",
    )
    missing_integrity = [item for item in required_integrity if item not in normalized]
    if missing_integrity:
        raise RuntimeError(f"Content-integrity fixes missing from PDF: {missing_integrity}")
    if "\x00" in text or "�" in text:
        raise RuntimeError("Broken or replacement glyphs found in extracted PDF text")

    uris: list[str] = []
    for page in reader.pages:
        for annotation in page.get("/Annots") or []:
            action = annotation.get_object().get("/A")
            if action and action.get("/URI"):
                uris.append(str(action["/URI"]))
    invalid_uris = [
        uri for uri in uris
        if urlparse(uri).scheme not in {"http", "https"} or not urlparse(uri).netloc
    ]
    if invalid_uris:
        raise RuntimeError(f"Invalid URI annotations: {invalid_uris[:5]}")
    if len(uris) < 380 or len(set(uris)) < 280:
        raise RuntimeError(f"Unexpectedly sparse PDF links: {len(uris)} / {len(set(uris))} unique")

    expected_google_maps: set[str] = set()
    expected_amap: set[str] = set()
    for path in DATA_FILES:
        collect_navigation_urls(json.loads(path.read_text(encoding="utf-8")), expected_google_maps, expected_amap)
    uri_set = set(uris)
    missing_maps = sorted((expected_google_maps | expected_amap) - uri_set)
    if missing_maps:
        raise RuntimeError(f"Navigation links missing from PDF annotations: {missing_maps[:5]}")
    if len(reader.outline) < 30:
        raise RuntimeError(f"PDF outline is incomplete: {len(reader.outline)} entries")

    print(
        "PDF validation: "
        f"{len(reader.pages)} pages, {len(reader.outline)} outline entries, "
        f"{len(uris)} URI annotations, {len(expected_google_maps)} Google Maps links, "
        f"{len(expected_amap)} Amap links - PASS."
    )


if __name__ == "__main__":
    main()
