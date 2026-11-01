# Bắt đầu một dự án mới

## 1. Xác nhận repository

- [ ] Đã tạo repository mới bằng Use this template; không triển khai sản phẩm trực tiếp trong repo mẫu.
- [ ] Owner, tên repository và chế độ hiển thị đúng.
- [ ] Đã ghi nguồn mẫu trong docs/project-status.md.
- [ ] Đã sửa tiêu đề README thành tên dự án mới.
- [ ] Giữ TEMPLATE-VERSION để biết dự án khởi tạo từ bản mẫu nào.

## 2. Chốt yêu cầu tối thiểu

Điền các phần [CẦN ĐIỀN] trong:
- docs/product/overview.md: vấn đề, người dùng, kết quả mong muốn.
- docs/product/scope.md: MVP, phần chưa làm, ràng buộc.
- docs/product/user-flows.md: luồng chính và tiêu chí nghiệm thu.

Có thể yêu cầu Codex hỗ trợ làm rõ; thông tin chưa chốt phải được đánh dấu là đề xuất.

## 3. Chọn công nghệ

- [ ] Chốt frontend, backend, database, công cụ quản lý gói và phiên bản runtime.
- [ ] Ghi kiến trúc và lý do chọn trong docs/engineering/.
- [ ] Cập nhật frontend/README.md, backend/README.md và infra/README.md.
- [ ] Tạo manifest, lockfile, Dockerfile và hợp đồng API khi đã xác định nội dung.
- [ ] Điền lệnh cài đặt, chạy, lint, kiểm tra kiểu, test vào docs/engineering/development.md.
- [ ] Cấu hình biến môi trường từ các file .env.example, chỉ dùng giá trị local phù hợp.
- [ ] Kiểm tra không đưa biến bí mật vào bundle frontend.

## 4. Chuẩn bị cách chạy

Dockerfile của từng ứng dụng đặt trong frontend/ hoặc backend/.
Cấu hình Compose phối hợp các dịch vụ đặt trong infra/.
Mẫu chưa có compose.yaml chạy được; tạo file này sau khi chốt dịch vụ, cổng và healthcheck.

## 5. Làm tính năng đầu tiên

- [ ] Chọn một luồng sử dụng nhỏ có thể nghiệm thu.
- [ ] Với công việc nhiều bước, sao chép docs/plans/PLAN-TEMPLATE.md vào active/.
- [ ] Chốt thay đổi hợp đồng API trước hoặc cùng thay đổi hai phía.
- [ ] Triển khai, kiểm tra phù hợp, xem diff và cập nhật tài liệu.
- [ ] Cập nhật docs/project-status.md; chuyển kế hoạch hoàn tất sang completed/.

## Prompt khởi động gợi ý

> Hãy đọc AGENTS.md và START-HERE.md. Đọc tài liệu sản phẩm liên quan,
> tóm tắt thông tin đã có và những quyết định còn thiếu. Hỗ trợ tôi chốt
> mục tiêu, phạm vi MVP, tiêu chí nghiệm thu và công nghệ. Ở bước này chỉ
> phân tích, chưa viết mã ứng dụng hoặc triển khai dịch vụ.
