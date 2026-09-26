# POLYCORE NEXUS — Security Model

## Execution Sandbox

Code execution NEVER happens on the host. Every execution is containerized.

### Container Constraints

```yaml
cpus: "0.5"          # Max 0.5 CPU cores
mem_limit: "128m"    # Max 128MB RAM
pids_limit: 32       # Max 32 processes (prevents fork bombs)
network_mode: none   # No network access
read_only: true      # Read-only root filesystem
tmpfs:
  /sandbox: "size=16m,noexec"  # 16MB temp workspace, no exec flag
```

### Timeout

- Default: 10 seconds
- Maximum allowed: 30 seconds
- Hard kill at: 35 seconds (SIGKILL)

### Output Limits

- stdout: 1MB max
- stderr: 512KB max
- Truncated with warning if exceeded

## Authentication

- Passwords hashed with bcrypt (cost factor 12)
- JWT RS256 tokens (15-minute access, 7-day refresh)
- Refresh token rotation on use
- Token revocation list in Redis
- HTTP-only cookies for refresh tokens

## Authorization (RBAC)

| Permission         | User | Developer | Admin |
|-------------------|------|-----------|-------|
| Run code          | ✓    | ✓         | ✓     |
| Create projects   | ✓    | ✓         | ✓     |
| Run benchmarks    | ✓    | ✓         | ✓     |
| Use AI service    | ✓    | ✓         | ✓     |
| Manage plugins    | —    | ✓         | ✓     |
| View all users    | —    | —         | ✓     |
| Manage languages  | —    | —         | ✓     |
| View audit logs   | —    | —         | ✓     |
| Disable users     | —    | —         | ✓     |

## API Security

- Rate limiting: 100 req/min per IP for auth, 1000 req/min for API
- CORS: explicit allowlist only
- Helmet security headers on all responses
- Input validation with Zod (TS) / Pydantic (Python) on every endpoint
- SQL parameterized queries only — never string concatenation
- Request ID on every response for tracing

## Secret Management

- All secrets in environment variables
- `.env` never committed (enforced via `.gitignore`)
- `.env.example` provided with placeholder values
- Startup validation: service refuses to start if required secrets are missing

## Dependency Scanning

- Go: `govulncheck`
- Python: `pip-audit`
- TypeScript: `npm audit`
- Rust: `cargo audit`
- Docker images: `trivy`
- Run in GitHub Actions on every push

## Audit Log

All sensitive actions are written to `audit_logs`:
- Login / logout
- Password change
- Role change
- Admin actions
- Plugin install/uninstall
- API key creation/revocation
