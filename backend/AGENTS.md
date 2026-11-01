# Backend
- Đọc AGENTS.md gốc, backend/README.md và hợp đồng trong contracts/.
- Backend chịu trách nhiệm kiểm tra dữ liệu, nghiệp vụ, xác thực và phân quyền.
- Chia modules theo nghiệp vụ; không để controllers/routes chứa mọi tầng xử lý.
- Ghi rõ thay đổi request, response và mã lỗi trong contracts/.
- Migration đặt trong database/migrations/; ghi tác động dữ liệu và phương án phục hồi.
- Seeds chỉ chứa dữ liệu mẫu, không sao chép thông tin thật.
- Không log secrets hoặc dữ liệu cá nhân không cần thiết.
