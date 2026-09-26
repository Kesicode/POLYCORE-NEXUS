# PolyCore Nexus

> **One Platform. Many Languages. One Engineering Ecosystem.**

PolyCore Nexus is a production-quality polyglot engineering platform where every language has a meaningful technical responsibility — not just a Hello World program.

---

[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20macOS-blue?style=flat-square)](https://github.com/Kesicode/POLYCORE-NEXUS)
[![Docker](https://img.shields.io/badge/Docker-Compose%20v2-2496ED?style=flat-square&logo=docker&logoColor=white)](docker-compose.yml)
[![Go](https://img.shields.io/badge/Go-1.22-00ADD8?style=flat-square&logo=go&logoColor=white)](services/api-gateway)
[![Rust](https://img.shields.io/badge/Rust-2024%20Edition-black?style=flat-square&logo=rust&logoColor=white)](services/execution-service)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](services/ai-service)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%20React%2018-3178C6?style=flat-square&logo=typescript&logoColor=white)](apps/web)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](database)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?style=flat-square&logo=redis&logoColor=white)](database)
[![MQTT](https://img.shields.io/badge/MQTT-Mosquitto%202.0-660066?style=flat-square&logo=eclipsemosquitto&logoColor=white)](infrastructure/mosquitto)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🏛️ System Architecture

PolyCore Nexus unites diverse programming language ecosystems into a resilient, event-driven microservice mesh orchestrated by Docker Compose:

```
┌────────────────────────────────────────────────────────────────────────┐
│               Web Frontend — React 18 / TypeScript / Monaco            │
│               Port 3000 · SPA Studio · Real-Time Telemetry             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / WebSocket / SSE
┌───────────────────────────────────▼────────────────────────────────────┐
│                    API Gateway — Go 1.22 / Chi Router                  │
│     Port 8080 · JWT HS256 · Rate Limiter · Unified Proxy Envelope      │
└───────┬───────────────────────────┬────────────────────────────┬───────┘
        │                           │                            │
   HTTP │                      HTTP │                       HTTP │
┌───────▼──────┐            ┌───────▼──────┐             ┌───────▼───────┐
│  AI Service  │            │ IoT Service  │             │ Execution Svc │
│ Python 3.12  │            │   Go 1.22    │             │   Rust 2024   │
│  FastAPI     │            │ Chi + MQTT   │             │ Tokio + Axum  │
│  Port 8001   │            │  Port 8005   │             │   Port 8002   │
└──────────────┘            └───────┬──────┘             └───────┬───────┘
                                    │                            │
                            MQTT Pub/Sub                  Redis BLPOP /
                            1883 / 9001                   Docker Engine
                                    │                            │
                            ┌───────▼──────┐             ┌───────▼───────┐
                            │ Mosquitto    │             │ Isolated      │
                            │ MQTT Broker  │             │ Sandboxes     │
                            │ (Sim / ESP32)│             │ (25+ Runtimes)│
                            └──────────────┘             └───────────────┘
                                    │                            │
                                    └──────────────┬─────────────┘
                                                   │
                                     ┌─────────────┴─────────────┐
                                     │                           │
                              ┌──────▼──────┐             ┌──────▼──────┐
                              │ PostgreSQL  │             │    Redis    │
                              │     16      │             │    7.2      │
                              │  Port 5432  │             │  Port 6379  │
                              └─────────────┘             └─────────────┘
```

---

## 🎯 Language Responsibility Matrix

Every programming language in PolyCore Nexus has a dedicated, production-grade purpose tailored to its unique runtime characteristics:

| Language | Technical Domain & Responsibility | Implementation Details |
| :--- | :--- | :--- |
| **Go** | **High-Throughput Ingress & IoT Orchestration** | • `api-gateway`: JWT HS256 auth, rate limiting, request validation, downstream proxying.<br>• `iot-service`: MQTT pub/sub client, real-time hardware telemetry streams, device simulators. |
| **Rust** | **Sandboxed Compute & Low-Level Process Isolation** | • `execution-service`: Async worker consuming Redis queues via `BLPOP`.<br>• Docker API orchestration via `bollard` enforcing memory caps, CPU quotas, tmpfs, and zero-network isolation. |
| **Python** | **AI Inference, Analytics & Mathematical Benchmarking** | • `ai-service`: FastAPI microservice with fallback chain (Gemini → OpenAI → Anthropic → Heuristic).<br>• Statistical aggregation using NumPy/SciPy. |
| **TypeScript** | **Type-Safe Full-Stack Interface & Monaco Studio** | • `apps/web`: React 18, Vite, Zustand persisted state, Tailwind CSS, Monaco code editor, dynamic dashboards. |
| **C** | **Embedded Systems & Microcontroller Firmware** | • `embedded/esp32`: Real-time sensor acquisition, WiFi captive portal, MQTT client, hardware watchdogs for ESP32. |
| **C++** | **High-Performance Algorithmic Engines** | • `algorithms/fibonacci`, `algorithms/primes`: Matrix exponentiation, high-speed sorting and computation baselines. |
| **SQL** | **Relational Schemas, Constraints & Partitions** | • `database/migrations`: Partitioned telemetry tables, indexed audit logs, JSONB runtime configs, cascade foreign keys. |
| **Polyglot (25+)** | **Dynamic Sandboxed Execution Targets** | • Python, Go, Rust, C, C++, C#, Java, TypeScript, JavaScript, Ruby, PHP, Lua, Swift, Kotlin, R, Dart, Scala, Elixir, Haskell, Zig, Perl, Julia, Clojure, Bash, OCaml. |

---

## ⚡ Microservices Directory & Ports

| Service Name | Technology Stack | Host Port | Role & Capabilities |
| :--- | :--- | :--- | :--- |
| **`polycore-web`** | React 18, Vite, Tailwind | `3000` | Universal management portal, code editor, live telemetry viewer |
| **`polycore-api-gateway`** | Go 1.22, Chi, pgx | `8080` | Public API surface, authentication, request routing, rate limiting |
| **`polycore-ai-service`** | Python 3.12, FastAPI | `8001` | Intelligent code explanations, static analysis, statistical metrics |
| **`polycore-execution-service`**| Rust 2024, Tokio, Axum | `8002` | Redis queue worker, Bollard Docker container manager, sandbox isolation |
| **`polycore-iot-service`** | Go 1.22, Chi, Paho MQTT | `8005` | MQTT ingestion, hardware simulator (ESP32/RPi), device state store |
| **`polycore-postgres`** | PostgreSQL 16 Alpine | `5432` | Relational store, partitioned telemetry, user roles, project files |
| **`polycore-redis`** | Redis 7.2 Alpine | `6379` | High-speed job queue (`polycore:executions:queue`), token cache |
| **`polycore-mqtt`** | Eclipse Mosquitto 2.0 | `1883`, `9001` | Industrial MQTT messaging broker for physical & simulated hardware |

---

## 🔒 Security & Sandbox Isolation Architecture

The execution engine executes untrusted multi-language user code inside ephemeral, hardened OCI containers with strict resource and isolation constraints:

* **Network Air-Gapping:** `--network none` prohibits outbound and inbound network access.
* **Immutable Root Filesystem:** `ReadonlyRootfs: true` ensures the container container cannot mutate its base OS.
* **Ephemeral Memory-Only Mounts:** `/sandbox` and `/tmp` mounted via `tmpfs` (32 MB, `rw,exec,nosuid`).
* **Resource Clamping:** Hard caps at `128 MB RAM`, `0.5 vCPU` (500M nanocpus), and `32 PIDs` to neutralize fork bombs.
* **Base64 Payload Injection:** Source code is encoded and piped directly into the execution container without mounting host filesystem paths.
* **RBAC & Cryptography:** Passwords hashed with `bcrypt` (cost 12), sessions secured with `JWT HS256` (15m expiry, 7d refresh token rotation).

---

## 🚀 Quick Start Guide

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or [Docker Engine](https://docs.docker.com/engine/) (Linux)
* Git

### 1. Clone & Setup Environment
```bash
git clone https://github.com/Kesicode/POLYCORE-NEXUS.git
cd POLYCORE-NEXUS

# Copy sample configuration
cp .env.example .env
```

### 2. Launch the Platform
```bash
docker compose up --build -d
```
Docker Compose compiles the Go, Rust, and React applications into multi-stage production images and starts all 8 services.

### 3. Access Interfaces
* **Web Studio:** [http://localhost:3000](http://localhost:3000)
* **API Gateway Health:** [http://localhost:8080/health](http://localhost:8080/health)
* **AI Service OpenAPI Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)

### 4. Built-in Demo Credentials
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@polycore.dev` | `PolyCoreAdmin2024!` | Full system administration, user management, audit logs |
| **Developer** | `dev@polycore.dev` | `DevUser2024!` | Code execution, project workspaces, IoT control |
| **User** | `user@polycore.dev` | `UserDemo2024!` | Read-only catalogs, execution runner, personal projects |

---

## 🧪 Comprehensive Verification Suite

PolyCore Nexus includes an automated end-to-end test suite that verifies all core domain fields:

```powershell
powershell -File scripts/verify_platform.ps1
```

### Verified Live Status Matrix:

| Domain | Tested Field | Verification Method | Status |
| :--- | :--- | :--- | :---: |
| **Auth** | Admin Login | JWT issued with `role=admin` claim | ✅ **PASS** |
| **Auth** | Developer Login | JWT token issuance and validation | ✅ **PASS** |
| **Auth** | User Login | Standard user session establishment | ✅ **PASS** |
| **Auth** | Credential Defense | Rejection of invalid credentials (401 Unauthorized) | ✅ **PASS** |
| **Auth** | Identity Profile | `GET /api/v1/auth/me` with bearer token | ✅ **PASS** |
| **Auth** | Token Rotation | Cryptographic refresh token rotation | ✅ **PASS** |
| **Registry** | Polyglot Catalog | Full discovery of 25 active runtimes | ✅ **PASS** |
| **Registry** | Metadata Retrieval | Descriptors for Python, Go, Rust, TypeScript, C++ | ✅ **PASS** |
| **Execution** | Sandbox Dispatch | Redis queue ingestion & UUID generation | ✅ **PASS** |
| **Execution** | Sandbox Isolation | Bollard Docker container execution with stdout capture | ✅ **PASS** |
| **Execution** | History Retention | User execution history query | ✅ **PASS** |
| **Projects** | Workspace Creation | Project entity initialization in PostgreSQL | ✅ **PASS** |
| **Projects** | Project Querying | Filtered project listings per tenant | ✅ **PASS** |
| **Projects** | File Tree Management | Virtual file creation (`main.rs`) within project workspace | ✅ **PASS** |
| **IoT** | Device Mesh Ingress | API Gateway proxy to IoT device store | ✅ **PASS** |
| **IoT** | Hardware Simulator | ESP32 Alpha, ESP32 Beta, Raspberry Pi reporting | ✅ **PASS** |
| **IoT** | Telemetry Ingestion | Live sensor readings over MQTT / HTTP | ✅ **PASS** |
| **Benchmarks**| Algorithm Catalog | 10 benchmark algorithms loaded with metadata | ✅ **PASS** |
| **System** | Mesh Health Aggregation | Inter-service health monitoring | ✅ **PASS** |
| **System** | Queue Telemetry | Real-time queue depth and active worker reporting | ✅ **PASS** |
| **Security** | Admin Gatekeeper | Access to `/admin/users` restricted to admin role | ✅ **PASS** |
| **Security** | Non-Admin Barrier | 403 Forbidden enforced on unauthorized roles | ✅ **PASS** |
| **Microservices**| AI Engine (Python) | Health check & rule-based/LLM fallback readiness | ✅ **PASS** |
| **Microservices**| Execution Engine (Rust)| Tokio health & Docker socket connectivity | ✅ **PASS** |
| **Frontend** | React SPA Studio | Nginx static server delivery (HTTP 200 OK) | ✅ **PASS** |

---

## 📡 REST API Reference

All responses follow the unified PolyCore response envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "requestId": "6cf78ea0-3f41-45f8-b391-768a4176ec21"
}
```

### Core Endpoints

#### Authentication
* `POST /api/v1/auth/register` — Register a new account
* `POST /api/v1/auth/login` — Authenticate and receive token pair
* `POST /api/v1/auth/refresh` — Rotate refresh token
* `GET  /api/v1/auth/me` — Retrieve current authenticated user profile

#### Code Execution
* `POST /api/v1/executions` — Dispatch a code execution job
  ```json
  {
    "language": "python",
    "sourceCode": "print('Hello from PolyCore!')",
    "stdin": "",
    "timeoutSecs": 10
  }
  ```
* `GET  /api/v1/executions/{id}` — Poll execution status, exit code, stdout, stderr, and resource metrics
* `GET  /api/v1/executions` — List user execution history

#### Polyglot Registry
* `GET /api/v1/languages` — List all registered languages and runners
* `GET /api/v1/languages/{name}` — Retrieve detailed language execution profile

#### Workspaces & Projects
* `GET    /api/v1/projects` — List user projects
* `POST   /api/v1/projects` — Create new workspace project
* `GET    /api/v1/projects/{id}` — Retrieve project details
* `GET    /api/v1/projects/{id}/files` — List files in workspace
* `POST   /api/v1/projects/{id}/files` — Create file in project workspace

#### IoT & Telemetry
* `GET  /api/v1/devices` — List connected microcontrollers and simulated hardware
* `GET  /api/v1/devices/{id}/telemetry` — Retrieve historical telemetry
* `POST /api/v1/devices/{id}/commands` — Dispatch control command to device

#### System & Admin
* `GET /api/v1/system/services` — Aggregate service health
* `GET /api/v1/system/metrics` — Active worker metrics & queue depth
* `GET /admin/users` — Administrative user catalog (Admin role required)

---

## 📁 Repository Structure

```
POLYCORE-NEXUS/
├── apps/
│   └── web/                   # React 18, TypeScript, Tailwind, Monaco Editor
├── services/
│   ├── api-gateway/           # Go 1.22 — Chi Router, JWT Auth, Ingress Proxy
│   ├── ai-service/            # Python 3.12 — FastAPI, AI Inference, Analytics
│   ├── execution-service/     # Rust 2024 — Tokio, Bollard OCI Sandbox Worker
│   └── iot-service/           # Go 1.22 — MQTT Broker Integration, Device Sim
├── embedded/
│   └── esp32/                 # C / Arduino ESP32 firmware with MQTT telemetry
├── algorithms/                # Multi-language benchmark implementations
│   ├── fibonacci/             # Python, Go, Rust, JS, C++
│   ├── primes/                # Sieve of Eratosthenes
│   └── sorting/               # Quicksort
├── database/
│   ├── migrations/            # Versioned SQL migrations (001-003)
│   └── seeds/                 # Seed data and demo user definitions
├── infrastructure/            # Mosquitto MQTT, Prometheus & Grafana configs
├── runtimes/                  # 25+ language runner metadata & specs
├── scripts/                   # Platform verification & setup scripts
├── docker-compose.yml         # Unified 8-container service orchestration
├── Makefile                   # Automation targets
├── .env.example               # Environment template
└── README.md                  # System documentation
```

---

## 📄 License

PolyCore Nexus is open-source software licensed under the [MIT License](LICENSE).
