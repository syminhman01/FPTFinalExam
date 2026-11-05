# ADR-001 — Web tĩnh và backend Supabase

- Ngày: 2026-11-05
- Trạng thái: Người dùng chấp thuận

## Bối cảnh

Web ôn hai môn trong một ngày, dùng laptop/điện thoại, đồng bộ Google, ưu tiên miễn phí và có thể chia sẻ sau này.

## Quyết định

HTML/CSS/JavaScript không framework; esbuild chỉ đóng gói. Ngân hàng static từ PDF/CSV. Supabase Auth cho Google; Data API/RPC và RLS cho sự kiện học bất biến. Cloudflare Pages phục vụ dist. Người dùng tự deploy theo hướng dẫn, không tự publish trong phiên này.

## Hệ quả

Không có server/container phải vận hành. Backend chứa schema, validation và policies. Frontend chỉ gọi API, không kết nối Postgres trực tiếp. Tiến độ local hoạt động trước cấu hình cloud. Sau cấu hình cần kiểm tra callback, hai tài khoản và đồng bộ thật. Thay ngân hàng cần rebuild/cập nhật catalog.
