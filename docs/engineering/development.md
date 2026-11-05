# Phát triển và kiểm tra

Node.js 22.16+ hoặc 24 LTS và npm; không cần Python để chạy web. Phiên đầu dùng Node 24.19.0, npm 12.2.1. Các lệnh chạy tại gốc repository.

| Công việc | Lệnh |
| --- | --- |
| Cài theo lockfile | npm ci |
| Chạy local | npm run dev |
| Nghiệp vụ/API/SQL | npm test |
| Kiểm tra ngân hàng/ảnh | npm run check |
| Build tĩnh ra dist | npm run build |
| Sinh catalog SQL | npm run seed:catalog |

Preview http://localhost:4173, chỉ bind loopback. Đặt PORT nếu cổng đã dùng. Chưa hot reload: sửa code xong chạy build và reload.

## Biến môi trường

.env tùy chọn: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY. Build nhúng cấu hình công khai và chặn sb_secret_/JWT service_role. Không cần .env khi học local.

## Nhập dữ liệu

Python 3.12 và scripts/requirements.txt chỉ cần khi tái nhập PDF:

    python -m pip install -r scripts/requirements.txt
    python scripts/import_questions.py
    python scripts/import_questions.py --check
    npm run seed:catalog
    npm run check

Python hệ thống ban đầu chưa có thư viện; đã dùng Python bundled Codex. Importer đọc ZIP trực tiếp và giữ nguồn. Sau tái nhập cần xem report và hình trước build.

## Phạm vi kiểm tra

Node test runner kiểm tra chấm đúng toàn bộ, khóa đáp án, thời hạn thi, câu sai theo lần kiểm tra mới nhất, merge hai máy, phân trang sync, retry, local storage tách tài khoản và escaping. PGlite chạy migration/seed trong Postgres nhúng để kiểm tra RPC/RLS.

Không có lint/typecheck khi chưa có công cụ tương ứng; mã ứng dụng là JavaScript. Kiểm thử Google OAuth/Supabase live chỉ thực hiện được sau cấu hình cloud. Kết quả thật được ghi ở docs/project-status.md.
