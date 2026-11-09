# Vận hành và xử lý sự cố

## Kiểm tra stack đang chạy

```bash
make ps                                  # trạng thái container
curl -s localhost:8080/api/v1/health     # {"status":"ok","redis":"up",...}
curl -s localhost:8080/api/v1/exams      # danh sách đề
curl -sI localhost:8080/                 # frontend SPA
```

## Khởi tạo và phục hồi dữ liệu

Tạo lại schema:

```bash
make db-reset
```

## Sự cố thường gặp

| Triệu chứng | Cách xử lý |
| --- | --- |
| Nginx liên tục restart | `docker compose logs nginx` → thường là lỗi cấu hình. Kiểm tra `limit_req` không đặt trong `if`, và hostname upstream đã resolve. |
| `redis: down` trong health | Redis chưa có mật khẩu khớp. `docker compose logs redis`; đảm bảo `REDIS_PASSWORD` giống nhau giữa `redis` và `api-*`. |
| 429 xuất hiện quá sớm | Đang bị tầng Nginx chặn: xem `docker compose logs nginx \| grep limiting`. Nới zone trong `infra/nginx/conf.d/rate-limit.conf`. |
| 429 nhưng log Nginx không báo | Bị tầng FastAPI chặn: xem header `X-RateLimit-Limit` và `X-RateLimit-Remaining`. Nới `APP_RATE_LIMIT_PER_MINUTE`. |
| Frontend hiện "Đang tải…" mãi | API không trả về. Kiểm tra `curl localhost:8080/api/v1/exams` và `docker compose logs api`. |
| Frontend không đổi sau khi sửa code | Build lại: `make rebuild`, hoặc `npm run build` trong `src/frontend/` nếu chạy dev server. |
| Media trả 404 | Kiểm tra object trong MinIO và Nginx đang proxy `/exams/` sang MinIO. |
| Postgres không có bảng | Schema chỉ chạy khi volume `pgdata` được tạo lần đầu. Chạy `make db-reset` để nạp lại. |
| Media trả về HTML | Không ghi file đó; kiểm tra URL, redirect và trạng thái quyền truy cập. |
| Frontend build lỗi | Chạy `npm run lint`, sau đó `npm run build` trong `src/frontend/`; đọc lỗi đầu tiên. |

## Phục hồi

```bash
make restore BACKUP=backups/<timestamp> CONFIRM=1
```

Toàn bộ stack có thể dựng lại từ đầu bằng `make rebuild`, sau đó restore backup.

## Bảo mật vận hành

- Không commit `.env`; chỉ commit `.env.example`.
- `REDIS_PASSWORD` và mọi secret sau này phải lấy từ secret store khi deploy.
- Redis không có cổng publish ra host — giữ nguyên như vậy.
- Nginx chưa có TLS; khi deploy thật phải thêm certificate và chuyển 443.
