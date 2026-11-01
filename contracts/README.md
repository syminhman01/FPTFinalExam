# Hợp đồng API

Nơi thống nhất giao tiếp frontend và backend.

Sau khi chọn kiểu API, tạo nguồn hợp đồng phù hợp, ví dụ openapi.yaml cho HTTP API.
Chưa tạo đặc tả giả khi chưa có endpoint được thống nhất.

Mỗi API cần mô tả:
- Method, path, xác thực và quyền.
- Request, response, validation, mã lỗi.
- Pagination, định dạng thời gian, versioning nếu có.
- Ví dụ dùng dữ liệu giả.

Chọn một nguồn chuẩn. Nếu sinh kiểu hoặc client tự động, ghi lệnh sinh và không sửa tay mã được sinh.
