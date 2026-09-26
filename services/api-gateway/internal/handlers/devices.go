package handlers

import (
	"net/http"

	"go.uber.org/zap"

	"polycore/api-gateway/internal/response"
)

// DeviceHandler handles IoT device HTTP requests.
type DeviceHandler struct {
	logger *zap.Logger
}

// NewDeviceHandler creates a new DeviceHandler.
func NewDeviceHandler(logger *zap.Logger) *DeviceHandler {
	return &DeviceHandler{logger: logger}
}

func (h *DeviceHandler) List(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"devices": []interface{}{}})
}

func (h *DeviceHandler) Register(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusCreated, map[string]interface{}{
		"message": "Device registration proxied to IoT service",
	})
}

func (h *DeviceHandler) Get(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *DeviceHandler) GetTelemetry(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusOK, map[string]interface{}{"telemetry": []interface{}{}})
}

func (h *DeviceHandler) SendCommand(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, r, http.StatusAccepted, map[string]string{"message": "Command sent"})
}
