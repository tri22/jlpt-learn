# Phát triển local

## Yêu cầu

- Python 3.11+ và `venv`.
- Node.js hiện đại và npm cho frontend.
- Docker + Docker Compose (để chạy full stack).

## Cấu trúc repo

```text
src/backend/    API FastAPI
src/frontend/   SPA React + Vite
infra/          Cấu hình nginx + redis
```

## Full stack bằng Docker (khuyến nghị)

```bash
cp .env.example .env
make up
```

- Load balancer: <http://localhost:8080>
- API health: <http://localhost:8080/api/v1/health>

Các lệnh thường dùng:

```bash
make logs       # theo dõi log toàn stack
make ps         # trạng thái container
make down       # dừng
make rebuild    # dựng lại từ đầu
```

## Dev mode: hot reload

```bash
make dev
```

Dùng thêm file `docker-compose.dev.yml` đè lên `docker-compose.yml`:

| Service | Thay đổi so với production |
| --- | --- |
| `frontend` | Chạy `vite dev` (HMR) thay vì build tĩnh + nginx. Target Docker: `dev`. |
| `api-1`, `api-2` | `uvicorn --reload --reload-dir /app/app`. Target Docker: `dev`. |

Source (`src/frontend/src`, `src/backend/app`) được bind-mount nên sửa trên host
là container thấy ngay:

- Frontend: Vite gửi HMR qua WebSocket → trình duyệt tự cập nhật, giữ nguyên state.
- Backend: uvicorn theo dõi file, tự restart khi có thay đổi.

```bash
make dev-logs   # log realtime (frontend + backend)
make dev-down   # dừng stack dev
```

Các thứ không đổi so với production: Nginx vẫn là load balancer ở `:8080`,
vẫn có rate limit 2 tầng, vẫn trỏ API về `api-1`/`api-2`.

### Vite dev server trong container

`vite.config.js` đã bật `host: true` và `allowedHosts: true` để nginx proxy
tới được. Nếu hệ thống file không phát sự kiện (một số bind-mount trên
Docker Desktop), đặt trong `.env`:

```
WATCH_USEPOLLING=true
```

## Chạy từng phần riêng

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r src/backend/requirements.txt

cd src/backend
APP_DATABASE_URL=postgresql://jlpt:jlpt_dev_password@localhost:5433/jlpt \
APP_REDIS_ENABLED=false \
uvicorn app.main:app --reload --port 8000
```

Biến môi trường (prefix `APP_`) xem `src/backend/app/core/config.py` và `.env.example`.

Test:

```bash
make test-backend       # hoặc: cd src/backend && python -m pytest -q
```

### Frontend

```bash
cd src/frontend
npm install
npm run dev
```

Vite dev server chạy ở cổng 5173 và proxy `/api` sang Nginx (`VITE_API_PROXY_TARGET`,
mặc định `http://localhost:8080`). Nếu chưa chạy Docker, trỏ proxy sang
`http://localhost:8000` để gọi thẳng backend.

Khi chạy trong Docker (`make dev`), Vite chạy ở cổng 80 của container và nginx
proxy tới đó, nên vẫn truy cập qua <http://localhost:8080>.

```bash
npm run lint
npm run build
```

### Dữ liệu SQL (Postgres)

Schema nằm ở `infra/postgres/init/`. Dữ liệu được khôi phục từ backup.

```bash
make db-reset      # xoá volume Postgres và nạp lại từ đầu
```

Nạp thủ công vào một Postgres khác:

```bash
psql -U jlpt -d jlpt -v ON_ERROR_STOP=1 -f infra/postgres/init/schema.sql
make restore BACKUP=backups/<timestamp> CONFIRM=1
```

Chi tiết: [docs/data-sql.md](docs/data-sql.md).

## Quy trình thay đổi

1. Xác định dữ liệu hoặc hành vi bị ảnh hưởng.
2. Giữ format cũ tương thích nếu không có lý do bắt buộc phải đổi.
3. Chạy test backend (`make test-backend`) nếu đụng tới API.
4. Chạy `npm run lint` và `npm run build` nếu thay đổi frontend.
5. Cập nhật tài liệu và ghi rõ giới hạn còn lại.

## Không commit

- `.venv/`, `node_modules/`, build output (`dist/`).
- Cookie, token, thông tin đăng nhập.
- File `.env` (chỉ commit `.env.example`).
- Output crawl lớn hoặc media tải lại nếu không phải fixture có chủ đích.
