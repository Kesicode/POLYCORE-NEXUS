# POLYCORE NEXUS — Architecture

> One Platform. Many Languages. One Engineering Ecosystem.

## Overview

PolyCore Nexus is a polyglot engineering platform built on a modular microservices architecture. Each programming language owns a specific technical responsibility. Services communicate through REST, WebSockets, gRPC, Redis pub/sub, and MQTT.

## High-Level Architecture

```
                         POLYCORE NEXUS
                              │
                    ┌─────────▼─────────┐
                    │   Web Dashboard   │
                    │ React + TypeScript│
                    │  Vite + Tailwind  │
                    └─────────┬─────────┘
                              │ HTTPS / WebSocket
                    ┌─────────▼─────────┐
                    │   API Gateway     │  :8080
                    │       Go          │
                    │  (Fiber/Chi)      │
                    └────────┬──────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   Python Service      Rust Runner        Java Service
   AI / Analysis      Secure Executor    Enterprise API
   :8001              :8002              :8003
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                        Job Queue (Redis)
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   Language Runners      Data Services      IoT Services
   (Docker containers)   R / Julia          MQTT Broker
                                            WebSocket
                                            ESP32
                             │
                       PostgreSQL + Redis
```

## Services

| Service           | Language | Port | Responsibility                        |
|-------------------|----------|------|---------------------------------------|
| api-gateway       | Go       | 8080 | Routing, auth middleware, rate limits |
| ai-service        | Python   | 8001 | AI analysis, code explanation         |
| execution-service | Rust     | 8002 | Sandboxed code execution              |
| java-service      | Java     | 8003 | Enterprise API, user management       |
| realtime-service  | Elixir   | 8004 | WebSocket, event streaming            |
| iot-service       | Go       | 8005 | MQTT broker proxy, device registry    |
| analytics-service | Python/R | 8006 | Statistical analysis, data viz        |
| web               | TypeScript| 3000 | React frontend                       |

## Communication Patterns

- **REST**: Primary API communication (versioned `/api/v1/...`)
- **WebSocket**: Real-time execution status, IoT telemetry, logs
- **Redis Pub/Sub**: Internal service events, execution queue
- **MQTT**: IoT device communication (topic: `polycore/devices/...`)
- **gRPC**: Execution service ↔ language runners (internal)

## Database Architecture

**PostgreSQL** (primary data store):
- Users, projects, files, executions, benchmarks
- Device registry and telemetry
- Plugins, artifacts, audit logs

**Redis**:
- Session cache
- Execution job queue
- Real-time pub/sub
- Rate limiting counters

## Security Model

- JWT-based authentication (RS256)
- Role-based access control (User / Developer / Admin)
- Code execution in isolated Docker containers
- CPU, memory, time, and network limits per execution
- Read-only container filesystem
- Secrets via environment variables only
- Rate limiting on all API endpoints
- Input validation on all endpoints (Zod / Pydantic)

## Execution Flow

```
User writes code in Monaco Editor
   ↓
POST /api/v1/executions
   ↓
API Gateway validates + queues job
   ↓
Redis job queue
   ↓
Rust execution-service picks job
   ↓
Spawns isolated Docker container
   ↓
Captures stdout/stderr + metrics
   ↓
Stores result in PostgreSQL
   ↓
Publishes to Redis pub/sub
   ↓
realtime-service broadcasts via WebSocket
   ↓
Frontend displays output + metrics
```

## Monorepo Structure

```
polycore-nexus/
├── apps/web/          — React TypeScript frontend
├── apps/android/      — Kotlin Android app
├── apps/ios/          — Swift iOS app
├── services/          — Backend microservices
├── runtimes/          — Language runner examples
├── algorithms/        — Benchmark algorithm implementations
├── embedded/esp32/    — ESP32 C/C++ firmware
├── plugins/           — Plugin system
├── infrastructure/    — Docker, Prometheus, Grafana configs
├── database/          — Migrations and seeds
├── scripts/           — Bash and PowerShell scripts
├── docs/              — All documentation
└── tests/             — Cross-service tests
```
