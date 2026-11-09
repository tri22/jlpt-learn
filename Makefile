.PHONY: help up down build restart logs ps rebuild test test-backend lint clean db-reset dev dev-down dev-logs backup restore

COMPOSE := docker compose
COMPOSE_DEV := $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml

help:  ## Liệt kê các lệnh
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

up:  ## Dựng toàn bộ stack (nginx + backend x2 + redis + frontend + postgres)
	$(COMPOSE) up --build -d
	@echo "Nginx (LB):  http://localhost:$${NGINX_PORT:-8080}"
	@echo "API health:  http://localhost:$${NGINX_PORT:-8080}/api/v1/health"
	@echo "Postgres:    localhost:$${POSTGRES_PORT:-5433}"

dev:  ## Chạy stack ở chế độ dev (hot reload frontend + backend)
	$(COMPOSE_DEV) up --build -d
	@echo "App (dev):   http://localhost:$${NGINX_PORT:-8080}"
	@echo "Frontend:    http://localhost:$${NGINX_PORT:-8080}  (Vite HMR)"
	@echo "API health:  http://localhost:$${NGINX_PORT:-8080}/api/v1/health"
	@echo ""
	@echo "Theo dõi log: make dev-logs"

dev-down:  ## Dừng stack ở chế độ dev
	$(COMPOSE_DEV) down

dev-logs:  ## Theo dõi log của stack dev
	$(COMPOSE_DEV) logs -f

backup:  ## Backup PostgreSQL và MinIO
	bash scripts/backup_storage.sh

restore:  ## Restore PostgreSQL và MinIO từ BACKUP (cần CONFIRM=1)
	bash scripts/restore_storage.sh

down:  ## Dừng và xoá container
	$(COMPOSE) down

build:  ## Build lại image
	$(COMPOSE) build

restart:  ## Restart toàn bộ stack
	$(COMPOSE) restart

logs:  ## Theo dõi log
	$(COMPOSE) logs -f

ps:  ## Trạng thái container
	$(COMPOSE) ps

rebuild: down build up  ## Dựng lại từ đầu

test: test-backend  ## Chạy toàn bộ test

test-backend:  ## Test backend
	cd src/backend && python -m pytest -q

db-reset:  ## Xoá volume Postgres và nạp lại schema + data từ đầu
	$(COMPOSE) down -v
	$(COMPOSE) up -d postgres
	@sleep 10
	@echo "PostgreSQL đã khởi tạo schema; chạy make restore BACKUP=... CONFIRM=1 để nạp dữ liệu"

lint:  ## Lint frontend
	cd src/frontend && npm run lint

clean:  ## Xoá artifact build
	rm -rf src/frontend/dist
	find . -type d -name __pycache__ -not -path "./.venv/*" -exec rm -rf {} +
