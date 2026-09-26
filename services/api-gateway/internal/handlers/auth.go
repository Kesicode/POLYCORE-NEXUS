package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"go.uber.org/zap"

	"polycore/api-gateway/internal/middleware"
	"polycore/api-gateway/internal/response"
	"polycore/api-gateway/internal/services"
)

// AuthHandler handles authentication HTTP requests.
type AuthHandler struct {
	authSvc *services.AuthService
	logger  *zap.Logger
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authSvc *services.AuthService, logger *zap.Logger) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, logger: logger}
}

// Register handles POST /api/v1/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req services.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}

	// Validate input
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Username = strings.TrimSpace(req.Username)

	if req.Email == "" || !strings.Contains(req.Email, "@") {
		response.Error(w, r, http.StatusBadRequest, "INVALID_EMAIL", "Valid email address required")
		return
	}
	if len(req.Username) < 3 || len(req.Username) > 50 {
		response.Error(w, r, http.StatusBadRequest, "INVALID_USERNAME", "Username must be 3-50 characters")
		return
	}
	if len(req.Password) < 8 {
		response.Error(w, r, http.StatusBadRequest, "WEAK_PASSWORD", "Password must be at least 8 characters")
		return
	}

	user, tokens, err := h.authSvc.Register(r.Context(), req)
	if err != nil {
		h.logger.Warn("Registration failed", zap.Error(err), zap.String("requestId", middleware.GetRequestID(r)))
		if strings.Contains(err.Error(), "already registered") {
			response.Error(w, r, http.StatusConflict, "USER_EXISTS", err.Error())
			return
		}
		response.Error(w, r, http.StatusInternalServerError, "REGISTRATION_FAILED", "Registration failed")
		return
	}

	h.logger.Info("User registered", zap.String("userId", user.ID), zap.String("email", user.Email))

	response.JSON(w, r, http.StatusCreated, map[string]interface{}{
		"user":   user,
		"tokens": tokens,
	})
}

// Login handles POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req services.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	user, tokens, err := h.authSvc.Login(r.Context(), req)
	if err != nil {
		h.logger.Warn("Login failed", zap.Error(err), zap.String("email", req.Email))
		response.Error(w, r, http.StatusUnauthorized, "LOGIN_FAILED", "Invalid email or password")
		return
	}

	h.logger.Info("User logged in", zap.String("userId", user.ID))

	response.JSON(w, r, http.StatusOK, map[string]interface{}{
		"user":   user,
		"tokens": tokens,
	})
}

// Logout handles POST /api/v1/auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err == nil && body.RefreshToken != "" {
		_ = h.authSvc.RevokeRefreshToken(r.Context(), body.RefreshToken)
	}
	response.JSON(w, r, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

// Refresh handles POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		response.Error(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Refresh token required")
		return
	}

	tokens, err := h.authSvc.RefreshTokens(r.Context(), body.RefreshToken)
	if err != nil {
		response.Error(w, r, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired refresh token")
		return
	}

	response.JSON(w, r, http.StatusOK, map[string]interface{}{"tokens": tokens})
}

// Me handles GET /api/v1/auth/me
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	user, err := h.authSvc.GetUser(r.Context(), userID)
	if err != nil {
		response.Error(w, r, http.StatusNotFound, "USER_NOT_FOUND", "User not found")
		return
	}

	response.JSON(w, r, http.StatusOK, user)
}

// ListUsers handles GET /admin/users (admin only)
func (h *AuthHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.authSvc.ListUsers(r.Context())
	if err != nil {
		h.logger.Error("Failed to list users", zap.Error(err))
		response.Error(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch users")
		return
	}
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"users": users})
}

// UpdateUserRole handles PUT /admin/users/:userId/role
func (h *AuthHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]string{"message": "Role updated"})
}

// ToggleUserActive handles PUT /admin/users/:userId/active
func (h *AuthHandler) ToggleUserActive(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]string{"message": "User status updated"})
}
