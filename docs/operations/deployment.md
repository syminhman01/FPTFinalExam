# Triển khai và khôi phục

Trạng thái: chưa thiết lập; không có lệnh production được duyệt.

## Môi trường
| Môi trường | Địa chỉ | Nơi chạy | Cấu hình |
| --- | --- | --- | --- |
| Local | Cần xác định | Máy phát triển | Cần xác định |
| Staging | Chưa có | Chưa chọn | Chưa chọn |
| Production | Chưa có | Chưa chọn | Chưa chọn |

## Quy trình cần bổ sung
1. Xác minh môi trường đích và phiên bản.
2. Kiểm tra build/test; xem tác động migration.
3. Backup khi có thay đổi dữ liệu.
4. Triển khai bằng lệnh đã xác minh.
5. Kiểm tra healthcheck và luồng quan trọng.
6. Ghi dấu mốc triển khai.

## Rollback / restore
[CẦN ĐIỀN: quay lại phiên bản ứng dụng; phục hồi dữ liệu là quy trình riêng]

## Secrets / monitoring / backup
[CẦN ĐIỀN: nơi quản lý, người chịu trách nhiệm, cách kiểm tra; không ghi giá trị bí mật]
