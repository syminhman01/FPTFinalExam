# Tiến độ cấu hình Supabase

- Cập nhật: 06/11/2026 (Asia/Saigon).
- Project do người dùng tạo: FPTFinalExam, tài khoản dashboard syminhman01, gói Free.
- Project ref: cetnjnzzsdhjiuahupwv.
- Project URL: https://cetnjnzzsdhjiuahupwv.supabase.co.
- Trước thiết lập: schema public không có bảng; project Healthy.

## Đã thực hiện và xác minh

1. Đã chạy backend/database/migrations/001_study_events.sql qua SQL Editor, đối chiếu editor với file trước thực thi; kết quả Success.
2. Đã chạy backend/database/seeds/question_catalog.sql, đối chiếu đầy đủ trước thực thi; kết quả Success.
3. SELECT kiểm tra: catalog 1.126 hàng, eligible 1.107, excluded 19.
4. study_events bật RLS; anon không có SELECT hoặc RPC; authenticated không có INSERT trực tiếp, có quyền RPC append_study_events.
5. Tạo .env local từ URL và publishable key, không dùng secret/service_role. File .env được Git ignore. Không ghi khóa vào tài liệu.
6. API /auth/v1/settings trả 200. Sau khi người dùng nhập thông tin OAuth và bật provider, đã xác minh external.google=true. Đọc study_events bằng publishable key khi chưa đăng nhập trả 401 như dự kiến.
7. Đã lưu Site URL http://localhost:4174 và bốn Redirect URLs chính xác: http://localhost:4173/, http://localhost:4174/, http://127.0.0.1:4173/, http://127.0.0.1:4174/.
8. Web local trả HTTP 200. Nút Đăng nhập Google đã mở đúng màn hình chọn tài khoản Google cho project này; đang chờ người dùng chọn tài khoản và hoàn tất xác nhận. Chưa kết luận đăng nhập hoặc đồng bộ đầu cuối đã thành công.

Schema được áp dụng bằng SQL Editor, không tự tạo bản ghi trong Supabase migration history. Không suy từ dòng No migrations trên dashboard rằng migration 001 chưa chạy; không chạy lại file tạo bảng cho project này.

## Còn lại

- Người dùng đã tạo Google OAuth client và tự nhập thông tin trực tiếp vào Supabase provider, không gửi Client Secret qua chat/Git.
- Callback Google: https://cetnjnzzsdhjiuahupwv.supabase.co/auth/v1/callback.
- Site URL/Redirect URLs local đã lưu; bổ sung URL production sau deploy.
- Kiểm tra đăng nhập Google và đồng bộ tiến độ thực giữa hai thiết bị/tài khoản.
- Deploy Cloudflare Pages theo deployment.md; chưa thực hiện trong phiên này.
