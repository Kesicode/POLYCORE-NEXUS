package store

import (
	"sync"
	"time"
)

// DeviceStatus represents device connectivity state.
type DeviceStatus string

const (
	StatusOnline      DeviceStatus = "online"
	StatusOffline     DeviceStatus = "offline"
	StatusError       DeviceStatus = "error"
	StatusMaintenance DeviceStatus = "maintenance"
)

// Device holds device metadata.
type Device struct {
	ID              string                 `json:"id"`
	DeviceID        string                 `json:"deviceId"`
	Name            string                 `json:"name"`
	DeviceType      string                 `json:"deviceType"`
	HardwareModel   string                 `json:"hardwareModel,omitempty"`
	FirmwareVersion string                 `json:"firmwareVersion,omitempty"`
	Status          DeviceStatus           `json:"status"`
	LastSeenAt      *time.Time             `json:"lastSeenAt,omitempty"`
	Location        string                 `json:"location,omitempty"`
	IsSimulator     bool                   `json:"isSimulator"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt       time.Time              `json:"createdAt"`
}

// TelemetryPoint is a single telemetry measurement.
type TelemetryPoint struct {
	DeviceID  string                 `json:"deviceId"`
	Timestamp time.Time              `json:"timestamp"`
	Metrics   map[string]interface{} `json:"metrics"`
}

// DeviceStore is an in-memory store for device state and telemetry.
type DeviceStore struct {
	mu        sync.RWMutex
	devices   map[string]*Device
	telemetry map[string][]TelemetryPoint // deviceID → last N points
	maxPoints int
	// SSE subscribers
	subsMu      sync.Mutex
	subscribers map[chan TelemetryPoint]struct{}
}

// NewDeviceStore creates a new DeviceStore.
func NewDeviceStore() *DeviceStore {
	return &DeviceStore{
		devices:     make(map[string]*Device),
		telemetry:   make(map[string][]TelemetryPoint),
		maxPoints:   500,
		subscribers: make(map[chan TelemetryPoint]struct{}),
	}
}

// UpsertDevice adds or updates a device.
func (s *DeviceStore) UpsertDevice(d *Device) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.devices[d.DeviceID] = d
}

// GetDevice retrieves a device by its deviceId field.
func (s *DeviceStore) GetDevice(deviceID string) (*Device, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	d, ok := s.devices[deviceID]
	return d, ok
}

// ListDevices returns all devices.
func (s *DeviceStore) ListDevices() []*Device {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*Device, 0, len(s.devices))
	for _, d := range s.devices {
		out = append(out, d)
	}
	return out
}

// RemoveDevice deletes a device.
func (s *DeviceStore) RemoveDevice(deviceID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.devices, deviceID)
}

// RecordTelemetry appends a telemetry point and notifies SSE subscribers.
func (s *DeviceStore) RecordTelemetry(pt TelemetryPoint) {
	s.mu.Lock()
	pts := s.telemetry[pt.DeviceID]
	pts = append(pts, pt)
	if len(pts) > s.maxPoints {
		pts = pts[len(pts)-s.maxPoints:]
	}
	s.telemetry[pt.DeviceID] = pts

	// Mark device as online with last-seen time
	if d, ok := s.devices[pt.DeviceID]; ok {
		now := pt.Timestamp
		d.Status = StatusOnline
		d.LastSeenAt = &now
	}
	s.mu.Unlock()

	// Notify SSE subscribers
	s.subsMu.Lock()
	for ch := range s.subscribers {
		select {
		case ch <- pt:
		default:
		}
	}
	s.subsMu.Unlock()
}

// GetTelemetry returns the last n points for a device.
func (s *DeviceStore) GetTelemetry(deviceID string, limit int) []TelemetryPoint {
	s.mu.RLock()
	defer s.mu.RUnlock()
	pts := s.telemetry[deviceID]
	if len(pts) <= limit {
		return pts
	}
	return pts[len(pts)-limit:]
}

// Subscribe returns a channel that receives all new telemetry points.
func (s *DeviceStore) Subscribe() chan TelemetryPoint {
	ch := make(chan TelemetryPoint, 64)
	s.subsMu.Lock()
	s.subscribers[ch] = struct{}{}
	s.subsMu.Unlock()
	return ch
}

// Unsubscribe removes a subscriber channel.
func (s *DeviceStore) Unsubscribe(ch chan TelemetryPoint) {
	s.subsMu.Lock()
	delete(s.subscribers, ch)
	s.subsMu.Unlock()
	close(ch)
}
