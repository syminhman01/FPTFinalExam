# Hợp đồng cloud sync v1

Supabase JS client gọi Auth / REST API. Publishable/anon key nhận diện project; JWT Google xác thực người dùng. Không gọi SQL trực tiếp từ frontend.

## Ngân hàng

GET /data/question-bank.json không cần đăng nhập, version 1. Subjects → exams → questions. Question có ID ổn định, prompt, options, correctOptionIds, explanation, source, issues, status ready/excluded và image tùy chọn cùng origin.

## Auth

SDK signInWithOAuth(provider google), PKCE, redirect về origin /. getSession/onAuthStateChange lấy tài khoản. Logout scope local. Không log token; SDK lưu phiên trên thiết bị để duy trì đăng nhập.

## Đọc tiến độ

GET /rest/v1/study_events, select=id,session_id,kind,happened_at,data, filter user_id=self, order happened_at.asc,id.asc, JWT bắt buộc. Range 1.000 hàng. RLS ép auth.uid()=user_id; filter không phải cơ chế bảo mật.

Response row: {id:uuid,session_id:uuid,kind,happened_at:ISO8601,data:object}. Client chuyển thành {id,sessionId,kind,at,data}, validate trước merge.

## Ghi tiến độ

POST /rest/v1/rpc/append_study_events, JWT bắt buộc. Body {items: StudyEvent[]}, tối đa 100/lần. Backend lấy user_id từ auth.uid(). Response integer = số sự kiện mới. Cùng UUID và nội dung là retry thành công; UUID trùng nội dung khác bị từ chối.

StudyEvent: {id:uuid,sessionId:uuid,kind,at:ISO8601,data}.

| kind | data | Kiểm tra |
| --- | --- | --- |
| start | {mode,subjectId,examId,questionIds} | Mode practice/exam/review; 1–2.000 câu duy nhất, ready, đúng môn; non-review phải đúng đề |
| answer | {questionId,optionIds} | Câu thuộc session, options có thật/không trùng; single tối đa một lựa chọn |
| check | {questionId} | Câu thuộc session, không thuộc mode exam |
| move | {cursor} | Integer không âm, nhỏ hơn số câu |
| submit | {} | Session tồn tại |

Mỗi session một start. Không nhận user_id hoặc điểm client tự khai. Reducer bỏ answer sau submit/deadline hoặc sau check trong luyện; điểm chỉ phục vụ tự học.

Lỗi 42501: thiếu quyền/đăng nhập. 22023: dữ liệu/quy tắc không hợp lệ. 22P02/22007: ID/thời gian sai định dạng. SDK trả error; UI giữ local và cho retry. Batch là transaction, lỗi không ghi một phần.

## Đồng bộ

Namespace guest/UUID tách biệt. Không tự gộp guest. Fetch remote, union UUID, upload thiếu; không ghi đè snapshot. Poll 30 giây khi visible, debounce sau thao tác, online/focus. Cùng câu sửa đồng thời theo timestamp/loại sự kiện/UUID; các câu khác nhau vẫn giữ cả hai. Không cam kết realtime hoặc đồng hồ thiết bị tuyệt đối đúng.
