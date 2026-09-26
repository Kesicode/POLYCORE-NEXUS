package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"polycore/api-gateway/internal/config"
	"polycore/api-gateway/internal/db"
	"polycore/api-gateway/internal/router"
)

var version = "1.0.0"

func main() {
	// Load .env file if present
	_ = godotenv.Load()

	// Set up logger
	logger, _ := zap.NewProduction()
	if os.Getenv("ENVIRONMENT") == "development" {
		logger, _ = zap.NewDevelopment()
	}
	defer logger.Sync()

	logger.Info("Starting PolyCore Nexus API Gateway", zap.String("version", version))

	// Load configuration
	cfg, err := config.FromEnv()
	if err != nil {
		logger.Fatal("Configuration error", zap.Error(err))
	}

	// Connect to PostgreSQL
	pool, err := db.NewPostgresPool(context.Background(), cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("Failed to connect to PostgreSQL", zap.Error(err))
	}
	defer pool.Close()
	logger.Info("Connected to PostgreSQL")

	// Connect to Redis
	rdb, err := db.NewRedisClient(cfg.RedisURL)
	if err != nil {
		logger.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer rdb.Close()
	logger.Info("Connected to Redis")

	// Build HTTP router
	httpRouter := router.New(pool, rdb, cfg, logger)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      httpRouter,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 35 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logger.Info("API Gateway listening", zap.String("port", cfg.Port), zap.String("env", cfg.Environment))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server error", zap.Error(err))
		}
	}()

	// Graceful shutdown on SIGTERM / SIGINT
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down API Gateway...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server shutdown error", zap.Error(err))
	}

	logger.Info("API Gateway stopped")
}
