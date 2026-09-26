package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"

	"polycore/iot-service/internal/broker"
	"polycore/iot-service/internal/handlers"
	"polycore/iot-service/internal/simulator"
	"polycore/iot-service/internal/store"
)

func main() {
	_ = godotenv.Load()

	logger, _ := zap.NewProduction()
	if os.Getenv("ENVIRONMENT") == "development" {
		logger, _ = zap.NewDevelopment()
	}
	defer logger.Sync()

	logger.Info("Starting PolyCore Nexus IoT Service")

	// Config
	mqttBroker := getEnv("MQTT_BROKER_URL", "tcp://localhost:1883")
	dbURL := getEnv("DATABASE_URL", "postgresql://polycore:polycore_secret@localhost:5432/polycore_nexus")
	port := getEnv("IOT_SERVICE_PORT", "8005")

	// In-memory device store
	deviceStore := store.NewDeviceStore()

	// Connect to MQTT broker
	mqttClient, err := broker.NewMQTTClient(mqttBroker, "polycore-iot-service", deviceStore, logger)
	if err != nil {
		logger.Warn("MQTT broker not available — running without MQTT", zap.Error(err))
		mqttClient = nil
	} else {
		logger.Info("Connected to MQTT broker", zap.String("url", mqttBroker))
	}

	// Start device simulator (publishes fake telemetry via MQTT)
	if mqttClient != nil && getEnv("ENABLE_SIMULATOR", "true") == "true" {
		sim := simulator.New(mqttClient, deviceStore, logger)
		go sim.Run(context.Background())
		logger.Info("Device simulator started")
	}

	// HTTP Router
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "DELETE"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	}))

	h := handlers.New(deviceStore, mqttClient, logger)

	r.Get("/health", h.Health)
	r.Get("/ready", h.Ready)
	r.Get("/metrics", promhttp.Handler().ServeHTTP)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/devices", h.ListDevices)
		r.Post("/devices", h.RegisterDevice)
		r.Get("/devices/{deviceId}", h.GetDevice)
		r.Delete("/devices/{deviceId}", h.DeleteDevice)
		r.Get("/devices/{deviceId}/telemetry", h.GetTelemetry)
		r.Post("/devices/{deviceId}/commands", h.SendCommand)
		r.Get("/telemetry/stream", h.TelemetryStream)
	})

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	go func() {
		logger.Info("IoT Service listening", zap.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server error", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down IoT Service...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)

	if mqttClient != nil {
		mqttClient.Disconnect(250)
	}
	logger.Info("IoT Service stopped")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
