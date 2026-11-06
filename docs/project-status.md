# Trạng thái dự án

- Tên dự án: FE Study (tên làm việc).
- Giai đoạn: ứng dụng local đã có; Supabase và Google provider đã cấu hình, đang kiểm tra đăng nhập đầu cuối.
- Nguồn mẫu: syminhman01/codex-project-template
- Phiên bản mẫu gốc: 1.0.0
- Bắt đầu triển khai ứng dụng: 05/11/2026.
- Cập nhật gần nhất: 06/11/2026.

## Đã chốt
- Tách frontend, backend và infra trong cùng repository.
- Tài liệu sản phẩm, kiến trúc và hợp đồng API được quản lý chung.
- HTML/CSS/JavaScript thuần, Supabase Auth/REST/RPC, Cloudflare Pages.
- Google sign-in, chấm nhiều đáp án đúng toàn bộ, dùng giải thích nguồn, loại câu thiếu nội dung khỏi chấm điểm.

## Đã thực hiện
- Nhập 30 đề/1.126 câu: 1.107 eligible, 19 excluded, giữ hình và giải thích nguồn.
- Luyện, thi 50 phút, ôn sai, lịch sử và lưu local; có code đồng bộ sự kiện theo tài khoản.
- Sửa hai lỗi khôi phục bộ nhớ và chấm câu chưa xác nhận; lần kiểm tra 06/11 đạt 19/19 test, check ngân hàng và build.
- Supabase FPTFinalExam: schema, RLS, RPC và catalog đã được áp dụng và kiểm tra trực tiếp. Xem docs/operations/supabase-setup-progress.md.

## Việc tiếp theo
- Hoàn tất chọn tài khoản/xác nhận Google và kiểm thử đăng nhập/đồng bộ live; callback local đã lưu.
- Người dùng deploy theo docs/operations/deployment.md.
- Hoàn thiện tài liệu thiết kế DESIGN.md và .impeccable/design.json còn thiếu từ phiên trước.

## Vấn đề đang mở
- Google provider đã bật (API xác minh external.google=true); web đã chuyển đúng sang màn chọn tài khoản Google. Chưa xác minh đăng nhập hoàn tất hoặc đồng bộ thật giữa thiết bị.
- Chưa deploy website trong phiên làm việc. Một số README của bộ khung và checklist kế hoạch còn chưa được cập nhật đầy đủ.
