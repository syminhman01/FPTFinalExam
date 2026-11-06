# Deploy FE Study: Google + Supabase + Cloudflare Pages

Hướng dẫn để chủ dự án tự triển khai. Ngày 06/11/2026 đã nối project Supabase FPTFinalExam, áp dụng schema, nạp catalog, bật Google provider và lưu callback local; xem supabase-setup-progress.md. Với project này không chạy lại migration 001. Luồng đã tới màn chọn tài khoản Google; chưa hoàn tất xác minh đăng nhập/đồng bộ đầu cuối. Website chưa được deploy trong phiên này. Tất cả lệnh dưới đây chạy tại gốc repository.

## 1. Chuẩn bị và chạy local

Cài Node.js 22.16+ hoặc 24 LTS:

    npm ci
    npm test
    npm run check
    npm run build
    npm run dev

Mở http://localhost:4173. Chưa cấu hình Google thì học/lưu local. Không dùng file:// vì web tải JSON bằng fetch.

## 2. Supabase database

1. Dùng tài khoản cá nhân tạo project Free tại https://supabase.com/dashboard.
2. Trong SQL Editor, chạy backend/database/migrations/001_study_events.sql một lần trên project mới.
3. Chạy backend/database/seeds/question_catalog.sql để nạp 1.126 metadata câu hỏi. Khi đổi ngân hàng, chạy npm run seed:catalog rồi cập nhật seed.
4. Lấy Project URL và publishable key (hoặc legacy anon key) trong phần Connect/API Keys.

Migration không drop dữ liệu. Nếu đã áp dụng thì không chạy lại toàn migration; thay đổi schema cần migration mới. Seed chỉ cập nhật catalog, không đụng tiến độ.

## 3. Google OAuth

Theo [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google):

1. Tạo/chọn Google Cloud project của bạn. Trong Google Auth Platform cấu hình Branding/Audience/Data Access cho đăng nhập cơ bản (openid, email, profile).
2. Tạo OAuth client loại Web application.
3. Authorized JavaScript origins: http://localhost:4173 và URL HTTPS Cloudflare ở bước 5. Nếu dùng 127.0.0.1 hoặc cổng khác thì thêm đúng origin đó.
4. Authorized redirect URI: callback được Supabase Google provider hiển thị, thường https://YOUR-PROJECT.supabase.co/auth/v1/callback.
5. Nếu Google app ở Testing/External, thêm email Google sẽ dùng vào Test users.
6. Trong Supabase Authentication → Sign In / Providers → Google, bật provider và nhập Client ID/Client secret.
7. Trong Authentication → URL Configuration: Site URL là URL website; Redirect URLs gồm http://localhost:4173/** và URL HTTPS website (có thể thêm /** cho các đường dẫn trong site).

Google client secret chỉ nhập vào Supabase provider, KHÔNG đưa vào .env frontend hoặc Git. Không cấp scope ngoài nhu cầu đăng nhập.

## 4. Cấu hình ứng dụng

Copy .env.example thành .env, chỉ điền hai giá trị công khai:

    PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
    PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY

Dùng publishable/anon key, KHÔNG dùng service_role hoặc sb_secret_. Sau đó chạy npm run build và khởi động lại npm run dev.

Thử Google login, làm vài câu, reload và mở bằng trình duyệt/thiết bị khác cùng tài khoản. Guest chưa đăng nhập chỉ được upload khi chọn Gộp vào tài khoản.

## 5. Cloudflare Pages

Theo [Cloudflare Static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/):

1. Đăng nhập Cloudflare của bạn → Workers & Pages → tạo Pages project từ repository của bạn (xác minh owner/repo trước khi cấp quyền Git).
2. Framework preset: None. Root directory: gốc repository.
3. Build command: npm run build. Build output directory: dist.
4. Thêm environment variables PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY và NODE_VERSION=24.
5. Deploy; dùng URL HTTPS *.pages.dev được cấp, chưa cần mua domain.
6. Quay lại Google/Supabase thêm đúng origin/redirect URL production, rồi kiểm tra đăng nhập ở URL đã deploy.

Không có bí mật nào phải đi vào frontend. .env nằm trong .gitignore. Public bank JSON/ảnh đi cùng bản build, không kèm ZIP/PDF gốc. _headers áp dụng CSP chỉ cho same-origin và Supabase hosted; dùng domain Supabase tùy chỉnh thì phải cập nhật connect-src tương ứng.

Nếu không dùng Git integration: npm run build, upload NỘI DUNG dist bằng Pages Direct Upload. Biến môi trường phải được điền trước build local.

## 6. Kiểm tra sau deploy

- Mở laptop/điện thoại, chọn đúng hai môn và số đề.
- Single và multi chấm đúng toàn bộ; xem giải thích; câu tạm loại không tham gia chấm.
- Thi chỉ xem đáp án sau nộp; reload rồi tiếp tục vẫn đúng thời hạn.
- Cùng Google trên hai máy nhận lịch sử/câu sai; chờ khoảng 30 giây hoặc bấm trạng thái lưu để sync.
- Hai tài khoản khác nhau không thấy tiến độ nhau; logout trở lại guest.
- Offline sau khi trang đã tải vẫn lưu thao tác; online thì thử sync lại. Chưa bảo đảm khởi động trang từ đầu không mạng.

## Miễn phí và phục hồi

Tại thời điểm kiểm tra 05/11/2026, [Supabase Free](https://supabase.com/pricing) có quota và tạm dừng sau một tuần không hoạt động; [Cloudflare Pages Free](https://developers.cloudflare.com/pages/platform/limits/) có giới hạn build/tài nguyên. Kiểm tra lại gói trước khi bật dịch vụ; không cần nâng gói cho bước thử cá nhân.

Rollback lỗi UI bằng deployment trước trên Pages. Không drop study_events để rollback frontend. Trước sửa schema/catalog lưu bản sao và kiểm tra ảnh hưởng. Bản sao tiến độ có thể tải từ Lịch sử dưới dạng JSON sự kiện; UI hiện chưa có chức năng nhập lại file.
