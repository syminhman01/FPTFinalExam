# Frontend FE Study

HTML/CSS/JavaScript thuần, esbuild đóng gói src/main.js ra dist. Chạy lệnh từ gốc; xem docs/engineering/development.md.

- src/core: nghiệp vụ và ngân hàng độc lập DOM.
- src/views: danh sách, câu sai, lịch sử, luyện/thi/kết quả.
- src/lib: escaping, local storage và Supabase API.
- public/data: JSON và ảnh nguồn, không có dữ liệu cá nhân.
- public/_headers: security/cache headers Cloudflare.

Nội dung nguồn/tên tài khoản được escape. Ảnh mở lớn bằng link. API theo contracts/study-api.md; không chứa client secret/service_role. Chưa cấu hình cloud vẫn học local.
