package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"polycore/api-gateway/internal/middleware"
	"polycore/api-gateway/internal/response"
	"polycore/api-gateway/internal/services"
)

// ProjectHandler handles project CRUD HTTP requests.
type ProjectHandler struct {
	projectSvc *services.ProjectService
	logger     *zap.Logger
}

// NewProjectHandler creates a new ProjectHandler.
func NewProjectHandler(projectSvc *services.ProjectService, logger *zap.Logger) *ProjectHandler {
	return &ProjectHandler{projectSvc: projectSvc, logger: logger}
}

func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	projects, err := h.projectSvc.List(r.Context(), userID)
	if err != nil {
		h.logger.Error("Failed to list projects", zap.Error(err))
		response.Error(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch projects")
		return
	}
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"projects": projects, "total": len(projects)})
}

func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		IsPublic    bool   `json:"isPublic"`
		Template    string `json:"template"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.Name == "" {
		response.Error(w, r, http.StatusBadRequest, "MISSING_NAME", "Project name is required")
		return
	}
	proj, err := h.projectSvc.Create(r.Context(), userID, req.Name, req.Description, req.IsPublic)
	if err != nil {
		response.Error(w, r, http.StatusInternalServerError, "CREATE_FAILED", "Failed to create project")
		return
	}
	response.JSON(w, r, http.StatusCreated, proj)
}

func (h *ProjectHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	id := chi.URLParam(r, "projectId")
	proj, err := h.projectSvc.Get(r.Context(), id, userID)
	if err != nil {
		response.Error(w, r, http.StatusNotFound, "NOT_FOUND", "Project not found")
		return
	}
	response.JSON(w, r, http.StatusOK, proj)
}

func (h *ProjectHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	id := chi.URLParam(r, "projectId")
	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	proj, err := h.projectSvc.Update(r.Context(), id, userID, req)
	if err != nil {
		response.Error(w, r, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update project")
		return
	}
	response.JSON(w, r, http.StatusOK, proj)
}

func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	id := chi.URLParam(r, "projectId")
	if err := h.projectSvc.Delete(r.Context(), id, userID); err != nil {
		response.Error(w, r, http.StatusInternalServerError, "DELETE_FAILED", "Failed to delete project")
		return
	}
	response.JSON(w, r, http.StatusOK, map[string]string{"message": "Project deleted"})
}

func (h *ProjectHandler) ListFiles(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "projectId")
	files, err := h.projectSvc.ListFiles(r.Context(), id)
	if err != nil {
		response.Error(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch files")
		return
	}
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"files": files})
}

func (h *ProjectHandler) CreateFile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "projectId")
	var req struct {
		Path    string `json:"path"`
		Name    string `json:"name"`
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	file, err := h.projectSvc.CreateFile(r.Context(), id, req.Path, req.Name, req.Content)
	if err != nil {
		response.Error(w, r, http.StatusInternalServerError, "CREATE_FAILED", "Failed to create file")
		return
	}
	response.JSON(w, r, http.StatusCreated, file)
}

func (h *ProjectHandler) UpdateFile(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	fileID := chi.URLParam(r, "fileId")
	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	file, err := h.projectSvc.UpdateFile(r.Context(), projectID, fileID, req.Content)
	if err != nil {
		response.Error(w, r, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update file")
		return
	}
	response.JSON(w, r, http.StatusOK, file)
}
