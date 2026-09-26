package simulator

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"go.uber.org/zap"

	"polycore/iot-service/internal/store"
)

// Simulator generates fake sensor data and publishes it via MQTT.
type Simulator struct {
	mqttClient  mqtt.Client
	deviceStore *store.DeviceStore
	logger      *zap.Logger
}

// New creates a new Simulator.
func New(mqttClient mqtt.Client, deviceStore *store.DeviceStore, logger *zap.Logger) *Simulator {
	return &Simulator{mqttClient: mqttClient, deviceStore: deviceStore, logger: logger}
}

var simulatedDevices = []struct {
	id    string
	name  string
	model string
}{
	{"sim-esp32-001", "PolyCore ESP32 Alpha", "ESP32-WROOM-32"},
	{"sim-esp32-002", "PolyCore ESP32 Beta", "ESP32-S3"},
	{"sim-rpi-001", "PolyCore Raspberry Pi", "Raspberry Pi 4 Model B"},
}

// Run starts the simulation loop and registers devices with the store.
func (s *Simulator) Run(ctx context.Context) {
	// Register simulated devices
	for _, d := range simulatedDevices {
		now := time.Now()
		s.deviceStore.UpsertDevice(&store.Device{
			ID:              d.id,
			DeviceID:        d.id,
			Name:            d.name,
			DeviceType:      "microcontroller",
			HardwareModel:   d.model,
			FirmwareVersion: "1.0.0-sim",
			Status:          store.StatusOnline,
			LastSeenAt:      &now,
			IsSimulator:     true,
			CreatedAt:       now,
		})
	}
	s.logger.Info("Registered simulated devices", zap.Int("count", len(simulatedDevices)))

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	var tick int64
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			tick++
			for _, d := range simulatedDevices {
				s.publishTelemetry(d.id, tick)
			}
		}
	}
}

// publishTelemetry sends a fake telemetry payload for one device.
func (s *Simulator) publishTelemetry(deviceID string, tick int64) {
	// Simulate realistic sensor data with sinusoidal patterns + noise
	payload := map[string]interface{}{
		"temperature_c":    22.0 + 3.0*math.Sin(float64(tick)*0.1) + rand.Float64()*0.5,
		"humidity_pct":     55.0 + 10.0*math.Cos(float64(tick)*0.07) + rand.Float64()*1.0,
		"pressure_hpa":     1013.25 + rand.Float64()*2.0 - 1.0,
		"cpu_usage_pct":    math.Abs(30.0+20.0*math.Sin(float64(tick)*0.15)+rand.Float64()*5.0),
		"memory_usage_pct": math.Abs(45.0 + 15.0*math.Sin(float64(tick)*0.05) + rand.Float64()*3.0),
		"wifi_rssi_dbm":    -65.0 - rand.Float64()*15.0,
		"uptime_secs":      tick * 3,
		"tick":             tick,
		"device_id":        deviceID,
	}

	data, _ := json.Marshal(payload)
	topic := fmt.Sprintf("polycore/devices/%s/telemetry", deviceID)

	token := s.mqttClient.Publish(topic, 0, false, data)
	token.WaitTimeout(2 * time.Second)
}
