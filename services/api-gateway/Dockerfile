FROM golang:1.22-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Download dependencies first (layer caching)
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w -X main.version=1.0.0" \
    -o api-gateway .

# ─── Final image ──────────────────────────────────────────────────────────────
FROM alpine:3.20

# Security: non-root user
RUN addgroup -g 1001 -S polycore && \
    adduser -u 1001 -S polycore -G polycore

# Install CA certificates for HTTPS
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy binary
COPY --from=builder /build/api-gateway .

# Use non-root user
USER polycore

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["./api-gateway"]
