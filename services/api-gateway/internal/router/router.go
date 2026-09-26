package router

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"polycore/api-gateway/internal/config"
	"polycore/api-gateway/internal/handlers"
	"polycore/api-gateway/internal/middleware"
	"polycore/api-gateway/internal/services"
)

// New creates and returns the complete HTTP router.
func New(pool *pgxpool.Pool, rdb *redis.Client, cfg *config.Config, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()

	// ─── Global middleware ────────────────────────────────────────────────────
	r.Use(middleware.RequestID)
	r.Use(middleware.StructuredLogger(logger))
	r.Use(middleware.SecurityHeaders)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigins},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// ─── Services ─────────────────────────────────────────────────────────────
	authSvc := services.NewAuthService(pool, rdb, cfg.JWTSecret)
	languageSvc := services.NewLanguageService(pool)
	executionSvc := services.NewExecutionService(pool, rdb, cfg)
	projectSvc := services.NewProjectService(pool)
	benchmarkSvc := services.NewBenchmarkService(pool)

	// ─── Handlers ─────────────────────────────────────────────────────────────
	systemH := handlers.NewSystemHandler(pool, rdb, cfg, logger)
	authH := handlers.NewAuthHandler(authSvc, logger)
	languageH := handlers.NewLanguageHandler(languageSvc, logger)
	executionH := handlers.NewExecutionHandler(executionSvc, logger)
	projectH := handlers.NewProjectHandler(projectSvc, logger)
	benchmarkH := handlers.NewBenchmarkHandler(benchmarkSvc, logger)
	deviceH := handlers.NewDeviceHandler(logger)

	jwtSecret := []byte(cfg.JWTSecret)
	authMiddleware := middleware.Authenticate(jwtSecret, logger)
	adminOnly := middleware.RequireRole("admin")

	// ─── Health (public, no rate limit) ──────────────────────────────────────
	r.Get("/health", systemH.Health)
	r.Get("/ready", systemH.Ready)

	// ─── Public API ───────────────────────────────────────────────────────────
	r.Group(func(r chi.Router) {
		// Stricter rate limit on auth endpoints
		r.Use(httprate.LimitByIP(60, time.Minute))
		r.Post("/api/v1/auth/register", authH.Register)
		r.Post("/api/v1/auth/login", authH.Login)
		r.Post("/api/v1/auth/refresh", authH.Refresh)
		r.Get("/api/v1/languages", languageH.List)
		r.Get("/api/v1/languages/{name}", languageH.GetByName)
	})

	// ─── Authenticated API ────────────────────────────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Use(httprate.LimitByIP(300, time.Minute))

		// Auth
		r.Post("/api/v1/auth/logout", authH.Logout)
		r.Get("/api/v1/auth/me", authH.Me)

		// Executions
		r.Post("/api/v1/executions", executionH.Create)
		r.Get("/api/v1/executions", executionH.List)
		r.Get("/api/v1/executions/{executionId}", executionH.Get)
		r.Delete("/api/v1/executions/{executionId}", executionH.Cancel)

		// Projects
		r.Get("/api/v1/projects", projectH.List)
		r.Post("/api/v1/projects", projectH.Create)
		r.Get("/api/v1/projects/{projectId}", projectH.Get)
		r.Put("/api/v1/projects/{projectId}", projectH.Update)
		r.Delete("/api/v1/projects/{projectId}", projectH.Delete)
		r.Get("/api/v1/projects/{projectId}/files", projectH.ListFiles)
		r.Post("/api/v1/projects/{projectId}/files", projectH.CreateFile)
		r.Put("/api/v1/projects/{projectId}/files/{fileId}", projectH.UpdateFile)

		// Benchmarks
		r.Get("/api/v1/benchmarks/algorithms", benchmarkH.ListAlgorithms)
		r.Post("/api/v1/benchmarks/run", benchmarkH.RunBenchmark)
		r.Get("/api/v1/benchmarks/runs", benchmarkH.ListRuns)
		r.Get("/api/v1/benchmarks/runs/{runId}", benchmarkH.GetRun)
		r.Get("/api/v1/benchmarks/results/{runId}", benchmarkH.GetResults)

		// Devices
		r.Get("/api/v1/devices", deviceH.List)
		r.Post("/api/v1/devices", deviceH.Register)
		r.Get("/api/v1/devices/{deviceId}", deviceH.Get)
		r.Get("/api/v1/devices/{deviceId}/telemetry", deviceH.GetTelemetry)
		r.Post("/api/v1/devices/{deviceId}/commands", deviceH.SendCommand)

		// System
		r.Get("/api/v1/system/health", systemH.ServiceHealth)
		r.Get("/api/v1/system/metrics", systemH.Metrics)
		r.Get("/api/v1/system/services", systemH.Services)
	})

	// ─── Admin API ────────────────────────────────────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Use(adminOnly)
		r.Use(httprate.LimitByIP(120, time.Minute))

		r.Get("/admin/users", authH.ListUsers)
		r.Put("/admin/users/{userId}/role", authH.UpdateUserRole)
		r.Put("/admin/users/{userId}/active", authH.ToggleUserActive)
		r.Get("/admin/executions", executionH.AdminList)
		r.Get("/admin/audit-logs", systemH.AuditLogs)
	})

	return r
}
