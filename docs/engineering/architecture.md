# Kiến trúc

Trạng thái: chỉ chốt ranh giới tổ chức; công nghệ chưa chốt.

## Các phần
- Frontend: giao diện, tương tác, trạng thái hiển thị, gọi API.
- Backend: API, nghiệp vụ, xác thực/phân quyền, truy cập database.
- Infra: cấu hình phối hợp và triển khai dịch vụ.
- Contracts: định nghĩa giao tiếp giữa frontend và backend.

Luồng dự kiến: Người dùng → Frontend → Backend → Database.
Database là thành phần dự kiến; loại và nhu cầu thực tế cần được xác nhận.

## Quyết định còn thiếu
- Framework/runtime và phiên bản: [CẦN ĐIỀN]
- Database, mô hình dữ liệu: [CẦN ĐIỀN]
- Kiểu API và cơ chế xác thực: [CẦN ĐIỀN]
- Môi trường triển khai: [CẦN ĐIỀN]

## Ranh giới
Frontend không truy cập trực tiếp database. Backend thực thi quyền và nghiệp vụ.
Không tự tách microservices. Ghi lý do quyết định quan trọng trong decisions/.
