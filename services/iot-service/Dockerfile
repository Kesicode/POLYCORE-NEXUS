FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o iot-service .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget

RUN addgroup -g 1001 polycore && adduser -D -u 1001 -G polycore polycore
USER polycore

WORKDIR /app
COPY --from=builder /app/iot-service .

EXPOSE 8005

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8005/health || exit 1

ENTRYPOINT ["./iot-service"]
