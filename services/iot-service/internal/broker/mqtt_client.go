package broker

import (
	"encoding/json"
	"fmt"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"go.uber.org/zap"

	"polycore/iot-service/internal/store"
)

// NewMQTTClient connects to the broker and subscribes to device topics.
func NewMQTTClient(brokerURL, clientID string, deviceStore *store.DeviceStore, logger *zap.Logger) (mqtt.Client, error) {
	opts := mqtt.NewClientOptions().
		AddBroker(brokerURL).
		SetClientID(clientID).
		SetKeepAlive(30 * time.Second).
		SetPingTimeout(10 * time.Second).
		SetAutoReconnect(true).
		SetConnectRetry(true).
		SetConnectRetryInterval(5 * time.Second).
		SetConnectionLostHandler(func(c mqtt.Client, err error) {
			logger.Warn("MQTT connection lost", zap.Error(err))
		}).
		SetOnConnectHandler(func(c mqtt.Client) {
			logger.Info("MQTT connected, subscribing to device topics")
			// Subscribe to all device telemetry
			token := c.Subscribe("polycore/devices/+/telemetry", 0, makeTelemetryHandler(deviceStore, logger))
			token.Wait()
			if err := token.Error(); err != nil {
				logger.Error("MQTT subscription failed", zap.Error(err))
			}
		})

	client := mqtt.NewClient(opts)
	token := client.Connect()
	token.WaitTimeout(10 * time.Second)
	if err := token.Error(); err != nil {
		return nil, fmt.Errorf("connecting to MQTT broker: %w", err)
	}

	return client, nil
}

// makeTelemetryHandler returns an MQTT message handler for device telemetry.
func makeTelemetryHandler(deviceStore *store.DeviceStore, logger *zap.Logger) mqtt.MessageHandler {
	return func(c mqtt.Client, msg mqtt.Message) {
		// Topic: polycore/devices/{deviceId}/telemetry
		topic := msg.Topic()
		parts := splitTopic(topic)
		if len(parts) != 4 {
			return
		}
		deviceID := parts[2]

		var metrics map[string]interface{}
		if err := json.Unmarshal(msg.Payload(), &metrics); err != nil {
			logger.Warn("Failed to parse telemetry payload", zap.String("deviceId", deviceID), zap.Error(err))
			return
		}

		pt := store.TelemetryPoint{
			DeviceID:  deviceID,
			Timestamp: time.Now().UTC(),
			Metrics:   metrics,
		}
		deviceStore.RecordTelemetry(pt)
	}
}

// splitTopic splits an MQTT topic string by '/'.
func splitTopic(topic string) []string {
	var parts []string
	start := 0
	for i := 0; i <= len(topic); i++ {
		if i == len(topic) || topic[i] == '/' {
			parts = append(parts, topic[start:i])
			start = i + 1
		}
	}
	return parts
}
