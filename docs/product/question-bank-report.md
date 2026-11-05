# Kiểm tra ngân hàng câu hỏi

Nguồn: hai ZIP được người dùng cung cấp trong `docs/plans/active/`. Không sửa hoặc di chuyển nguồn.

## Kết quả nhập

| Môn | Đề | Tổng câu | Được chấm | Tạm loại | Có ảnh |
| --- | ---: | ---: | ---: | ---: | ---: |
| SSG104 | 19 | 473 | 458 | 15 | 18 |
| SWT301 | 11 | 653 | 649 | 4 | 15 |

## Quy tắc và giới hạn

- Đáp án và giải thích giữ nguyên từ CSV, kể cả các câu có chú thích cần lưu ý; không tự tạo giải thích mới.
- Chỉ đọc phần đề gốc trước phụ lục đáp án. Tất cả câu có ID, mã đề, số câu và trang nguồn để đối chiếu.
- Các phương án ghép đôi A/B/C nằm trong nội dung câu hỏi được giữ trong phần hỏi; danh sách lựa chọn là dãy A/B/C/D cuối cùng.
- Giữ hình gốc được nhúng trong PDF, kể cả ảnh đối chiếu cho các câu nguồn bị cắt. Ảnh chỉ được cắt theo vùng hình gốc, không chứa phụ lục đáp án.
- Câu mất/thiếu phần hỏi, nguồn bị cắt chữ hoặc không đủ phương án để chấm được lưu với `status: excluded`. Giao diện phải loại các câu này khỏi luyện tập, thi thử và mẫu số điểm.
- Câu có chú thích ngữ cảnh hoặc cách diễn đạt chưa chặt vẫn dùng đáp án được cung cấp, đúng lựa chọn của người dùng.
- Không sửa lỗi đánh máy hoặc OCR bằng suy đoán. Chuẩn hoá bốn nhãn OCR: SWT FA2024-FE-2963 câu 54 (`E_` thành `E.`); SP2025-FE-3561 câu 7 (`=.` thành `E.`), câu 28 (`©.` thành `D.`), câu 36 (`=.` thành `E.`). Hai nhãn E đầu tiên được đối chiếu CSV; hai nhãn còn lại dựa dãy phương án liền kề trong PDF. Loại dòng giao diện Windows Quick Settings lẫn cuối câu 1 của SP2025-FE-3561. Mọi sửa được ghi trong issues; không đổi đáp án hoặc tạo nội dung phương án.
- Kiểm tra tự động xác minh đủ 1.126 bản ghi, tính duy nhất, thứ tự câu, đáp án, giải thích, trang nguồn và ảnh. Kiểm tra này không chứng nhận tính đúng học thuật của bộ giải.

## Các câu tạm loại

| Đề | Câu | Lý do |
| --- | ---: | --- |
| SSG104_SU2024-FE-2394 | 3 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2394 | 7 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2394 | 9 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2394 | 11 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2394 | 13 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2394 | 15 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2394 | 21 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2394 | 22 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2394 | 24 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2395 | 10 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2395 | 13 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2395 | 14 | Cần lưu ý; Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2395 | 16 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2395 | 17 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SSG104_SU2024-FE-2395 | 24 | Nguồn bị cắt chữ; Nguồn bị cắt chữ; chưa đủ nội dung để đưa vào bài chấm điểm. |
| SWT301_FE_FA2024-FE-2963 | 51 | Cần lưu ý; Nguồn mất hoặc thiếu phần hỏi; tạm loại khỏi bài chấm điểm. |
| SWT301_FE_SP2025-FE-3561 | 14 | Cần lưu ý; Nguồn mất hoặc thiếu phần hỏi; tạm loại khỏi bài chấm điểm.; Nguồn không có phần hỏi. |
| SWT301_FE_SP2025-FE-3561 | 59 | Cần lưu ý; Nguồn mất hoặc thiếu phần hỏi; tạm loại khỏi bài chấm điểm. |
| SWT301_FE_SP2025-RE-3675 | 19 | Cần lưu ý; Nguồn mất hoặc thiếu phần hỏi; tạm loại khỏi bài chấm điểm.; Nguồn không có phần hỏi. |

## Tái lập và kiểm tra

```powershell
python -m pip install -r scripts/requirements.txt
python scripts/import_questions.py
python scripts/import_questions.py --check
```

Trong phiên triển khai ban đầu, dùng Python bundled của Codex vì Python hệ thống chưa có thư viện PDF. Script không cần mạng sau khi đã cài dependencies.
