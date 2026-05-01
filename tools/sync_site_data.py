#!/usr/bin/env python3
import json
import re
import textwrap
from copy import deepcopy
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_JSON = ROOT / "data.json"
DATA_JS = ROOT / "assets/js/data.js"
PDF_PATH = ROOT / "curriculo.pdf"

A4_WIDTH = 595
A4_HEIGHT = 842
LEFT = 54
RIGHT = 54
TOP = 60
BOTTOM = 56

BG = (0.96, 0.94, 0.90)
SURFACE = (0.99, 0.98, 0.96)
ACCENT = (0.85, 0.42, 0.19)
ACCENT_DARK = (0.16, 0.19, 0.24)
TEXT = (0.10, 0.12, 0.16)
TEXT_MUTED = (0.35, 0.39, 0.44)


def read_data():
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    data.setdefault("resume", {})["cv_download_url"] = PDF_PATH.name
    return data


def write_data_js(data):
    DATA_JS.write_text(
        "window.siteData = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )


def merge_value(target, source):
    if isinstance(target, list) and isinstance(source, list):
        merged = []
        max_len = max(len(target), len(source))
        for idx in range(max_len):
            if idx >= len(source):
                merged.append(target[idx])
            elif idx >= len(target):
                merged.append(source[idx])
            else:
                merged.append(merge_value(target[idx], source[idx]))
        return merged

    if isinstance(target, dict) and isinstance(source, dict):
        return deep_merge(target, source)

    return source


def deep_merge(target, source):
    for key, value in source.items():
        target[key] = merge_value(target.get(key), value)
    return target


def get_lang_data(data, lang):
    merged = deepcopy(data)
    translations = merged.pop("translations", {})
    if lang in translations:
        merged = deep_merge(merged, translations[lang])
    return merged


def compact_spaces(text):
    return re.sub(r"\s+", " ", str(text or "")).strip()


def bullet_lines(items):
    return [f"- {compact_spaces(item)}" for item in items if compact_spaces(item)]


class PdfBuilder:
    def __init__(self, footer_text=""):
        self.pages = []
        self.footer_text = footer_text
        self._new_page()

    def _new_page(self):
        self.current = []
        self.y = A4_HEIGHT - TOP
        self.current.append(rect_cmd(0, 0, A4_WIDTH, A4_HEIGHT, BG))
        self.current.append(rect_cmd(0, A4_HEIGHT - 18, A4_WIDTH, 18, ACCENT))
        self.pages.append(self.current)

    def ensure_space(self, needed):
        if self.y - needed < BOTTOM:
            self._new_page()

    def rect(self, x, y, width, height, fill, stroke=None, line_width=1):
        self.current.append(rect_cmd(x, y, width, height, fill, stroke, line_width))

    def line(self, text, size=11, font="F1", leading=None, indent=0, color=TEXT):
        text = compact_spaces(text)
        if not text:
            self.y -= leading or size + 4
            return
        leading = leading or size + 4
        self.ensure_space(leading)
        x = LEFT + indent
        y = self.y
        self.current.append(
            text_cmd(x, y, text, font=font, size=size, color=color)
        )
        self.y -= leading

    def wrapped(self, text, size=11, font="F1", width=None, leading=None, indent=0, color=TEXT):
        width = width or (A4_WIDTH - LEFT - RIGHT - indent)
        char_width = max(size * 0.50, 4.8)
        wrap = max(int(width / char_width), 20)
        lines = textwrap.wrap(compact_spaces(text), width=wrap, break_long_words=False)
        for line in lines:
            self.line(line, size=size, font=font, leading=leading, indent=indent, color=color)

    def spacer(self, amount):
        self.ensure_space(amount)
        self.y -= amount

    def heading(self, text, size=18, color=TEXT):
        self.line(text, size=size, font="F2", leading=size + 6, color=color)

    def subheading(self, text, size=13, color=TEXT):
        self.line(text, size=size, font="F2", leading=size + 5, color=color)

    def section(self, text):
        self.spacer(12)
        self.rect(LEFT, self.y - 8, 6, 18, ACCENT)
        self.line(text.upper(), size=11, font="F2", leading=22, indent=16, color=ACCENT_DARK)

    def divider(self):
        self.ensure_space(12)
        y = self.y - 4
        self.current.append(line_cmd(LEFT, y, A4_WIDTH - RIGHT, y, (0.86, 0.83, 0.78), 0.8))
        self.y -= 12

    def info_card_start(self, min_height=42):
        self.ensure_space(min_height)
        self._card_top = self.y + 10

    def info_card_end(self):
        self.spacer(6)

    def build(self, output):
        objects = []

        def add_object(content):
            objects.append(content)
            return len(objects)

        font_regular = add_object(
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
        )
        font_bold = add_object(
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
        )

        page_ids = []
        content_ids = []

        for page in self.pages:
            page_commands = list(page)
            if self.footer_text:
                footer_x = A4_WIDTH - RIGHT - (len(self.footer_text) * 4.6)
                page_commands.append(
                    text_cmd(footer_x, BOTTOM - 18, self.footer_text, font="F1", size=9, color=TEXT_MUTED)
                )
            stream = "\n".join(page_commands).encode("latin-1", "replace")
            content_id = add_object(
                b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream"
            )
            content_ids.append(content_id)
            page_ids.append(None)

        pages_id = add_object(b"")

        for idx, content_id in enumerate(content_ids):
            page_obj = (
                f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {A4_WIDTH} {A4_HEIGHT}] "
                f"/Resources << /Font << /F1 {font_regular} 0 R /F2 {font_bold} 0 R >> >> "
                f"/Contents {content_id} 0 R >>"
            ).encode("latin-1")
            page_ids[idx] = add_object(page_obj)

        kids = " ".join(f"{page_id} 0 R" for page_id in page_ids).encode("latin-1")
        objects[pages_id - 1] = b"<< /Type /Pages /Count " + str(len(page_ids)).encode() + b" /Kids [" + kids + b"] >>"

        catalog_id = add_object(f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode("latin-1"))

        pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = [0]
        for obj_id, obj in enumerate(objects, start=1):
            offsets.append(len(pdf))
            pdf.extend(f"{obj_id} 0 obj\n".encode("latin-1"))
            pdf.extend(obj)
            pdf.extend(b"\nendobj\n")

        xref_pos = len(pdf)
        pdf.extend(f"xref\n0 {len(objects)+1}\n".encode("latin-1"))
        pdf.extend(b"0000000000 65535 f \n")
        for off in offsets[1:]:
            pdf.extend(f"{off:010d} 00000 n \n".encode("latin-1"))

        trailer = (
            f"trailer\n<< /Size {len(objects)+1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_pos}\n%%EOF\n"
        ).encode("latin-1")
        pdf.extend(trailer)
        output.write_bytes(pdf)


def pdf_escape(text):
    text = compact_spaces(text)
    raw = text.encode("cp1252", "replace")
    raw = raw.replace(b"\\", b"\\\\").replace(b"(", b"\\(").replace(b")", b"\\)")
    return raw.decode("latin-1")


def color_ops(fill=None, stroke=None):
    ops = []
    if fill is not None:
        ops.append(f"{fill[0]:.3f} {fill[1]:.3f} {fill[2]:.3f} rg")
    if stroke is not None:
        ops.append(f"{stroke[0]:.3f} {stroke[1]:.3f} {stroke[2]:.3f} RG")
    return " ".join(ops)


def rect_cmd(x, y, width, height, fill, stroke=None, line_width=1):
    ops = [color_ops(fill=fill, stroke=stroke)]
    if stroke is not None:
        ops.append(f"{line_width:.2f} w")
        ops.append(f"{x} {y} {width} {height} re B")
    else:
        ops.append(f"{x} {y} {width} {height} re f")
    return " ".join(ops)


def line_cmd(x1, y1, x2, y2, stroke, line_width=1):
    return f"{stroke[0]:.3f} {stroke[1]:.3f} {stroke[2]:.3f} RG {line_width:.2f} w {x1} {y1} m {x2} {y2} l S"


def text_cmd(x, y, text, font="F1", size=11, color=TEXT):
    return (
        f"BT {color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg "
        f"/{font} {size} Tf 1 0 0 1 {x} {y} Tm ({pdf_escape(text)}) Tj ET"
    )


def build_resume_pdf(data):
    pt = get_lang_data(data, data.get("default_language", "pt"))
    profile = pt["profile"]
    resume = pt["resume"]
    contact = pt["contact"]
    current = pt["current_status"]

    updated_at = f"Atualizado em {datetime.now().strftime('%d/%m/%Y')}"
    pdf = PdfBuilder(footer_text=updated_at)

    header_bottom = A4_HEIGHT - 150
    pdf.rect(LEFT, header_bottom, A4_WIDTH - LEFT - RIGHT, 92, ACCENT_DARK)
    pdf.current.append(text_cmd(LEFT + 20, header_bottom + 58, profile["name"], font="F2", size=22, color=(1, 1, 1)))
    pdf.current.append(
        text_cmd(
            LEFT + 20,
            header_bottom + 34,
            f"{contact['location']} | {contact['email']}",
            font="F1",
            size=10,
            color=(0.90, 0.89, 0.86),
        )
    )
    pdf.current.append(
        text_cmd(
            LEFT + 20,
            header_bottom + 18,
            f"{contact['website']} | {contact['whatsapp']}",
            font="F1",
            size=10,
            color=(0.90, 0.89, 0.86),
        )
    )
    pdf.y = header_bottom - 18

    pdf.wrapped(
        profile["subtitle"],
        size=11,
        font="F2",
        leading=16,
        color=ACCENT_DARK,
    )

    pdf.section("Resumo")
    pdf.info_card_start(92)
    pdf.wrapped(profile["bio"], size=11, leading=17, color=TEXT)
    pdf.info_card_end()

    pdf.section("Atuação")
    pdf.info_card_start(52)
    pdf.wrapped(profile["subtitle"], size=11, font="F2", leading=16, color=TEXT)
    pdf.info_card_end()

    pdf.section("Atuação Atual")
    pdf.info_card_start(68)
    pdf.wrapped(f"{current['headline']} {current['company']}", size=11, font="F2", leading=16, color=ACCENT_DARK)
    pdf.wrapped(current["description"], size=11, leading=17, color=TEXT)
    pdf.info_card_end()

    pdf.section("Formação Acadêmica")
    for idx, edu in enumerate(resume["education"]):
        pdf.info_card_start(56)
        pdf.subheading(f"{edu['degree']} | {edu['org']}", size=12, color=ACCENT_DARK)
        pdf.wrapped(edu["period"], size=10, font="F2", leading=14, color=ACCENT)
        pdf.wrapped(edu["description"], size=10, leading=15, color=TEXT)
        pdf.info_card_end()
        if idx == len(resume["education"]) - 1:
            pdf._new_page()

    pdf.section("Experiência Profissional")
    for exp in resume["experience"]:
        pdf.info_card_start(80)
        pdf.subheading(f"{exp['title']} | {exp['company']}", size=12, color=ACCENT_DARK)
        pdf.wrapped(f"{exp['period']} | {exp['location']}", size=10, font="F2", leading=14, color=ACCENT)
        if compact_spaces(exp.get("description")):
            pdf.wrapped(exp["description"], size=10, leading=15, color=TEXT)
        for item in bullet_lines(exp.get("items", [])):
            pdf.wrapped(item, size=10, leading=14, indent=10, width=A4_WIDTH - LEFT - RIGHT - 20, color=TEXT_MUTED)
        pdf.info_card_end()

    pdf.build(PDF_PATH)


def main():
    data = read_data()
    write_data_js(data)
    build_resume_pdf(data)
    print(f"Updated {DATA_JS.relative_to(ROOT)} and {PDF_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
