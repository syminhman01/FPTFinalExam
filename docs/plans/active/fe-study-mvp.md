# FE Study MVP

- Trạng thái: Đang thực hiện
- Ngày: 2026-11-05
- Yêu cầu: web ôn FE cá nhân SSG104/SWT301 trong một ngày; xem PRODUCT.md.
- Quyết định đã chốt: Google, chấm đúng toàn bộ, dùng giải thích nguồn, loại câu mất phần hỏi, HTML/CSS/JS + Supabase + Cloudflare Pages.

## Phạm vi

Nhập dữ liệu 30 đề; luyện từng câu; thi 50 phút; ôn câu sai; lưu bài/lịch sử; tích hợp Google và đồng bộ tài khoản; hướng dẫn triển khai. Không tự deploy theo yêu cầu người dùng.

## Tiêu chí nghiệm thu

- [ ] Đủ 1.126 bản ghi có nguồn đối chiếu, trạng thái dữ liệu và đúng ánh xạ đáp án.
- [ ] Câu bị mất phần hỏi không tham gia bài chấm điểm.
- [ ] Luyện hiện đáp án sau xác nhận, thi chỉ hiện sau nộp/hết giờ.
- [ ] Chấm nhiều đáp án bằng so sánh chính xác tập lựa chọn.
- [ ] Reload giữ bài đang làm và thời hạn thi; lịch sử/câu sai hoạt động.
- [ ] Giao diện điện thoại/laptop, keyboard và trạng thái lỗi/rỗng.
- [ ] Google + cloud sync có code và schema phân quyền theo tài khoản; ghi rõ nếu chưa kiểm thử live.
- [ ] Build, kiểm tra nghiệp vụ/dữ liệu và tài liệu triển khai.

## Các bước

- [ ] Hợp đồng/dữ liệu và công cụ nhập
- [ ] Supabase schema, RPC và kiểm tra quyền
- [ ] Frontend
- [ ] Hướng dẫn cấu hình Google/Supabase/Cloudflare
- [ ] Kiểm tra và cập nhật trạng thái

## Giả định

- Số câu thi theo đề nguồn, thời gian chung 50 phút.
- Bài học cục bộ là tùy chọn trước đăng nhập; cloud chỉ hoạt động sau khi chủ dự án cấu hình.
- Chưa xác nhận tài khoản cloud và OAuth, do đó không thể nhận là đã xác minh Google live.

## Sửa lỗi theo yêu cầu ngày 06/11/2026

- [x] Khôi phục bộ nhớ hỏng bằng ghi trực tiếp sau xác nhận; giữ dữ liệu và trạng thái phục hồi nếu ghi thất bại.
- [x] Kết thúc bài luyện/ôn sai: chỉ chấm câu đã Kiểm tra; câu chưa xác nhận tính bỏ trống. Chế độ thi giữ cách chấm hiện có.
- Kiểm tra hồi quy bao phủ JSON hỏng, schema sai, lỗi ghi, mở lại trang, cách ly tài khoản và kết quả luyện sau replay. Đã tái hiện cả hai lỗi trước sửa; sau sửa `npm test` đạt 19/19, `npm run check` và `npm run build` thành công, `git diff --check` không có lỗi whitespace. Luồng khôi phục chạy qua entrypoint ứng dụng với bộ nhớ/DOM giả lập; chưa kiểm thử lại trên trình duyệt thật trong lần sửa này.
