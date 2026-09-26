# PolyCore Nexus

> **One Platform. Many Languages. One Engineering Ecosystem.**

PolyCore Nexus is a production-quality polyglot engineering platform where every language has a meaningful technical responsibility — not just a Hello World program.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React + TypeScript + Monaco Editor)  :3000            │
└───────────────────┬─────────────────────────────────────────────┘
                    │ HTTP / WebSocket
┌───────────────────▼─────────────────────────────────────────────┐
│  API Gateway (Go + Chi)                         :8080            │
│  JWT auth · Rate limiting · Request routing                      │
└────┬──────────────┬──────────────┬──────────────┬───────────────┘
     │              │              │              │
  ┌──▼──┐       ┌───▼───┐     ┌───▼───┐      ┌───▼───┐
  │ AI  │       │Exec   │     │ IoT   │      │ Java  │
  │Svc  │       │Svc    │     │ Svc   │      │ Svc   │
  │Py   │       │Rust   │     │ Go    │      │ Java  │
  │:8001│       │:8002  │     │:8005  │      │:8003  │
  └─────┘       └───┬───┘     └───┬───┘      └───────┘
                    │             │
              ┌─────▼───┐   ┌─────▼────┐
              │ Docker  │   │ MQTT     │
              │Sandbox  │   │ Broker   │
              │(runners)│   │:1883     │
              └─────────┘   └──────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
      ┌──▼──┐             ┌────▼───┐
      │ PG  │             │ Redis  │
      │:5432│             │:6379   │
      └─────┘             └────────┘
```

## Language Roles

| Language     | Service / Role                                 | Port  |
|-------------|------------------------------------------------|-------|
| **Go**      | API Gateway · IoT Service                       | 8080/8005 |
| **Rust**    | Sandboxed Execution Service                    | 8002  |
| **Python**  | AI Analysis Service · Analytics · Algorithms   | 8001  |
| **TypeScript** | React Frontend · Type-safe UI               | 3000  |
| **Java**    | Java Runner Service (Spring Boot stub)          | 8003  |
| **C++**     | Algorithm benchmark runner                     | —     |
| **C**       | ESP32 Firmware (embedded)                      | —     |
| **SQL**     | PostgreSQL schema & migrations                 | 5432  |
| **Rust**    | Quicksort, Fibonacci benchmark implementations | —     |
| **Go**      | Sieve of Eratosthenes benchmark               | —     |

25+ additional languages available as execution targets via Docker runners.

---

## Quick Start

### Prerequisites
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Git

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/polycore-nexus.git
cd polycore-nexus

# Copy and edit environment variables
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, JWT_SECRET, and optional AI keys
```

### 2. Start the Platform

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** (port 5432) — application database
- **Redis** (port 6379) — execution queue + session cache
- **Mosquitto MQTT** (port 1883/9001) — IoT message broker
- **API Gateway** (port 8080) — Go HTTP service
- **AI Service** (port 8001) — Python FastAPI service
- **Execution Service** (port 8002) — Rust sandboxed runner
- **IoT Service** (port 8005) — Go MQTT service + device simulator
- **Web** (port 3000) — React frontend

### 3. Open the Platform

```
http://localhost:3000
```

**Demo Credentials:**
| Role      | Email                    | Password              |
|-----------|--------------------------|----------------------|
| Admin     | `admin@polycore.dev`     | `PolyCoreAdmin2024!` |
| Developer | `dev@polycore.dev`       | `DevUser2024!`       |
| User      | `user@polycore.dev`      | `UserDemo2024!`      |

### 4. Optional: Enable Monitoring

```bash
docker compose --profile monitoring up
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3001  (admin/admin)
```

---

## Services

### 🟦 API Gateway (`services/api-gateway/`) — Go
- Chi router, JWT HS256 auth, rate limiting
- Proxies to downstream services
- REST API: `/api/v1/*`

### 🐍 AI Service (`services/ai-service/`) — Python
- FastAPI with Gemini → OpenAI → Anthropic fallback chain
- `/api/v1/ai/explain` — explain code
- `/api/v1/ai/analyze` — analyze code quality
- `/api/v1/ai/optimize` — optimization suggestions
- `/api/v1/analytics/statistics` — NumPy/SciPy stats

### ⚙️ Execution Service (`services/execution-service/`) — Rust
- Pops jobs from Redis queue via BLPOP
- Spawns Docker containers with strict limits:
  - 128 MB memory · 0.5 CPU · 32 PID limit
  - No network · read-only filesystem · 30s timeout
- Publishes results back to Redis Pub/Sub

### 📡 IoT Service (`services/iot-service/`) — Go
- Subscribes to `polycore/devices/+/telemetry`
- Built-in device simulator (3 simulated ESP32/RPi devices)
- Server-Sent Events stream at `/api/v1/telemetry/stream`

### 🌐 Frontend (`apps/web/`) — TypeScript/React
- Monaco editor for code editing
- Real-time execution output polling
- Language browser, project workspace, analytics charts
- Admin panel with service health

### 📟 ESP32 Firmware (`embedded/esp32/`) — C
- WiFi connection + MQTT client
- Publishes temperature, humidity, pressure, CPU usage
- Subscribes to command topic (reboot, blink)

---

## API Reference

### Authentication
```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

### Code Execution
```http
POST /api/v1/executions
{
  "language": "python",
  "sourceCode": "print('hello')",
  "stdin": "",
  "timeoutSecs": 10
}

GET  /api/v1/executions/{id}
GET  /api/v1/executions
```

### Projects
```http
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{id}
PUT    /api/v1/projects/{id}
DELETE /api/v1/projects/{id}
GET    /api/v1/projects/{id}/files
POST   /api/v1/projects/{id}/files
```

### AI Analysis
```http
POST /api/v1/ai/explain     { "code": "...", "language": "python" }
POST /api/v1/ai/analyze     { "code": "...", "language": "go" }
POST /api/v1/ai/optimize    { "code": "...", "language": "rust" }
POST /api/v1/analytics/statistics  { "data": [1,2,3,...] }
```

### IoT
```http
GET  /api/v1/devices
POST /api/v1/devices
GET  /api/v1/devices/{deviceId}/telemetry
GET  /api/v1/telemetry/stream    (SSE)
```

Full interactive docs: `http://localhost:8001/docs` (Swagger UI)

---

## Development

### Local Development (no Docker)

```bash
# 1. Start infrastructure
docker compose up -d postgres redis mosquitto

# 2. API Gateway
cd services/api-gateway
go run .

# 3. AI Service
cd services/ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# 4. Execution Service
cd services/execution-service
cargo run

# 5. IoT Service
cd services/iot-service
go run .

# 6. Frontend
cd apps/web
npm install --legacy-peer-deps
npm run dev
```

### Running Benchmarks

```bash
# Compare Fibonacci(40) across languages
make bench-fibonacci

# Or run individual implementations
python3 algorithms/fibonacci/fibonacci.py 40
node algorithms/fibonacci/fibonacci.js 40
```

---

## Security

- All code runs in isolated Docker containers with:
  - `--network none` — no internet access
  - `--memory 128m` — memory cap
  - `--cpus 0.5` — CPU throttle
  - `--read-only` filesystem with tmpfs `/sandbox`
  - `--pids-limit 32` — prevents fork bombs
- JWT HS256 tokens, 15-minute access / 7-day refresh
- bcrypt cost 12 password hashing
- Rate limiting: 60 req/min (auth), 300 req/min (general)
- See `docs/SECURITY_MODEL.md` for full details

---

## Repository Structure

```
polycore-nexus/
├── apps/web/               React TypeScript frontend
├── services/
│   ├── api-gateway/        Go — JWT auth, routing
│   ├── ai-service/         Python — AI + analytics
│   ├── execution-service/  Rust — sandboxed runner
│   └── iot-service/        Go — MQTT + device sim
├── algorithms/             Polyglot algorithm implementations
│   ├── fibonacci/          Python, Go, Rust, JS, C++
│   ├── primes/             Sieve of Eratosthenes
│   └── sorting/            Quicksort
├── database/
│   ├── migrations/         PostgreSQL schema
│   └── seeds/              Demo data
├── embedded/esp32/         ESP32 firmware (C/Arduino)
├── docs/                   Architecture, security docs
├── infrastructure/         Docker, Prometheus, Grafana configs
├── runtimes/               Per-language Docker runner configs
├── .github/workflows/      CI/CD (GitHub Actions)
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## License

MIT License — Copyright (c) 2024 PolyCore Nexus Contributors

---

*Built with ❤️ using Go, Python, Rust, TypeScript, C, SQL, and 25+ more languages.*
