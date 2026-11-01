# Hạ tầng
- Đọc AGENTS.md gốc, infra/README.md và docs/operations/.
- Cấu hình phối hợp dịch vụ đặt tại đây; Dockerfile đặt cạnh ứng dụng tương ứng.
- Không áp dụng cấu hình production chỉ để kiểm tra thay đổi local.
- Trước khi thay hạ tầng, xác định môi trường đích, ảnh hưởng và cách phục hồi.
- Dùng secret store hoặc biến môi trường thích hợp; không commit giá trị bí mật.
- Khi tạo Compose, kiểm tra đường dẫn build/env/volume tương đối với file Compose.
- Không thêm Kubernetes/Terraform hoặc monitoring stack nếu chưa có nhu cầu.
