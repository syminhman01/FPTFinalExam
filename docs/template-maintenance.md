# Bảo trì mẫu

## Phạm vi mẫu
Đây là repository chứa mẫu gốc. Dự án sản phẩm phải được tạo thành repository riêng.
Không đưa dữ liệu sản phẩm cụ thể hoặc secrets vào mẫu.

## Phiên bản
- PATCH: sửa lỗi hướng dẫn hoặc lỗi nhỏ của mẫu.
- MINOR: thêm thành phần tương thích.
- MAJOR: đổi quy trình hoặc cấu trúc cần điều chỉnh khi áp dụng.

## Phát hành
1. Kiểm tra liên kết nội bộ, nội dung hướng dẫn và không có secrets.
2. Cập nhật TEMPLATE-VERSION, README.md và CHANGELOG.md nhất quán.
3. Commit thay đổi.
4. Tạo tag vX.Y.Z trỏ đúng commit, rồi tạo GitHub Release với ghi chú.
5. Giữ repository ở Private và bật Template repository.

## Áp dụng cải tiến vào dự án đã tạo
GitHub template không tự đồng bộ. Đọc changelog, chọn thay đổi phù hợp,
xem diff và chạy kiểm tra của dự án trước khi áp dụng.
Giữ phiên bản mẫu gốc và ghi thay đổi đã tiếp nhận khi cần.
