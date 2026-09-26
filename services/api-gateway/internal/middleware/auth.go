package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"

	"polycore/api-gateway/internal/response"
)

type userIDKey struct{}
type userRoleKey struct{}

// Authenticate validates the JWT Bearer token and injects claims into context.
func Authenticate(jwtSecret []byte, logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				response.Error(w, r, http.StatusUnauthorized, "MISSING_TOKEN", "Authorization header required")
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return jwtSecret, nil
			})

			if err != nil || !token.Valid {
				response.Error(w, r, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired token")
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				response.Error(w, r, http.StatusUnauthorized, "INVALID_TOKEN", "Malformed token claims")
				return
			}

			userID, _ := claims["sub"].(string)
			role, _ := claims["role"].(string)

			ctx := context.WithValue(r.Context(), userIDKey{}, userID)
			ctx = context.WithValue(ctx, userRoleKey{}, role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole returns middleware that restricts access to specified roles.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(userRoleKey{}).(string)
			for _, allowed := range roles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}
			response.Error(w, r, http.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
		})
	}
}

// GetUserID extracts the user ID from context.
func GetUserID(r *http.Request) (string, bool) {
	id, ok := r.Context().Value(userIDKey{}).(string)
	return id, ok
}

// GetUserRole extracts the user role from context.
func GetUserRole(r *http.Request) string {
	role, _ := r.Context().Value(userRoleKey{}).(string)
	return role
}
