package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all configuration for the API Gateway.
type Config struct {
	// Server
	Port        string
	Environment string

	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// Auth
	JWTSecret string

	// CORS
	CORSOrigins string

	// Downstream services
	AIServiceURL        string
	ExecutionServiceURL string
	JavaServiceURL      string
	IoTServiceURL       string

	// Execution limits
	ExecutionDefaultTimeoutSecs int
	ExecutionMaxTimeoutSecs     int
	ExecutionMaxMemoryMB        int
}

// FromEnv loads configuration from environment variables.
func FromEnv() (*Config, error) {
	cfg := &Config{
		Port:        getEnv("API_GATEWAY_PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://polycore:polycore_secret@localhost:5432/polycore_nexus"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:3000"),

		AIServiceURL:        getEnv("AI_SERVICE_URL", "http://localhost:8001"),
		ExecutionServiceURL: getEnv("EXECUTION_SERVICE_URL", "http://localhost:8002"),
		JavaServiceURL:      getEnv("JAVA_SERVICE_URL", "http://localhost:8003"),
		IoTServiceURL:       getEnv("IOT_SERVICE_URL", "http://localhost:8005"),

		ExecutionDefaultTimeoutSecs: getEnvInt("EXECUTION_DEFAULT_TIMEOUT_SECS", 10),
		ExecutionMaxTimeoutSecs:     getEnvInt("EXECUTION_MAX_TIMEOUT_SECS", 30),
		ExecutionMaxMemoryMB:        getEnvInt("EXECUTION_MAX_MEMORY_MB", 128),
	}

	if cfg.JWTSecret == "" {
		if cfg.Environment == "production" {
			return nil, fmt.Errorf("JWT_SECRET must be set in production")
		}
		cfg.JWTSecret = "dev_secret_change_me_in_production_must_be_32_chars_minimum"
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}
