# Infra

Quản lý cách chạy và triển khai frontend, backend cùng các dịch vụ phụ thuộc.

## Trạng thái
Chưa có cấu hình chạy được vì công nghệ và môi trường triển khai chưa chốt.
Không có compose.yaml giả để tránh hiểu nhầm hệ thống đã hoạt động.

## Cần quyết định
- Môi trường local / staging / production: [CẦN ĐIỀN]
- Dịch vụ, cổng, database và nơi lưu dữ liệu: [CẦN ĐIỀN]
- Hosting, tên miền, TLS, secret management: [CẦN ĐIỀN]
- Healthcheck, backup và rollback: [CẦN ĐIỀN]

## Sau khi chốt
- Tạo compose.yaml nếu dùng Docker Compose.
- Đặt Dockerfile trong frontend/ và backend/.
- Thêm nginx/, monitoring/ hoặc terraform/ chỉ khi sử dụng.
- Ghi lệnh chạy và dừng chính xác vào docs/engineering/development.md.
- Ghi triển khai và khôi phục vào docs/operations/deployment.md.
