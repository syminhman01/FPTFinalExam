# Hạ tầng FE Study

Hosting đích: Cloudflare Pages phục vụ dist. Backend: Supabase Auth/API/Postgres được quản lý. Chưa có tài nguyên cloud do phiên này tạo.

Không cần Docker/Compose/Kubernetes. Thông số build, cấu hình OAuth và thứ tự SQL nằm ở docs/operations/deployment.md. frontend/public/_headers được copy vào dist khi build. Cấu hình public trong .env chỉ dùng local, không commit; client secret chỉ trong Supabase provider.

Người dùng yêu cầu tự deploy sau khi được hướng dẫn, vì vậy không có lệnh production nào được thực thi.
