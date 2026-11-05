"""Build the study bank from the two source ZIPs without changing their contents.

Run: python scripts/import_questions.py
Verify an existing import: python scripts/import_questions.py --check
Dependencies: pip install -r scripts/requirements.txt

Only the original question pages are parsed; answer appendices are never used as
question text. CSV rows are the authority for answer sets and explanations.
"""

from __future__ import annotations

import argparse
import csv
from collections import Counter, defaultdict
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import re
import sys
import zipfile

import pdfplumber
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "plans" / "active"
DESTINATION = ROOT / "frontend" / "public" / "data"
BANK_PATH = DESTINATION / "question-bank.json"
REPORT_PATH = ROOT / "docs" / "product" / "question-bank-report.md"
SUBJECTS = {
    "SSG104": ("SSG_FE_19_de_kem_dap_an.zip", "Communication and In-Group Working Skills"),
    "SWT301": ("SWT_FE_11_de_kem_dap_an.zip", "Software Testing"),
}
MARKER = re.compile(r"^(?:Câu\s+(\d+)(?:\s*\|[^\n]*)?|Question\s+(\d+))\s*$", re.MULTILINE)
OPTION = re.compile(r"^([A-H])\.\s+", re.MULTILINE)
CAPTION = "Original image excerpt for the diagram, table, or matching items."
KNOWN_MISSING = {
    ("SWT301_FE_FA2024-FE-2963", 51),
    ("SWT301_FE_SP2025-FE-3561", 14),
    ("SWT301_FE_SP2025-FE-3561", 59),
    ("SWT301_FE_SP2025-RE-3675", 19),
}


def read_rows(archive: zipfile.ZipFile) -> list[dict[str, str]]:
    name = next(name for name in archive.namelist() if name.startswith("00_Dap_an_va_giai_thich_") and name.endswith(".csv"))
    return list(csv.DictReader(io.StringIO(archive.read(name).decode("utf-8-sig"))))


def clean_text(text: str) -> str:
    """Remove PDF layout chrome, retaining source line breaks (including code)."""
    lines = []
    for line in text.splitlines():
        line = re.sub(r"[ \t]+", " ", line).strip()
        if not line or line == CAPTION:
            continue
        if re.match(r"^(?:SSG104\s*\|\s*NGUỒN FE|SWT301 / FE /|Bản chữ đọc từ ảnh câu hỏi|(?:Trang|Page) \d+$)", line):
            continue
        if line == "SSG104" or re.fullmatch(r"(?:FA|SP|SU)\d{2,4}-(?:FE|RE)-\d+", line):
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def split_options(body: str) -> tuple[str, list[dict[str, str]], list[str]]:
    matches = list(OPTION.finditer(body))
    starts = [index for index, marker in enumerate(matches) if marker[1] == "A"]
    if not starts:
        return clean_text(body), [], ["Không xác định được các phương án trong nguồn."]
    # Matching questions contain A/B/C statements BEFORE the A/B/C/D choices.
    # The final A-led sequence is the answer list; the earlier list is prompt.
    start_index = starts[-1]
    selected = matches[start_index:]
    options = []
    for index, marker in enumerate(selected):
        end = selected[index + 1].start() if index + 1 < len(selected) else len(body)
        options.append({"id": marker[1], "text": clean_text(body[marker.end():end])})
    prompt = clean_text(body[:selected[0].start()])
    return prompt, options, []


def parse_original_pages(reader: PdfReader, last_page: int) -> tuple[dict[int, str], dict[int, int]]:
    blocks: dict[int, str] = {}
    positions: dict[int, int] = {}
    current = None
    for page_number, page in enumerate(reader.pages[:last_page], 1):
        text = page.extract_text() or ""
        markers = list(MARKER.finditer(text))
        if current is not None and markers:
            blocks[current] += "\n" + clean_text(text[:markers[0].start()])
        elif current is not None and not markers:
            blocks[current] += "\n" + clean_text(text)
        for index, marker in enumerate(markers):
            current = int(marker[1] or marker[2])
            if current in blocks:
                raise ValueError(f"Duplicate source question {current} on page {page_number}")
            end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
            blocks[current] = clean_text(text[marker.end():end])
            positions[current] = page_number
    return blocks, positions


def export_source_images(pdf_bytes: bytes, exam_id: str, original_pages: int, reader: PdfReader) -> dict[int, str]:
    """Keep every embedded source illustration, attached by geometric caption.

    The SSG cut-text reference pages follow original questions but precede the
    answer appendix. Their Câu N captions map the raw screenshot back to N.
    Cropping only the image object prevents leaking the answer appendix.
    """
    result: dict[int, str] = {}
    # Discover image resources cheaply before asking pdfplumber to parse geometry.
    candidate_pages = [index for index, page in enumerate(reader.pages) if page.images.keys()]
    if not candidate_pages:
        return result
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as document:
        for page_index in candidate_pages:
            page = document.pages[page_index]
            text = page.extract_text() or ""
            if page_index >= original_pages and not re.search(r"(?m)^Câu \d+\s*$", text):
                continue
            markers = []
            for line in page.extract_text_lines():
                matched = MARKER.fullmatch(line["text"])
                if matched:
                    markers.append((line["top"], int(matched[1] or matched[2])))
            if not markers:
                raise ValueError(f"Image without a question caption: {exam_id}, page {page_index + 1}")
            for image in sorted(page.images, key=lambda image: image["top"]):
                before = [entry for entry in markers if entry[0] < image["top"]]
                if not before:
                    raise ValueError(f"Cannot attribute image: {exam_id}, page {page_index + 1}")
                number = before[-1][1]
                if number in result:
                    raise ValueError(f"Multiple illustrations need a gallery: {exam_id}, question {number}")
                filename = f"{exam_id}_{number:02}.png"
                target = DESTINATION / "images" / filename
                target.parent.mkdir(parents=True, exist_ok=True)
                box = (image["x0"], image["top"], image["x1"], image["bottom"])
                cropped = page.crop(box).to_image(resolution=160, antialias=True)
                cropped.original.save(target, optimize=True)
                result[number] = f"/data/images/{filename}"
    return result


def create_bank() -> dict:
    bank = {"version": 1, "generatedAt": datetime.now(timezone.utc).isoformat(), "subjects": []}
    for subject_id, (archive_name, subject_name) in SUBJECTS.items():
        subject = {"id": subject_id, "name": subject_name, "exams": []}
        with zipfile.ZipFile(SOURCE / archive_name) as archive:
            rows_by_exam: dict[str, list[dict[str, str]]] = defaultdict(list)
            for row in read_rows(archive):
                rows_by_exam[row["Ma_de"]].append(row)
            for exam_id, rows in rows_by_exam.items():
                pdf_name = f"{exam_id}_kem_dap_an.pdf"
                pdf_bytes = archive.read(pdf_name)
                reader = PdfReader(io.BytesIO(pdf_bytes))
                original_pages = max(int(row["Trang_de_goc"]) for row in rows)
                blocks, positions = parse_original_pages(reader, original_pages)
                expected = {int(row["Cau"]) for row in rows}
                if set(blocks) != expected:
                    raise ValueError(f"Question numbering mismatch for {exam_id}: {set(blocks) ^ expected}")
                images = export_source_images(pdf_bytes, exam_id, original_pages, reader)
                exam = {"id": exam_id, "title": exam_id.replace(f"{subject_id}_", "").removeprefix("FE_"), "questions": []}
                for row in rows:
                    number = int(row["Cau"])
                    body = blocks[number]
                    repairs = []
                    # Four labels are visibly corrupted in the OCR transcription.
                    # Restore sequential label glyphs only; keep option content.
                    if (exam_id, number) == ("SWT301_FE_FA2024-FE-2963", 54):
                        body = re.sub(r"(?m)^E_\s+", "E. ", body)
                        repairs.append("Nhãn E_ trong OCR được chuẩn hoá thành E theo phương án E có trong CSV.")
                    if (exam_id, number) == ("SWT301_FE_SP2025-FE-3561", 7):
                        body = re.sub(r"(?m)^=\.\s+", "E. ", body)
                        repairs.append("Nhãn =. trong OCR được chuẩn hoá thành E theo phương án E có trong CSV.")
                    if (exam_id, number) == ("SWT301_FE_SP2025-FE-3561", 28):
                        body = re.sub(r"(?m)^©\.\s+", "D. ", body)
                        repairs.append("Nhãn ©. trong OCR được chuẩn hoá thành D theo thứ tự bốn phương án A/B/C/D trong nguồn.")
                    if (exam_id, number) == ("SWT301_FE_SP2025-FE-3561", 36):
                        body = re.sub(r"(?m)^=\.\s+", "E. ", body)
                        repairs.append("Nhãn =. trong OCR được chuẩn hoá thành E theo thứ tự năm phương án A/B/C/D/E trong nguồn.")
                    if (exam_id, number) == ("SWT301_FE_SP2025-FE-3561", 1):
                        body = body.split("\nBluetooth Airplane mode", 1)[0]
                        repairs.append("Loại chữ giao diện Windows Quick Settings bị OCR lẫn vào cuối câu; giữ nguyên bốn phương án.")
                    prompt, options, errors = split_options(body)
                    answers = row["Dap_an"].split("+")
                    issues = [value for value in (row.get("Chu_thich"), row.get("Tinh_trang_nguon")) if value] + repairs
                    if (exam_id, number) in KNOWN_MISSING:
                        errors.append("Nguồn mất hoặc thiếu phần hỏi; tạm loại khỏi bài chấm điểm.")
                    if row.get("Tinh_trang_nguon") == "Nguồn bị cắt chữ":
                        errors.append("Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm.")
                    if not prompt:
                        errors.append("Nguồn không có phần hỏi.")
                    if len(options) < 2:
                        errors.append("Nguồn chưa đủ phương án để chấm điểm.")
                    option_ids = [option["id"] for option in options]
                    if len(option_ids) != len(set(option_ids)):
                        errors.append("Nhãn phương án bị trùng trong nguồn.")
                    if not set(answers).issubset(option_ids):
                        errors.append("Nhãn đáp án không khớp các phương án đọc được từ nguồn.")
                    if any(not option["text"] for option in options):
                        errors.append("Có phương án bị mất nội dung trong nguồn.")
                    if positions[number] != int(row["Trang_de_goc"]):
                        raise ValueError(f"Source page mismatch: {exam_id}, question {number}")
                    if len(answers) != int(row["So_phuong_an_chon"]):
                        raise ValueError(f"CSV answer count mismatch: {exam_id}, question {number}")
                    question = {
                        "id": f"{subject_id}::{exam_id}::{number}",
                        "number": number,
                        "prompt": prompt or "[Question text is missing in the source.]",
                        "options": options,
                        "correctOptionIds": answers,
                        "explanation": row["Giai_thich"],
                        "source": {"archive": archive_name, "pdf": pdf_name, "page": int(row["Trang_de_goc"]), "number": number},
                        "status": "excluded" if errors else "ready",
                        "issues": list(dict.fromkeys(issues + errors)),
                    }
                    if number in images:
                        question["image"] = images[number]
                    exam["questions"].append(question)
                subject["exams"].append(exam)
                print(f"Imported {exam_id}: {len(rows)} records, {sum(q['status'] == 'ready' for q in exam['questions'])} ready", flush=True)
        bank["subjects"].append(subject)
    return bank


def validate_bank(bank: dict) -> None:
    ids = set()
    total = 0
    for subject in bank["subjects"]:
        archive_name = SUBJECTS[subject["id"]][0]
        with zipfile.ZipFile(SOURCE / archive_name) as archive:
            source_rows = {(row["Ma_de"], int(row["Cau"])): row for row in read_rows(archive)}
        actual = set()
        for exam in subject["exams"]:
            numbers = []
            for question in exam["questions"]:
                key = (exam["id"], question["number"])
                assert key not in actual, f"Duplicate source mapping: {key}"
                actual.add(key)
                row = source_rows[key]
                assert question["id"] not in ids, f"Duplicate ID: {question['id']}"
                ids.add(question["id"])
                assert question["id"] == f"{subject['id']}::{exam['id']}::{question['number']}"
                assert question["correctOptionIds"] == row["Dap_an"].split("+"), f"Changed source answer: {key}"
                assert question["explanation"] == row["Giai_thich"], f"Changed source explanation: {key}"
                assert question["source"]["page"] == int(row["Trang_de_goc"])
                assert question["source"]["archive"] == archive_name
                assert question["source"]["pdf"] == f"{exam['id']}_kem_dap_an.pdf"
                assert question["status"] in {"ready", "excluded"}
                if question["status"] == "ready":
                    assert len(question["options"]) >= 2 and question["prompt"]
                    labels = [option["id"] for option in question["options"]]
                    assert labels == list("ABCDEFGH"[:len(labels)]), f"Unordered options: {key}: {labels}"
                    assert all(option["text"] for option in question["options"])
                    assert set(question["correctOptionIds"]).issubset(labels)
                    assert key not in KNOWN_MISSING
                if question.get("image"):
                    assert question["image"].startswith("/data/images/")
                    assert (ROOT / "frontend" / "public" / question["image"].lstrip("/")).is_file()
                numbers.append(question["number"])
                total += 1
            assert sorted(numbers) == list(range(1, len(numbers) + 1)), f"Missing question number: {exam['id']}"
        assert actual == set(source_rows), f"Missing or extra records in {subject['id']}"
    assert total == 1126, f"Expected 1126 records, got {total}"
    print(f"Validated {total} unique records against source CSV answers, explanations, pages, and image assets.")


def write_report(bank: dict) -> None:
    rows = ["# Kiểm tra ngân hàng câu hỏi", "", "Nguồn: hai ZIP được người dùng cung cấp trong `docs/plans/active/`. Không sửa hoặc di chuyển nguồn.", "", "## Kết quả nhập", "", "| Môn | Đề | Tổng câu | Được chấm | Tạm loại | Có ảnh |", "| --- | ---: | ---: | ---: | ---: | ---: |"]
    excluded = []
    for subject in bank["subjects"]:
        questions = [question for exam in subject["exams"] for question in exam["questions"]]
        counts = Counter(question["status"] for question in questions)
        rows.append(f"| {subject['id']} | {len(subject['exams'])} | {len(questions)} | {counts['ready']} | {counts['excluded']} | {sum(bool(q.get('image')) for q in questions)} |")
        for exam in subject["exams"]:
            excluded.extend((exam["id"], question) for question in exam["questions"] if question["status"] == "excluded")
    rows.extend(["", "## Quy tắc và giới hạn", "", "- Đáp án và giải thích giữ nguyên từ CSV, kể cả các câu có chú thích cần lưu ý; không tự tạo giải thích mới.", "- Chỉ đọc phần đề gốc trước phụ lục đáp án. Tất cả câu có ID, mã đề, số câu và trang nguồn để đối chiếu.", "- Các phương án ghép đôi A/B/C nằm trong nội dung câu hỏi được giữ trong phần hỏi; danh sách lựa chọn là dãy A/B/C/D cuối cùng.", "- Giữ hình gốc được nhúng trong PDF, kể cả ảnh đối chiếu cho các câu nguồn bị cắt. Ảnh chỉ được cắt theo vùng hình gốc, không chứa phụ lục đáp án.", "- Câu mất/thiếu phần hỏi, nguồn bị cắt chữ hoặc không đủ phương án để chấm được lưu với `status: excluded`. Giao diện phải loại các câu này khỏi luyện tập, thi thử và mẫu số điểm.", "- Câu có chú thích ngữ cảnh hoặc cách diễn đạt chưa chặt vẫn dùng đáp án được cung cấp, đúng lựa chọn của người dùng.", "- Không sửa lỗi đánh máy hoặc OCR bằng suy đoán. Chuẩn hoá bốn nhãn OCR: SWT FA2024-FE-2963 câu 54 (`E_` thành `E.`); SP2025-FE-3561 câu 7 (`=.` thành `E.`), câu 28 (`©.` thành `D.`), câu 36 (`=.` thành `E.`). Hai nhãn E đầu tiên được đối chiếu CSV; hai nhãn còn lại dựa dãy phương án liền kề trong PDF. Loại dòng giao diện Windows Quick Settings lẫn cuối câu 1 của SP2025-FE-3561. Mọi sửa được ghi trong issues; không đổi đáp án hoặc tạo nội dung phương án.", "- Kiểm tra tự động xác minh đủ 1.126 bản ghi, tính duy nhất, thứ tự câu, đáp án, giải thích, trang nguồn và ảnh. Kiểm tra này không chứng nhận tính đúng học thuật của bộ giải.", "", "## Các câu tạm loại", "", "| Đề | Câu | Lý do |", "| --- | ---: | --- |"])
    for exam_id, question in excluded:
        rows.append(f"| {exam_id} | {question['number']} | {'; '.join(question['issues'])} |")
    rows.extend(["", "## Tái lập và kiểm tra", "", "```powershell", "python -m pip install -r scripts/requirements.txt", "python scripts/import_questions.py", "python scripts/import_questions.py --check", "```", "", "Trong phiên triển khai ban đầu, dùng Python bundled của Codex vì Python hệ thống chưa có thư viện PDF. Script không cần mạng sau khi đã cài dependencies.", ""])
    REPORT_PATH.write_text("\n".join(rows), encoding="utf-8")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate the existing bank against the ZIP source CSVs without rewriting files.")
    arguments = parser.parse_args()
    if arguments.check:
        validate_bank(json.loads(BANK_PATH.read_text(encoding="utf-8")))
        return
    bank = create_bank()
    validate_bank(bank)
    DESTINATION.mkdir(parents=True, exist_ok=True)
    BANK_PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_report(bank)
    print(f"Wrote {BANK_PATH.relative_to(ROOT)} and {REPORT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
