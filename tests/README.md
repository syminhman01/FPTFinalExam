# Kiểm tra toàn hệ thống

- Unit test nằm cạnh mã nguồn hoặc trong frontend/tests và backend/tests theo công nghệ.
- Integration trong từng ứng dụng kiểm tra ranh giới nội bộ.
- tests/e2e/ ở gốc kiểm tra luồng người dùng xuyên frontend, backend và dữ liệu.
- Chưa chọn test runner; không có test tự động chạy được trong mẫu nền.
- Dùng dữ liệu giả và môi trường tách biệt; không chạy E2E phá dữ liệu production.
