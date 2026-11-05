# Backend Supabase

Supabase cung cấp Auth/Postgres/API; không có Node server hoặc Docker cần chạy.

1. Tạo Supabase project của chính bạn.
2. Chạy database/migrations/001_study_events.sql một lần bằng SQL Editor.
3. Chạy database/seeds/question_catalog.sql.
4. Bật Google provider theo docs/operations/deployment.md.

Migration tạo mới schema/chính sách/RPC, không xóa dữ liệu có sẵn. Seed chỉ upsert catalog công khai. Bảng events chỉ SELECT qua RLS; ghi qua RPC validation. Client không có quyền update/delete. Xóa tài khoản Auth có cascade tiến độ, chỉ làm khi chủ tài khoản yêu cầu.

npm test chạy migration/seed và kiểm tra RPC/RLS bằng PGlite. Chưa thay thế kiểm tra Supabase live. Rollback lỗi ứng dụng bằng frontend trước, không drop bảng tiến độ.
