package middleware

import (
	"net/http"

	"github.com/google/uuid"
)

// RequestID injects a unique X-Request-ID header into every request and response.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = uuid.New().String()
			r.Header.Set("X-Request-ID", id)
		}
		w.Header().Set("X-Request-ID", id)
		next.ServeHTTP(w, r)
	})
}

// GetRequestID returns the X-Request-ID header from the request.
func GetRequestID(r *http.Request) string {
	return r.Header.Get("X-Request-ID")
}
