# Software Requirements Specification (SRS)

## JLPT Learn — Nền tảng luyện thi JLPT N5

## 1. Bối cảnh và các bên liên quan

### 1.1 Bên liên quan

| Bên | Nhu cầu |
|---|---|
| Người học | Làm đề nhanh, rõ ràng, có kết quả và đáp án để tự học. |
| Người vận hành | Nạp dữ liệu, theo dõi lỗi, giới hạn truy cập và duy trì dịch vụ. |
| Người phát triển | API và dữ liệu có hợp đồng ổn định, dễ kiểm thử. |

### 1.2 Actor

- **Learner:** người dùng cuối, hiện có thể sử dụng không cần đăng nhập.
- **Operator:** vận hành crawler, dữ liệu, triển khai và giám sát.
- **System admin:** frontend, API, crawler, Nginx, Redis, JSON/Postgres.

## 2. Tổng quan sản phẩm

Luồng chính:

```text
Learner → React SPA → Nginx → FastAPI → Exam data
                                  ├→ Redis: rate limit
                                  └→ Postgres: schema/seed, runtime migration planned
```

## 3. Use case

### 3.1 Xem danh sách đề

1. Learner mở trang chủ, ôn tập hoặc thi thử.
2. Hệ thống gọi `GET /api/v1/exams`.
3. Hệ thống hiển thị tiêu đề, cấp độ, loại đề, số câu và thời lượng.
4. Nếu tải lỗi, hệ thống hiển thị thông báo có thể hiểu được và không làm hỏng toàn trang.

### 3.2 Mở đề thi

1. Learner chọn một đề.
2. Hệ thống gọi `GET /api/v1/exams/{exam_id}`.
3. Hệ thống hiển thị các section theo thứ tự, câu hỏi và lựa chọn.
4. Hệ thống tải media theo URL/path được dữ liệu cung cấp.
5. Nếu đề không tồn tại, API trả 404 và frontend hiển thị trạng thái không tìm thấy.

### 3.3 Làm và nộp bài

1. Learner bắt đầu một đề; frontend tạo attempt bằng `POST /api/v1/attempts`.
2. Learner chọn đáp án, có thể bỏ qua câu chưa chắc chắn.
3. Learner bấm nộp hoặc attempt hết thời gian.
4. Frontend gửi `POST /api/v1/attempts/{id}/submit`.
5. Backend chấm theo answer key chuẩn hóa và trả trạng thái, điểm, số câu đúng/sai và đáp án được phép xem.



## 4. Yêu cầu chức năng

### 4.1 Danh mục và điều hướng

| ID | Yêu cầu | Trạng thái |
|---|---|---|
| FR-001 | Hệ thống Phải cung cấp danh sách đề JLPT N5 có `id`, tiêu đề, loại, số câu và thời lượng. | Đã có |
| FR-002 | Người học Phải lọc/điều hướng được khu vực thi thử và ôn tập theo môn. | Đã có một phần |
| FR-003 | Frontend Phải có trạng thái loading, lỗi và dữ liệu rỗng cho danh sách đề. | Đã có một phần |
| FR-004 | Hệ thống Nên giữ URL/hash route có thể chia sẻ và tải lại. | Đã có |

### 4.2 Nội dung đề và media

| ID | Yêu cầu | Trạng thái |
|---|---|---|
| FR-010 | API Phải trả chi tiết đề gồm section, vị trí câu, nội dung, lựa chọn và media liên quan. | Đã có |
| FR-011 | Câu hỏi Phải giữ thứ tự hiển thị ổn định. | Đã có |
| FR-012 | Hệ thống Phải hỗ trợ câu hỏi text, image và audio theo loại dữ liệu. | Đã có một phần |
| FR-013 | Media lỗi hoặc thiếu Phải không làm mất toàn bộ attempt; frontend Nên hiển thị fallback. | Chưa hoàn thiện |
| FR-014 | Đáp án đúng Phải không lộ trong payload làm bài trước khi nộp. | Cần xác nhận/kiểm tra |

### 4.3 Attempt, chấm điểm và kết quả

| ID | Yêu cầu | Trạng thái |
|---|---|---|
| FR-020 | Learner Phải tạo được attempt cho một đề hợp lệ. | Đã có skeleton |
| FR-021 | Hệ thống Phải nhận diện attempt không tồn tại bằng lỗi 404. | Đã có |
| FR-022 | Hệ thống Phải lưu lựa chọn theo `question_id` và `choice_id`, không phụ thuộc thứ tự frontend. | Mục tiêu |
| FR-023 | Hệ thống Phải chấm điểm nhất quán theo answer key và trả `score`/`max_score`. | Chưa hoàn thiện |
| FR-024 | Submit lặp lại Phải có kết quả xác định và không làm nhân đôi dữ liệu. | Mục tiêu |
| FR-025 | Khi hết thời lượng, hệ thống Phải tự động khóa hoặc nộp attempt theo chính sách đã cấu hình. | Mục tiêu |
| FR-026 | Kết quả Phải cho phép xem đáp án và câu sai sau khi nộp, theo chính sách công khai đáp án. | Mục tiêu |

### 4.4 Ôn tập và review

| ID | Yêu cầu | Trạng thái |
|---|---|---|
| FR-030 | Người học Phải mở được trang ôn tập theo môn. | Đã có một phần |
| FR-031 | Trang review Phải phân biệt câu đúng, sai, bỏ trống và chưa chấm. | Mục tiêu |
| FR-032 | Người học Nên chuyển tới câu hỏi hoặc đề gốc từ review. | Mục tiêu |

### 4.5 API và lỗi

| ID | Yêu cầu | Trạng thái |
|---|---|---|
| FR-040 | API Phải dùng envelope `{"data": ..., "error": ...}` cho response thành công/lỗi theo quy ước hiện có. | Đã có |
| FR-041 | API Phải trả 404 cho exam/attempt không tồn tại và thông báo không chứa secret. | Đã có một phần |
| FR-042 | API Phải validate payload tạo/nộp attempt tại trust boundary. | Đã có một phần |
| FR-043 | Health endpoint Phải cho biết trạng thái ứng dụng và Redis theo mức an toàn. | Đã có |

### 4.6 Dữ liệu và crawler

| ID | Yêu cầu | Trạng thái |
|---|---|---|
| FR-050 | Crawler Phải chuẩn hóa HTML/answer/media thành format mà repository đọc được. | Đã có |
| FR-051 | Crawler Phải không vượt qua verification gate/paywall và phải tôn trọng robots.txt. | Đã có quy định |
| FR-052 | Dữ liệu Phải có answer key có thể đối chiếu và script verify phải phát hiện sai lệch. | Đã có một phần |
| FR-053 | Hệ thống Nên chuyển runtime repository sang Postgres sau khi hợp đồng dữ liệu ổn định. | Kế hoạch |

### 4.7 Tài khoản và quyền truy cập

| ID | Yêu cầu | Trạng thái |
|---|---|---|
| FR-060 | Phiên bản hiện tại Phải cho phép luyện đề công khai không cần đăng nhập. | Đã có |
| FR-061 | Khi triển khai auth, mật khẩu Phải lưu dưới dạng hash và quyền Phải kiểm tra ở backend. | Kế hoạch |
| FR-062 | Login chưa triển khai Phải trả trạng thái rõ ràng, không giả vờ đăng nhập thành công. | Đã có một phần |

## 5. Yêu cầu phi chức năng

### 5.1 Hiệu năng và khả dụng

- NFR-001: Danh sách đề và nội dung đề phải tải qua API có timeout và trạng thái lỗi rõ ràng.
- NFR-002: API phải chạy được sau Nginx với nhiều backend instance mà không phụ thuộc state trong bộ nhớ của một instance, trừ fallback rate limit đã quy định.
- NFR-003: Rate limit phải áp dụng ở edge và application layer theo cấu hình hiện có; request bị giới hạn phải nhận response có thể hiểu được.
- NFR-004: Submit phải ưu tiên tính toàn vẹn dữ liệu hơn việc nhận request mơ hồ hoặc thiếu trường.

### 5.2 Bảo mật và riêng tư

- NFR-010: Không commit secret/token vào repository hoặc payload frontend.
- NFR-011: Không đưa answer key vào response làm bài nếu learner chưa nộp hoặc chưa được phép xem.
- NFR-012: Backend phải validate ID, payload và quyền truy cập trước khi đọc/ghi dữ liệu.
- NFR-013: Crawler chỉ truy cập nguồn được phép, không bypass verification/paywall.
- NFR-014: Log phải có request ID để truy vết nhưng không ghi mật khẩu, token hoặc dữ liệu nhạy cảm.

### 5.3 Trải nghiệm, accessibility và tương thích

- NFR-020: Frontend phải dùng thông báo lỗi có ngữ nghĩa, không chỉ phụ thuộc màu sắc.
- NFR-021: Điều khiển làm bài phải dùng được bằng bàn phím và có trạng thái focus rõ ràng.
- NFR-022: Nội dung tiếng Việt/Nhật phải hiển thị đúng Unicode; audio phải có nhãn hoặc mô tả phù hợp.
- NFR-023: SPA phải hoạt động trên trình duyệt hiện đại hỗ trợ React/Vite; layout phải dùng được trên màn hình nhỏ.

### 5.4 Vận hành và bảo trì

- NFR-030: Có health check cho liveness và tình trạng phụ thuộc quan trọng.
- NFR-031: Có log JSON và request ID xuyên suốt Nginx → backend.
- NFR-032: Dữ liệu PostgreSQL và MinIO phải có thể phục hồi từ backup.
- NFR-033: API contract, schema và thay đổi breaking phải được cập nhật trong tài liệu kỹ thuật.

## 6. Hợp đồng API baseline

Base path: `/api/v1`.

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/health` | Liveness và trạng thái Redis |
| GET | `/exams` | Danh sách đề |
| GET | `/exams/{exam_id}` | Chi tiết đề, câu hỏi, media |
| GET | `/exams/{exam_id}/answer-key` | Đáp án theo chính sách công khai |
| POST | `/attempts` | Tạo attempt |
| GET | `/attempts/{attempt_id}` | Lấy trạng thái attempt |
| POST | `/attempts/{attempt_id}/submit` | Nộp và chấm attempt |
| POST | `/auth/login` | Chưa triển khai; hiện trả 501 |

Response thành công dùng `data`; lỗi dùng `error.code`, `error.message`, và tùy chọn `error.details`. Client phải xử lý status HTTP trước khi tin vào dữ liệu.

## 7. Mô hình dữ liệu logic

Các thực thể chính:

- **Exam:** đề, cấp độ, loại, thời lượng, số câu, trạng thái publish.
- **Section:** phần/môn và thứ tự trong đề.
- **Question:** nội dung, loại câu hỏi, cấp độ.
- **Choice:** lựa chọn và cờ đúng ở lớp dữ liệu chấm điểm.
- **Media:** ảnh/audio/video và metadata phục vụ hiển thị.
- **Attempt:** đề đang làm, thời điểm bắt đầu/nộp, trạng thái, điểm.
- **AttemptAnswer:** lựa chọn của learner theo câu hỏi.
- **Account/User/Role/Permission:** mô hình đã có trong schema cho giai đoạn xác thực sau.

Nguồn dữ liệu runtime là PostgreSQL; media local được phục vụ từ MinIO. JSON/SQL
dump chỉ dùng cho bước nạp và tái tạo dữ liệu.

## 8. Tiêu chí nghiệm thu cấp sản phẩm

- AC-001: Người dùng mở trang và xem được danh sách đề hoặc nhận lỗi có thể hiểu được.
- AC-002: Người dùng mở một đề hợp lệ và thấy đúng thứ tự section/câu hỏi/lựa chọn.
- AC-003: Exam ID không tồn tại trả 404; frontend không hiển thị một đề rỗng như thể hợp lệ.
- AC-004: Người dùng tạo attempt, chọn đáp án và nộp bài; kết quả có điểm trên tổng điểm.
- AC-005: Submit attempt không tồn tại trả 404; payload sai bị từ chối bằng lỗi validation.
- AC-006: Sau khi nộp, người dùng xem được review theo chính sách answer key.
- AC-007: Một media không tải được không làm mất toàn bộ nội dung câu hỏi và có fallback phù hợp.
- AC-008: Request vượt rate limit bị chặn theo cấu hình, còn khi Redis lỗi hệ thống dùng fallback đã quy định và vẫn log được tình trạng.
- AC-009: Dữ liệu crawl có thể chạy qua bước verify mà không tạo answer key/mapping sai âm thầm.
- AC-010: Không có secret, password hoặc token nhạy cảm trong response/log/frontend bundle.

## 9. Ràng buộc, giả định và câu hỏi mở

### 9.1 Ràng buộc

- Chỉ dùng nội dung công khai được phép; nguồn và giấy phép nội dung phải được kiểm tra khi phát hành.
- Nginx là entry point bên ngoài; frontend không biết backend instance cụ thể.
- Media local được lưu ở MinIO; media URL ngoài tiếp tục giữ nguyên URL nguồn.

### 9.2 Giả định

- Phiên bản đầu ưu tiên người học chưa đăng nhập.
- Answer key dùng cho chấm điểm nội bộ; quyền hiển thị sau nộp cần được chốt theo sản phẩm.
- Một attempt gắn với một exam và không đổi exam giữa chừng.

### 9.3 Câu hỏi mở cần chốt trước khi hoàn thiện các phần mục tiêu

1. Attempt có cần lưu lâu dài cho người dùng ẩn danh hay chỉ tồn tại trong một phiên?
2. Thang điểm là số câu đúng, phần trăm, hay mô phỏng scaled score của JLPT?
3. Khi hết giờ, frontend hay backend là nguồn quyết định cuối cùng cho việc auto-submit?
4. Người học có được xem toàn bộ answer key sau submit hay chỉ xem đáp án của câu đã trả lời?
5. Khi chuyển sang Postgres, JSON còn là nguồn dự phòng hay chỉ dùng trong bước build/import?

## 10. Đối chiếu với codebase

| Khu vực | Thành phần liên quan |
|---|---|
| API exam | `src/backend/app/api/routers/exams.py`, `services/exam_service.py`, `repositories/exam_repository.py` |
| API attempt | `src/backend/app/api/routers/attempts.py`, `schemas/exam.py` |
| API client | `src/frontend/src/api/client.js`, `exams.js`, `attempts.js` |
| Điều hướng/UI | `src/frontend/src/App.jsx`, `pages/Home.jsx`, `Exam.jsx`, `MockTest.jsx`, `Review.jsx` |
| Dữ liệu | PostgreSQL và MinIO; khôi phục từ backup |
| Backup/restore | `scripts/backup_storage.sh`, `scripts/restore_storage.sh` |
| Vận hành | `infra/nginx/`, Redis middleware, `docs/infra.md` |

## 11. Lịch sử thay đổi

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0 | 2026-11-09 | Tạo SRS baseline và mục tiêu sản phẩm từ codebase hiện tại. |
