package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"polycore/api-gateway/internal/middleware"
	"polycore/api-gateway/internal/response"
	"polycore/api-gateway/internal/services"
)

// ExecutionHandler handles code execution HTTP requests.
type ExecutionHandler struct {
	executionSvc *services.ExecutionService
	logger       *zap.Logger
}

// NewExecutionHandler creates a new ExecutionHandler.
func NewExecutionHandler(executionSvc *services.ExecutionService, logger *zap.Logger) *ExecutionHandler {
	return &ExecutionHandler{executionSvc: executionSvc, logger: logger}
}

// Create handles POST /api/v1/executions
func (h *ExecutionHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	var req services.CreateExecutionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}

	if req.Language == "" {
		response.Error(w, r, http.StatusBadRequest, "MISSING_LANGUAGE", "Language is required")
		return
	}
	if req.SourceCode == "" {
		response.Error(w, r, http.StatusBadRequest, "MISSING_CODE", "Source code is required")
		return
	}
	if len(req.SourceCode) > 1024*1024 { // 1MB max code size
		response.Error(w, r, http.StatusBadRequest, "CODE_TOO_LARGE", "Source code must be less than 1MB")
		return
	}

	exec, err := h.executionSvc.Create(r.Context(), userID, req)
	if err != nil {
		h.logger.Error("Failed to create execution",
			zap.Error(err),
			zap.String("language", req.Language),
			zap.String("userId", userID),
		)
		if err.Error() == "unsupported language: "+req.Language {
			response.Error(w, r, http.StatusBadRequest, "UNSUPPORTED_LANGUAGE", err.Error())
			return
		}
		response.Error(w, r, http.StatusInternalServerError, "EXECUTION_FAILED", "Failed to queue execution")
		return
	}

	h.logger.Info("Execution queued",
		zap.String("executionId", exec.ID),
		zap.String("language", exec.Language),
		zap.String("userId", userID),
	)

	response.JSON(w, r, http.StatusAccepted, exec)
}

// Get handles GET /api/v1/executions/:executionId
func (h *ExecutionHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	executionID := chi.URLParam(r, "executionId")

	exec, err := h.executionSvc.Get(r.Context(), executionID, userID)
	if err != nil {
		response.Error(w, r, http.StatusNotFound, "EXECUTION_NOT_FOUND", "Execution not found")
		return
	}

	response.JSON(w, r, http.StatusOK, exec)
}

// List handles GET /api/v1/executions
func (h *ExecutionHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	executions, err := h.executionSvc.List(r.Context(), userID, 20)
	if err != nil {
		h.logger.Error("Failed to list executions", zap.Error(err))
		response.Error(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch executions")
		return
	}

	response.JSON(w, r, http.StatusOK, map[string]interface{}{
		"executions": executions,
		"total":      len(executions),
	})
}

// Cancel handles DELETE /api/v1/executions/:executionId
func (h *ExecutionHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]string{"message": "Cancellation requested"})
}

// AdminList handles GET /admin/executions
func (h *ExecutionHandler) AdminList(w http.ResponseWriter, r *http.Request) {
	executions, err := h.executionSvc.List(r.Context(), "", 50)
	if err != nil {
		response.Error(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch executions")
		return
	}
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"executions": executions})
}
