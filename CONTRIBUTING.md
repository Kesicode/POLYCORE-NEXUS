# Contributing to PolyCore Nexus

Thank you for your interest in contributing! This document explains how to get involved.

## Development Setup

See [README.md](README.md) for full setup instructions.

**Quick local start:**
```bash
# Start infrastructure
docker compose up -d postgres redis mosquitto

# Run services locally (each in its own terminal)
cd services/api-gateway && go run .
cd services/ai-service && uvicorn main:app --reload --port 8001
cd services/execution-service && cargo run
cd services/iot-service && go run .
cd apps/web && npm run dev
```

## Project Structure

| Directory | Language | Purpose |
|-----------|----------|---------|
| `services/api-gateway/` | Go | REST API, JWT auth, routing |
| `services/ai-service/` | Python | AI analysis, analytics |
| `services/execution-service/` | Rust | Sandboxed code execution |
| `services/iot-service/` | Go | MQTT, device simulation |
| `apps/web/` | TypeScript/React | Frontend |
| `algorithms/` | Multi-language | Benchmark implementations |
| `embedded/esp32/` | C | IoT firmware |
| `database/` | SQL | Schema + seeds |
| `runtimes/` | JSON | Language metadata |

## Coding Standards

### Go
- Run `go vet ./...` and `go fmt ./...` before committing
- Keep packages small and focused
- Write table-driven tests for pure functions

### Rust
- Run `cargo clippy` and `cargo fmt`
- Use `thiserror` for error types
- Avoid `unwrap()` in production paths

### Python
- Type hints on all public functions
- Run `ruff check .` before committing
- Keep FastAPI routes thin — logic in `services/`

### TypeScript/React
- Strict TypeScript mode — no `any` unless unavoidable
- Functional components only
- API calls go in `src/api/`, state in `src/stores/`

## Adding a New Language

1. Add language metadata to `runtimes/<language>/metadata.json`
2. Add a runner Docker image definition in `runtimes/<language>/Dockerfile`
3. Add a row to `database/seeds/001_seed_data.sql` for the language
4. Write at least one algorithm implementation in `algorithms/fibonacci/`
5. Test execution via the UI or API

## Pull Request Process

1. Fork the repository and create a feature branch: `git checkout -b feat/my-feature`
2. Write tests for new functionality
3. Ensure all CI checks pass
4. Describe your changes clearly in the PR description
5. Link any related issues

## Commit Convention

```
feat: add Julia language runner
fix: correct timeout handling in execution service
docs: update API reference for devices endpoint
chore: upgrade Go to 1.22
test: add unit tests for project service
```

## Reporting Bugs

Open a GitHub Issue with:
- OS and Docker version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (`docker compose logs <service>`)

## Security Issues

**Do not open a public GitHub Issue for security vulnerabilities.**
Please see [SECURITY.md](SECURITY.md) for responsible disclosure.
