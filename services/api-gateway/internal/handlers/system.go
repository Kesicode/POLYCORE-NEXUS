package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"polycore/api-gateway/internal/config"
	"polycore/api-gateway/internal/response"
)

// SystemHandler handles system-level endpoints.
type SystemHandler struct {
	pool   *pgxpool.Pool
	rdb    *redis.Client
	cfg    *config.Config
	logger *zap.Logger
}

// NewSystemHandler creates a new SystemHandler.
func NewSystemHandler(pool *pgxpool.Pool, rdb *redis.Client, cfg *config.Config, logger *zap.Logger) *SystemHandler {
	return &SystemHandler{pool: pool, rdb: rdb, cfg: cfg, logger: logger}
}

// Health handles GET /health
func (h *SystemHandler) Health(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]interface{}{
		"service": "api-gateway",
		"status":  "ok",
		"time":    time.Now().UTC(),
	})
}

// Ready handles GET /ready — checks all dependencies
func (h *SystemHandler) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	deps := map[string]string{}
	allOK := true

	// Check PostgreSQL
	if err := h.pool.Ping(ctx); err != nil {
		deps["postgres"] = "error"
		allOK = false
	} else {
		deps["postgres"] = "ok"
	}

	// Check Redis
	if err := h.rdb.Ping(ctx).Err(); err != nil {
		deps["redis"] = "error"
		allOK = false
	} else {
		deps["redis"] = "ok"
	}

	if !allOK {
		response.JSON(w, r, http.StatusServiceUnavailable, map[string]interface{}{
			"service": "api-gateway",
			"status":  "degraded",
			"deps":    deps,
		})
		return
	}

	response.JSON(w, r, http.StatusOK, map[string]interface{}{
		"service": "api-gateway",
		"status":  "ready",
		"deps":    deps,
	})
}

// ServiceHealth handles GET /api/v1/system/health
func (h *SystemHandler) ServiceHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	services := h.checkDownstreamServices(ctx)
	response.JSON(w, r, http.StatusOK, map[string]interface{}{
		"services":  services,
		"timestamp": time.Now().UTC(),
	})
}

// Metrics handles GET /api/v1/system/metrics (basic system metrics)
func (h *SystemHandler) Metrics(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	// Queue depth from Redis
	queueDepth, _ := h.rdb.LLen(ctx, "polycore:executions:queue").Result()
	activeJobs, _ := h.rdb.SCard(ctx, "polycore:executions:active").Result()

	response.JSON(w, r, http.StatusOK, map[string]interface{}{
		"executionQueue": map[string]interface{}{
			"depth":  queueDepth,
			"active": activeJobs,
		},
		"timestamp": time.Now().UTC(),
	})
}

// Services handles GET /api/v1/system/services
func (h *SystemHandler) Services(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	services := h.checkDownstreamServices(ctx)
	response.JSON(w, r, http.StatusOK, map[string]interface{}{
		"services": services,
	})
}

// AuditLogs handles GET /admin/audit-logs
func (h *SystemHandler) AuditLogs(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.pool.Query(ctx,
		`SELECT id, COALESCE(user_id::text, 'system'), action, 
		        COALESCE(resource_type, ''), created_at
		 FROM audit_logs
		 ORDER BY created_at DESC
		 LIMIT 100`)
	if err != nil {
		response.Error(w, r, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch audit logs")
		return
	}
	defer rows.Close()

	type LogEntry struct {
		ID           string    `json:"id"`
		UserID       string    `json:"userId"`
		Action       string    `json:"action"`
		ResourceType string    `json:"resourceType"`
		CreatedAt    time.Time `json:"createdAt"`
	}

	var logs []LogEntry
	for rows.Next() {
		var entry LogEntry
		if err := rows.Scan(&entry.ID, &entry.UserID, &entry.Action, &entry.ResourceType, &entry.CreatedAt); err != nil {
			continue
		}
		logs = append(logs, entry)
	}

	response.JSON(w, r, http.StatusOK, map[string]interface{}{"logs": logs})
}

// checkDownstreamServices probes each downstream service's /health endpoint.
func (h *SystemHandler) checkDownstreamServices(ctx context.Context) []map[string]interface{} {
	type serviceCheck struct {
		name string
		url  string
	}

	checks := []serviceCheck{
		{"API Gateway", "http://localhost:" + "8080" + "/health"},
		{"AI Service", h.cfg.AIServiceURL + "/health"},
		{"Execution Service", h.cfg.ExecutionServiceURL + "/health"},
		{"Java Service", h.cfg.JavaServiceURL + "/health"},
		{"IoT Service", h.cfg.IoTServiceURL + "/health"},
	}

	client := &http.Client{Timeout: 2 * time.Second}
	var results []map[string]interface{}

	for _, svc := range checks {
		status := "online"
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, svc.url, nil)
		if err != nil {
			status = "offline"
		} else {
			resp, err := client.Do(req)
			if err != nil || resp.StatusCode >= 500 {
				status = "offline"
			}
			if resp != nil {
				resp.Body.Close()
			}
		}

		results = append(results, map[string]interface{}{
			"name":   svc.name,
			"status": status,
			"url":    svc.url,
		})
	}

	return results
}
