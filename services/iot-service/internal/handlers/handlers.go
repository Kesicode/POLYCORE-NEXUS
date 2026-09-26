package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"go.uber.org/zap"

	"polycore/iot-service/internal/store"
)

// Handler holds IoT HTTP handlers.
type Handler struct {
	store      *store.DeviceStore
	mqttClient mqtt.Client
	logger     *zap.Logger
}

// New creates a new Handler.
func New(s *store.DeviceStore, mqttClient mqtt.Client, logger *zap.Logger) *Handler {
	return &Handler{store: s, mqttClient: mqttClient, logger: logger}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "ok",
		"service":   "iot-service",
		"timestamp": time.Now().UTC(),
	})
}

func (h *Handler) Ready(w http.ResponseWriter, r *http.Request) {
	mqttOK := h.mqttClient != nil && h.mqttClient.IsConnected()
	if !mqttOK {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "degraded", "reason": "mqtt_disconnected"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func (h *Handler) ListDevices(w http.ResponseWriter, r *http.Request) {
	devices := h.store.ListDevices()
	writeJSON(w, http.StatusOK, map[string]interface{}{"devices": devices, "total": len(devices)})
}

func (h *Handler) RegisterDevice(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DeviceID        string `json:"deviceId"`
		Name            string `json:"name"`
		DeviceType      string `json:"deviceType"`
		HardwareModel   string `json:"hardwareModel"`
		FirmwareVersion string `json:"firmwareVersion"`
		Location        string `json:"location"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
		return
	}
	if req.DeviceID == "" || req.Name == "" {
		writeError(w, http.StatusBadRequest, "MISSING_FIELDS", "deviceId and name are required")
		return
	}

	now := time.Now().UTC()
	device := &store.Device{
		ID:              req.DeviceID,
		DeviceID:        req.DeviceID,
		Name:            req.Name,
		DeviceType:      req.DeviceType,
		HardwareModel:   req.HardwareModel,
		FirmwareVersion: req.FirmwareVersion,
		Status:          store.StatusOffline,
		Location:        req.Location,
		IsSimulator:     false,
		CreatedAt:       now,
	}
	h.store.UpsertDevice(device)
	h.logger.Info("Device registered", zap.String("deviceId", req.DeviceID))
	writeJSON(w, http.StatusCreated, device)
}

func (h *Handler) GetDevice(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "deviceId")
	device, ok := h.store.GetDevice(id)
	if !ok {
		writeError(w, http.StatusNotFound, "NOT_FOUND", fmt.Sprintf("Device %s not found", id))
		return
	}
	writeJSON(w, http.StatusOK, device)
}

func (h *Handler) DeleteDevice(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "deviceId")
	h.store.RemoveDevice(id)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Device removed"})
}

func (h *Handler) GetTelemetry(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "deviceId")
	limit := 100
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 500 {
			limit = n
		}
	}
	pts := h.store.GetTelemetry(id, limit)
	writeJSON(w, http.StatusOK, map[string]interface{}{"deviceId": id, "telemetry": pts, "count": len(pts)})
}

func (h *Handler) SendCommand(w http.ResponseWriter, r *http.Request) {
	if h.mqttClient == nil || !h.mqttClient.IsConnected() {
		writeError(w, http.StatusServiceUnavailable, "MQTT_UNAVAILABLE", "MQTT broker not connected")
		return
	}
	id := chi.URLParam(r, "deviceId")

	var cmd map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid command body")
		return
	}
	cmd["timestamp"] = time.Now().UTC()
	cmd["device_id"] = id

	data, _ := json.Marshal(cmd)
	topic := fmt.Sprintf("polycore/devices/%s/commands", id)
	h.mqttClient.Publish(topic, 1, false, data)

	h.logger.Info("Command sent", zap.String("deviceId", id), zap.String("topic", topic))
	writeJSON(w, http.StatusAccepted, map[string]string{"status": "sent", "topic": topic})
}

// TelemetryStream streams real-time telemetry via Server-Sent Events.
func (h *Handler) TelemetryStream(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "SSE_UNSUPPORTED", "SSE not supported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	ch := h.store.Subscribe()
	defer h.store.Unsubscribe(ch)

	for {
		select {
		case <-r.Context().Done():
			return
		case pt, ok := <-ch:
			if !ok {
				return
			}
			data, _ := json.Marshal(pt)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

// writeJSON writes a JSON response.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeError writes a JSON error response.
func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]interface{}{
		"success": false,
		"error":   map[string]string{"code": code, "message": message},
	})
}
