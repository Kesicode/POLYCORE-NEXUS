# PolyCore Nexus — Makefile
# Requires: docker, docker compose, go, cargo, node, python3

.PHONY: help up down build dev clean logs test lint \
        setup-env db-migrate db-seed \
        api-gateway ai-service execution-service iot-service web

# ─── Default target ───────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "PolyCore Nexus — Available targets:"
	@echo ""
	@echo "  make up            Start all services with Docker Compose"
	@echo "  make down          Stop all services"
	@echo "  make build         Build all Docker images"
	@echo "  make dev           Start only infrastructure (postgres, redis, mqtt)"
	@echo "  make logs          Tail all service logs"
	@echo "  make clean         Remove containers and volumes"
	@echo ""
	@echo "  make setup-env     Copy .env.example to .env"
	@echo "  make db-migrate    Run database migrations"
	@echo "  make db-seed       Seed demo data"
	@echo ""
	@echo "  make test          Run all tests"
	@echo "  make lint          Run all linters"
	@echo ""
	@echo "  make api-gateway   Build and run Go API gateway locally"
	@echo "  make ai-service    Build and run Python AI service locally"
	@echo "  make web-install   Install frontend npm packages"
	@echo "  make web-dev       Start frontend dev server"
	@echo ""

# ─── Docker Compose ───────────────────────────────────────────────────────────
up:
	docker compose up --build -d

up-full:
	docker compose --profile monitoring up --build -d

down:
	docker compose down

build:
	docker compose build

dev:
	docker compose up -d postgres redis mosquitto

logs:
	docker compose logs -f

clean:
	docker compose down -v --remove-orphans

restart: down up

# ─── Environment ──────────────────────────────────────────────────────────────
setup-env:
	@if [ ! -f .env ]; then cp .env.example .env && echo ".env created"; else echo ".env already exists"; fi

# ─── Database ─────────────────────────────────────────────────────────────────
db-migrate:
	@echo "Running migrations..."
	@PGPASSWORD=$${POSTGRES_PASSWORD:-polycore_secret} psql \
		-h $${POSTGRES_HOST:-localhost} \
		-U $${POSTGRES_USER:-polycore} \
		-d $${POSTGRES_DB:-polycore_nexus} \
		-f database/migrations/001_initial_schema.sql
	@echo "Migrations complete"

db-seed:
	@echo "Seeding data..."
	@PGPASSWORD=$${POSTGRES_PASSWORD:-polycore_secret} psql \
		-h $${POSTGRES_HOST:-localhost} \
		-U $${POSTGRES_USER:-polycore} \
		-d $${POSTGRES_DB:-polycore_nexus} \
		-f database/seeds/001_seed_data.sql \
		-f database/seeds/002_demo_users.sql
	@echo "Seed complete"

db-shell:
	@PGPASSWORD=$${POSTGRES_PASSWORD:-polycore_secret} psql \
		-h $${POSTGRES_HOST:-localhost} \
		-U $${POSTGRES_USER:-polycore} \
		-d $${POSTGRES_DB:-polycore_nexus}

# ─── Go API Gateway ───────────────────────────────────────────────────────────
api-gateway:
	cd services/api-gateway && go run .

api-gateway-build:
	cd services/api-gateway && go build -o bin/api-gateway .

api-gateway-test:
	cd services/api-gateway && go test ./...

# ─── Python AI Service ────────────────────────────────────────────────────────
ai-service:
	cd services/ai-service && python -m uvicorn main:app --reload --port 8001

ai-service-install:
	cd services/ai-service && pip install -r requirements.txt

# ─── Rust Execution Service ───────────────────────────────────────────────────
execution-service:
	cd services/execution-service && cargo run

execution-service-build:
	cd services/execution-service && cargo build --release

execution-service-test:
	cd services/execution-service && cargo test

# ─── Go IoT Service ───────────────────────────────────────────────────────────
iot-service:
	cd services/iot-service && go run .

# ─── React Frontend ───────────────────────────────────────────────────────────
web-install:
	cd apps/web && npm install --legacy-peer-deps

web-dev:
	cd apps/web && npm run dev

web-build:
	cd apps/web && npm run build

# ─── Testing ──────────────────────────────────────────────────────────────────
test: api-gateway-test execution-service-test
	@echo "All tests complete"

# ─── Linting ──────────────────────────────────────────────────────────────────
lint:
	cd services/api-gateway && go vet ./...
	cd services/execution-service && cargo clippy
	cd apps/web && npm run lint || true
	@echo "Linting complete"

# ─── Algorithm Benchmarks ─────────────────────────────────────────────────────
bench-fibonacci:
	@echo "=== Fibonacci(40) across languages ==="
	@echo "[Python]" && python3 algorithms/fibonacci/fibonacci.py 40
	@echo "[JavaScript]" && node algorithms/fibonacci/fibonacci.js 40
	@command -v go >/dev/null 2>&1 && echo "[Go]" && cd algorithms/fibonacci && go run fibonacci.go 40 || true
	@command -v rustc >/dev/null 2>&1 && echo "[Rust]" && cd algorithms/fibonacci && rustc fibonacci.rs -O -o /tmp/fib_rs && /tmp/fib_rs 40 || true
