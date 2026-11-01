# Backend

Trạng thái: chưa chọn framework, database và chưa có API chạy được.

- Framework / runtime: [CẦN ĐIỀN]
- Database / migration tool: [CẦN ĐIỀN]
- Xác thực và phân quyền: [CẦN ĐIỀN]
- Lệnh chạy / test: cập nhật docs/engineering/development.md.
- Dockerfile của backend sẽ đặt tại đây nếu cần container.

## Bố trí dự kiến
- src/modules/: các module nghiệp vụ.
- src/common/: xử lý lỗi, middleware và phần dùng chung.
- src/config/: đọc và kiểm tra cấu hình.
- database/migrations/: thay đổi schema có quản lý phiên bản.
- database/seeds/: dữ liệu mẫu để phát triển.
- tests/: kiểm tra backend.
