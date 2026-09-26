FROM rust:1.78-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main(){}' > src/main.rs
RUN cargo build --release 2>&1 | tail -5
RUN rm -f target/release/deps/execution*

# Build full application
COPY src ./src
RUN cargo build --release

# ─── Final image ──────────────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd -g 1001 polycore && useradd -u 1001 -g polycore -s /sbin/nologin polycore

WORKDIR /app
COPY --from=builder /build/target/release/execution-service .

# The execution service needs Docker socket access to create containers
# This is handled via volume mount in docker-compose, not here

USER polycore

EXPOSE 8002

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

ENTRYPOINT ["./execution-service"]
