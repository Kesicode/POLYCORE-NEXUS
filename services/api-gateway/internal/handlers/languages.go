package handlers

import (
	"net/http"
	"time"

	"go.uber.org/zap"

	"polycore/api-gateway/internal/response"
	"polycore/api-gateway/internal/services"
)

// LanguageHandler handles language registry HTTP requests.
type LanguageHandler struct {
	languageSvc *services.LanguageService
	logger      *zap.Logger
}

// NewLanguageHandler creates a new LanguageHandler.
func NewLanguageHandler(languageSvc *services.LanguageService, logger *zap.Logger) *LanguageHandler {
	return &LanguageHandler{languageSvc: languageSvc, logger: logger}
}

// List handles GET /api/v1/languages
func (h *LanguageHandler) List(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	activeOnly := r.URL.Query().Get("active") != "false"

	languages, err := h.languageSvc.List(r.Context(), category, activeOnly)
	if err != nil {
		h.logger.Error("Failed to list languages", zap.Error(err))
		response.Error(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch languages")
		return
	}

	response.JSON(w, r, http.StatusOK, map[string]interface{}{
		"languages": languages,
		"total":     len(languages),
	})
}

// GetByName handles GET /api/v1/languages/{name}
func (h *LanguageHandler) GetByName(w http.ResponseWriter, r *http.Request) {
	// Extract from URL path
	name := r.PathValue("name")
	if name == "" {
		response.Error(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Language name required")
		return
	}

	lang, err := h.languageSvc.GetByName(r.Context(), name)
	if err != nil {
		response.Error(w, r, http.StatusNotFound, "LANGUAGE_NOT_FOUND", "Language not found: "+name)
		return
	}

	response.JSON(w, r, http.StatusOK, lang)
}

// Language represents a language registry entry.
type Language struct {
	ID                  string            `json:"id"`
	Name                string            `json:"name"`
	DisplayName         string            `json:"displayName"`
	Version             string            `json:"version"`
	Category            string            `json:"category"`
	Runtime             string            `json:"runtime"`
	FileExtensions      []string          `json:"fileExtensions"`
	ExecutionCommand    string            `json:"executionCommand"`
	CompileCommand      string            `json:"compileCommand,omitempty"`
	SupportsCompilation bool              `json:"supportsCompilation"`
	SupportsMetrics     bool              `json:"supportsMetrics"`
	RunnerImage         string            `json:"runnerImage"`
	Color               string            `json:"color"`
	Description         string            `json:"description"`
	IsActive            bool              `json:"isActive"`
	IsExperimental      bool              `json:"isExperimental"`
	Metadata            map[string]string `json:"metadata"`
	CreatedAt           time.Time         `json:"createdAt"`
}
