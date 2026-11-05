# Kiến trúc FE Study

Người dùng chốt ngày 05/11/2026: HTML/CSS/JavaScript + Supabase + Cloudflare Pages. Xem decisions/001-static-study-with-supabase.md.

## Thành phần

- Frontend ES modules; esbuild đóng gói JS/CSS và cấu hình công khai ra dist.
- Ngân hàng JSON/ảnh tĩnh từ PDF/CSV; không parse PDF lúc học.
- core/study.js: replay sự kiện, chấm điểm và suy ra câu sai, độc lập DOM.
- lib/storage.js: namespace guest hoặc UUID tài khoản, lỗi đọc không tự ghi đè.
- lib/cloud.js: gọi Supabase Auth, REST và RPC theo contracts/study-api.md; không kết nối Postgres trực tiếp.
- Backend Supabase quản lý Auth, API, Postgres, RLS và validation; không có server tự vận hành.

## Lưu và đồng bộ

Sự kiện start/answer/check/move/submit có UUID bất biến và thời điểm ISO. Lưu local sau thao tác; đăng nhập thì lấy dữ liệu tài khoản, union UUID, upload phần thiếu từng lô 100. Fetch 1.000 hàng/trang. Đồng bộ sau thao tác, online/focus và mỗi 30 giây khi visible; không phải realtime.

Hai máy có thể tạo bài riêng. Cùng bài thì hợp nhất sự kiện, không ghi đè toàn snapshot. Nếu sửa đồng thời cùng câu, thứ tự thời điểm rồi loại sự kiện/UUID quyết định kết quả. Sai lệch đồng hồ có thể ảnh hưởng thứ tự.

Guest không tự upload khi đăng nhập; người dùng chủ động chọn gộp vào tài khoản hiện tại. Logout chuyển namespace về guest. Events không lưu email/tên; SDK quản lý auth session trên máy.

## Chấm và thời gian

Tập lựa chọn phải khớp chính xác đáp án. Deadline thi = start + 50 phút; reload/rời trang không reset. Quay lại bài hết giờ tạo submit tại deadline; answer muộn không tính. Câu excluded không được đưa vào session/mẫu số. Luyện đã check thì khóa đáp án, muốn trả lời lại phải tạo lượt mới.

Điểm là phản hồi tự học tại trình duyệt, không phải hệ thống thi chính thức/chống gian lận. API kiểm tra tài khoản, shape, câu thuộc bài và option IDs; không nhận điểm tự khai từ client.

## Giới hạn

Chưa cấu hình cloud chỉ có local. Đã tải trang thì mất mạng vẫn lưu thao tác, chưa có service worker bảo đảm cold start offline. Google/Supabase live cần kiểm tra sau cấu hình. Ngân hàng có chú thích nguồn và bộ giải phân tích; xem báo cáo dữ liệu.
