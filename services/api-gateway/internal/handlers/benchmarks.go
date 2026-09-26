package handlers

import (
	"net/http"
	"time"

	"go.uber.org/zap"

	"polycore/api-gateway/internal/response"
	"polycore/api-gateway/internal/services"
)

// BenchmarkHandler handles benchmark HTTP requests.
type BenchmarkHandler struct {
	benchmarkSvc *services.BenchmarkService
	logger       *zap.Logger
}

// NewBenchmarkHandler creates a new BenchmarkHandler.
func NewBenchmarkHandler(benchmarkSvc *services.BenchmarkService, logger *zap.Logger) *BenchmarkHandler {
	return &BenchmarkHandler{benchmarkSvc: benchmarkSvc, logger: logger}
}

func (h *BenchmarkHandler) ListAlgorithms(w http.ResponseWriter, r *http.Request) {
	algorithms, err := h.benchmarkSvc.ListAlgorithms(r.Context())
	if err != nil {
		h.logger.Error("Failed to list algorithms", zap.Error(err))
		response.Error(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch algorithms")
		return
	}
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"algorithms": algorithms})
}

func (h *BenchmarkHandler) RunBenchmark(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusAccepted, map[string]interface{}{
		"message": "Benchmark queued",
		"note":    "Full benchmark execution requires the execution service to be running",
	})
}

func (h *BenchmarkHandler) GetRun(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"status": "pending"})
}

func (h *BenchmarkHandler) GetResults(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"results": []interface{}{}})
}

func (h *BenchmarkHandler) ListRuns(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"runs": []interface{}{}})
}
