# Frontend

Trạng thái: chưa chọn framework, chưa có ứng dụng chạy được.

- Framework và phiên bản: [CẦN ĐIỀN]
- Runtime / quản lý gói: [CẦN ĐIỀN]
- Lệnh chạy / test / build: xem docs/engineering/development.md sau khi chốt.
- Dockerfile của frontend sẽ đặt tại đây nếu cần container.

## Bố trí dự kiến

- src/app/: khởi động, routing, providers; điều chỉnh theo framework.
- src/features/: giao diện và logic theo nghiệp vụ.
- src/components/: thành phần giao diện dùng chung.
- src/lib/: API client, tiện ích nền tảng.
- public/: tài nguyên công khai, không chứa bí mật.
- tests/: kiểm tra frontend; unit test cũng có thể đặt cạnh mã nguồn.
