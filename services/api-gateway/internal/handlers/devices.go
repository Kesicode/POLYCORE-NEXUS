package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"polycore/api-gateway/internal/config"
	"polycore/api-gateway/internal/response"
)

// DeviceHandler handles IoT device HTTP requests by proxying to the IoT service.
type DeviceHandler struct {
	cfg    *config.Config
	client *http.Client
	logger *zap.Logger
}

// NewDeviceHandler creates a new DeviceHandler.
func NewDeviceHandler(cfg *config.Config, logger *zap.Logger) *DeviceHandler {
	return &DeviceHandler{
		cfg:    cfg,
		client: &http.Client{Timeout: 5 * time.Second},
		logger: logger,
	}
}

func (h *DeviceHandler) List(w http.ResponseWriter, r *http.Request) {
	url := fmt.Sprintf("%s/api/v1/devices", h.cfg.IoTServiceURL)
	resp, err := h.client.Get(url)
	if err != nil {
		h.logger.Warn("Failed to proxy to IoT service", zap.Error(err))
		response.JSON(w, r, http.StatusOK, map[string]interface{}{"devices": []interface{}{}, "total": 0})
		return
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		response.JSON(w, r, http.StatusOK, map[string]interface{}{"devices": []interface{}{}, "total": 0})
		return
	}
	response.JSON(w, r, http.StatusOK, data)
}

func (h *DeviceHandler) Register(w http.ResponseWriter, r *http.Request) {
	url := fmt.Sprintf("%s/api/v1/devices", h.cfg.IoTServiceURL)
	resp, err := h.client.Post(url, "application/json", r.Body)
	if err != nil {
		response.Error(w, r, http.StatusBadGateway, "IOT_UNAVAILABLE", "IoT service unavailable")
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func (h *DeviceHandler) Get(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "deviceId")
	url := fmt.Sprintf("%s/api/v1/devices/%s", h.cfg.IoTServiceURL, deviceID)
	resp, err := h.client.Get(url)
	if err != nil {
		response.Error(w, r, http.StatusBadGateway, "IOT_UNAVAILABLE", "IoT service unavailable")
		return
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		response.Error(w, r, http.StatusNotFound, "DEVICE_NOT_FOUND", "Device not found")
		return
	}
	response.JSON(w, r, resp.StatusCode, data)
}

func (h *DeviceHandler) GetTelemetry(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "deviceId")
	url := fmt.Sprintf("%s/api/v1/devices/%s/telemetry", h.cfg.IoTServiceURL, deviceID)
	resp, err := h.client.Get(url)
	if err != nil {
		response.JSON(w, r, http.StatusOK, map[string]interface{}{"telemetry": []interface{}{}})
		return
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		response.JSON(w, r, http.StatusOK, map[string]interface{}{"telemetry": []interface{}{}})
		return
	}
	response.JSON(w, r, http.StatusOK, data)
}

func (h *DeviceHandler) SendCommand(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "deviceId")
	url := fmt.Sprintf("%s/api/v1/devices/%s/commands", h.cfg.IoTServiceURL, deviceID)
	resp, err := h.client.Post(url, "application/json", r.Body)
	if err != nil {
		response.Error(w, r, http.StatusBadGateway, "IOT_UNAVAILABLE", "IoT service unavailable")
		return
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&data)
	response.JSON(w, r, resp.StatusCode, data)
}
