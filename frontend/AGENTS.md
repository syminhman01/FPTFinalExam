# Frontend
- Đọc AGENTS.md gốc và frontend/README.md; dùng quy ước framework đã chốt.
- Tổ chức features theo nghiệp vụ; component dùng chung chỉ tách khi có nhu cầu thực.
- Chỉ gọi API theo contracts/; không truy cập trực tiếp database.
- Không chứa secrets, private key hoặc token dịch vụ trong bundle.
- Kiểm tra giao diện với trạng thái loading, rỗng, lỗi và quyền truy cập phù hợp.
- Giữ tính dễ dùng, hỗ trợ bàn phím và responsive theo yêu cầu sản phẩm.
- Kiểm tra dữ liệu ở giao diện hỗ trợ người dùng; backend vẫn phải xác minh.
