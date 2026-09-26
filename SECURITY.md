# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅ Yes     |

## Reporting a Vulnerability

**Please do NOT open a public GitHub Issue for security vulnerabilities.**

Report security issues by emailing: security@polycore.example.com (or open a private GitHub security advisory).

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations

You will receive a response within 48 hours and a fix within 7 days for critical issues.

## Security Design

### Code Execution Sandbox

All user-submitted code runs in isolated Docker containers:

| Control | Value |
|---------|-------|
| Memory limit | 128 MB |
| CPU quota | 0.5 vCPU |
| PID limit | 32 |
| Network | none (disabled) |
| Filesystem | read-only root + 32 MB tmpfs |
| Timeout | 30 seconds max |
| User | non-root (uid=1001) |

**No arbitrary code ever runs directly on the host machine.**

### Authentication

- JWT HS256 with 15-minute access token lifetime
- Refresh tokens: opaque UUID, 7-day TTL, stored in Redis
- bcrypt cost 12 for password hashing
- Tokens are invalidated on logout

### Rate Limiting

- Auth endpoints: 60 requests/minute per IP
- General API: 300 requests/minute per IP
- Admin API: 120 requests/minute per IP

### Dependencies

- Dependencies are pinned with exact versions in go.sum, Cargo.lock, and package-lock.json
- Dependabot is configured for automated security updates

### Data Protection

- Passwords are never stored in plaintext
- Execution source code is stored but not indexed or shared without user permission
- API keys (Gemini, OpenAI) are environment variables, never committed to source control
