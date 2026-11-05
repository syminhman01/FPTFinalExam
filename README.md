# FE Study

Web ôn Final Exam SSG104 và SWT301: chọn đề, luyện từng câu, thi thử 50 phút, ôn câu sai và lưu tiến độ. HTML/CSS/JavaScript thuần, Supabase cho Google và đồng bộ, Cloudflare Pages cho hosting.

## Chạy trên máy

Cần Node.js 22.16+ hoặc 24 LTS và npm. Từ thư mục gốc:

    npm ci
    npm run dev

Mở http://localhost:4173. Chưa cấu hình Supabase vẫn luyện được; tiến độ chỉ lưu trong trình duyệt trên thiết bị hiện tại. Sau sửa code chạy npm run build rồi reload; preview chưa có hot reload.

## Bộ đề

30 đề, 1.126 câu từ hai ZIP gốc ở docs/plans/active: 1.107 câu được chấm, 19 câu tạm loại vì thiếu/cắt nội dung. Đáp án/giải thích giữ CSV. Xem [báo cáo ngân hàng](docs/product/question-bank-report.md).

## Kiểm tra

    npm test
    npm run check
    npm run build

## Google, đồng bộ và triển khai

Theo [hướng dẫn triển khai](docs/operations/deployment.md). Copy .env.example thành .env, điền Supabase URL và publishable/anon key. Không đưa Google client secret hoặc service_role vào frontend. Chủ dự án cấu hình tài khoản cloud; code không giả lập đăng nhập thành công.

## Cấu trúc

- frontend/src: UI, nghiệp vụ học và API client.
- frontend/public/data: ngân hàng JSON và hình nguồn.
- backend/database: migration, RLS, RPC validation và catalog công khai.
- contracts/study-api.md: hợp đồng API đồng bộ.
- scripts: build, preview, nhập PDF và sinh catalog.
- tests: nghiệp vụ, sync, SQL/RLS với Postgres nhúng PGlite.

Khởi tạo từ syminhman01/codex-project-template 1.0.0; giữ TEMPLATE-VERSION để truy vết.
