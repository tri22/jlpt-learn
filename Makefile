.PHONY: help up down build restart logs ps rebuild test test-backend lint clean db-reset dev dev-down dev-logs backup restore

COMPOSE := docker compose
COMPOSE_DEV := $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml

help:  ## List available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

up:  ## Start the complete stack (nginx + backend + redis + frontend + postgres)
	$(COMPOSE) up --build -d
	@echo "Nginx (LB):  http://localhost:$${NGINX_PORT:-8080}"
	@echo "API health:  http://localhost:$${NGINX_PORT:-8080}/api/v1/health"
	@echo "Postgres:    localhost:$${POSTGRES_PORT:-5433}"

dev:  ## Start the development stack with frontend and backend hot reload
	$(COMPOSE_DEV) up --build -d
	@echo "App (dev):   http://localhost:$${NGINX_PORT:-8080}"
	@echo "Frontend:    http://localhost:$${NGINX_PORT:-8080}  (Vite HMR)"
	@echo "API health:  http://localhost:$${NGINX_PORT:-8080}/api/v1/health"
	@echo ""
	@echo "Follow logs: make dev-logs"

dev-down:  ## Stop the development stack
	$(COMPOSE_DEV) down

dev-logs:  ## Follow development stack logs
	$(COMPOSE_DEV) logs -f

backup:  ## Back up PostgreSQL and MinIO
	bash scripts/backup_storage.sh

restore:  ## Restore PostgreSQL and MinIO from BACKUP (requires CONFIRM=1)
	bash scripts/restore_storage.sh

down:  ## Stop and remove containers
	$(COMPOSE) down

build:  ## Rebuild images
	$(COMPOSE) build

restart:  ## Restart the complete stack
	$(COMPOSE) restart

logs:  ## Follow logs
	$(COMPOSE) logs -f

ps:  ## Show container status
	$(COMPOSE) ps

rebuild: down build up  ## Rebuild the stack from scratch

test: test-backend  ## Run all tests

test-backend:  ## Test backend
	cd src/backend && python -m pytest -q

db-reset:  ## Remove the Postgres volume and initialize schema and data again
	$(COMPOSE) down -v
	$(COMPOSE) up -d postgres
	@sleep 10
	@echo "PostgreSQL schema initialized; run make restore BACKUP=... CONFIRM=1 to load data"

lint:  ## Lint frontend
	cd src/frontend && npm run lint

clean:  ## Remove build artifacts
	rm -rf src/frontend/dist
	find . -type d -name __pycache__ -not -path "./.venv/*" -exec rm -rf {} +
