/*
 * PolyCore Nexus — ESP32 Firmware
 * Publishes sensor telemetry via MQTT to the PolyCore IoT Service.
 *
 * Dependencies (install via PlatformIO):
 *   - PubSubClient (knolleary)
 *   - ArduinoJson (bblanchon)
 *   - DHT sensor library (Adafruit) — optional
 *
 * Compile: pio run -e esp32dev
 * Upload:  pio run -e esp32dev --target upload
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#include "config.h"

// ─── State ──────────────────────────────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastTelemetryMs = 0;
unsigned long uptimeSecs      = 0;
bool          wifiConnected   = false;

// ─── WiFi ────────────────────────────────────────────────────────────────────
void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("\n[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts++ < 30) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    wifiConnected = true;
  } else {
    Serial.println("\n[WiFi] Failed — will retry");
  }
}

// ─── MQTT ────────────────────────────────────────────────────────────────────
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.printf("[MQTT] Command on %s: %s\n", topic, msg.c_str());

  // Parse JSON command
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, msg) == DeserializationError::Ok) {
    const char* action = doc["action"];
    if (action && strcmp(action, "reboot") == 0) {
      Serial.println("[MQTT] Reboot command received — rebooting in 1s");
      delay(1000);
      ESP.restart();
    } else if (action && strcmp(action, "blink") == 0) {
      for (int i = 0; i < 5; i++) {
        digitalWrite(LED_STATUS_PIN, HIGH); delay(200);
        digitalWrite(LED_STATUS_PIN, LOW);  delay(200);
      }
    }
  }
}

void connectMqtt() {
  if (mqttClient.connected()) return;
  Serial.printf("[MQTT] Connecting to %s:%d...\n", MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  mqttClient.setCallback(onMqttMessage);

  if (mqttClient.connect(MQTT_CLIENT_ID)) {
    Serial.println("[MQTT] Connected");
    mqttClient.subscribe(MQTT_TOPIC_COMMANDS);

    // Announce device online
    StaticJsonDocument<128> status;
    status["status"]           = "online";
    status["device_id"]        = DEVICE_ID;
    status["firmware_version"] = FIRMWARE_VERSION;
    status["hardware_model"]   = HARDWARE_MODEL;
    char buf[128];
    serializeJson(status, buf);
    mqttClient.publish(MQTT_TOPIC_STATUS, buf, true); // retained
  } else {
    Serial.printf("[MQTT] Failed (rc=%d) — will retry\n", mqttClient.state());
  }
}

// ─── Telemetry ───────────────────────────────────────────────────────────────
void publishTelemetry() {
  // Read simulated / real sensor values
  float temperature = 22.5f + (float)(random(-30, 30)) / 10.0f;
  float humidity    = 55.0f + (float)(random(-100, 100)) / 10.0f;
  float pressure    = 1013.25f + (float)(random(-20, 20)) / 10.0f;
  uint32_t freeHeap = ESP.getFreeHeap();
  float cpuFreqMHz  = (float)getCpuFrequencyMhz();
  int wifiRssi      = WiFi.RSSI();

  uptimeSecs = millis() / 1000;

  StaticJsonDocument<512> doc;
  doc["device_id"]        = DEVICE_ID;
  doc["temperature_c"]    = temperature;
  doc["humidity_pct"]     = humidity;
  doc["pressure_hpa"]     = pressure;
  doc["free_heap_bytes"]  = freeHeap;
  doc["cpu_freq_mhz"]     = cpuFreqMHz;
  doc["wifi_rssi_dbm"]    = wifiRssi;
  doc["uptime_secs"]      = uptimeSecs;
  doc["firmware_version"] = FIRMWARE_VERSION;

  char payload[512];
  serializeJson(doc, payload);

  if (mqttClient.publish(MQTT_TOPIC_TELEMETRY, payload)) {
    Serial.printf("[TELEM] Published: temp=%.1f°C hum=%.1f%% heap=%u\n",
                  temperature, humidity, freeHeap);
  } else {
    Serial.println("[TELEM] Publish failed");
  }
}

// ─── Arduino lifecycle ───────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n\n=== PolyCore Nexus ESP32 Firmware ===");
  Serial.printf("Device ID: %s  FW: %s\n\n", DEVICE_ID, FIRMWARE_VERSION);

  pinMode(LED_STATUS_PIN, OUTPUT);
  digitalWrite(LED_STATUS_PIN, LOW);

  // Blink to signal boot
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_STATUS_PIN, HIGH); delay(150);
    digitalWrite(LED_STATUS_PIN, LOW);  delay(150);
  }

  connectWifi();
  if (wifiConnected) {
    connectMqtt();
    digitalWrite(LED_STATUS_PIN, HIGH); // Solid on = connected
  }
}

void loop() {
  // Maintain connections
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    digitalWrite(LED_STATUS_PIN, LOW);
    connectWifi();
  }

  if (wifiConnected && !mqttClient.connected()) {
    connectMqtt();
  }

  if (mqttClient.connected()) {
    mqttClient.loop();

    unsigned long now = millis();
    if (now - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
      lastTelemetryMs = now;
      publishTelemetry();
    }
  }
}
