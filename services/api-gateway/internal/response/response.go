package response

import (
	"encoding/json"
	"net/http"
)

// APIResponse is the standard envelope for all API responses.
type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data"`
	Error     *APIError   `json:"error"`
	RequestID string      `json:"requestId"`
}

// APIError is the standard error object.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// JSON writes a successful JSON response.
func JSON(w http.ResponseWriter, r *http.Request, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(APIResponse{
		Success:   true,
		Data:      data,
		Error:     nil,
		RequestID: r.Header.Get("X-Request-ID"),
	})
}

// Error writes a JSON error response.
func Error(w http.ResponseWriter, r *http.Request, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Data:    nil,
		Error:   &APIError{Code: code, Message: message},
		RequestID: r.Header.Get("X-Request-ID"),
	})
}
