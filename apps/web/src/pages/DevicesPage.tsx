import { useState, useEffect } from 'react'
import { Cpu, Wifi, WifiOff, Activity, Plus } from 'lucide-react'
import { apiClient, unwrap } from '@/api/client'
import type { Device } from '@/types'
import toast from 'react-hot-toast'

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/devices').then((res) => {
      const data = unwrap<{ devices: Device[] }>(res)
      setDevices(data.devices || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statusColor: Record<string, string> = {
    online: 'text-status-online', offline: 'text-status-offline',
    error: 'text-status-error', maintenance: 'text-status-warning',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" /> IoT Devices
          </h1>
          <p className="text-text-secondary mt-1">
            Real-time device monitoring via MQTT — ESP32, Raspberry Pi, and simulators
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => toast('Device registration coming soon')}>
          <Plus className="w-4 h-4" /> Register Device
        </button>
      </div>

      {/* MQTT info */}
      <div className="card p-4 flex items-start gap-3 border-primary/30 bg-primary/5">
        <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-text-primary">MQTT Broker Active</div>
          <div className="text-xs text-text-muted mt-0.5">
            Connect devices to <code className="font-mono">mqtt://localhost:1883</code> · WebSocket on port 9001 ·
            Topic: <code className="font-mono">polycore/devices/{'{'}deviceId{'}'}/telemetry</code>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-muted">Loading devices…</div>
      ) : devices.length === 0 ? (
        <div className="card p-12 text-center">
          <Cpu className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No devices yet</h3>
          <p className="text-text-secondary mb-4 max-w-md mx-auto text-sm">
            Connect your ESP32 or Raspberry Pi, or start the built-in device simulator
            with <code className="font-mono text-primary">docker compose up iot-service</code>
          </p>
          <div className="card p-4 text-left text-xs font-mono text-text-muted max-w-sm mx-auto">
            <div className="text-text-secondary mb-1"># Start device simulator</div>
            <div>docker compose up iot-service</div>
            <div className="text-text-secondary mt-2 mb-1"># Or run standalone</div>
            <div>cd services/iot-service && go run .</div>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div key={device.id} className="card p-5 hover:border-border-light transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-panel-hover flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${statusColor[device.status] || 'text-text-muted'}`}>
                  {device.status === 'online' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {device.status}
                </div>
              </div>
              <h3 className="font-semibold text-text-primary mb-1">{device.name}</h3>
              <div className="text-xs text-text-muted space-y-0.5">
                <div>ID: <span className="font-mono">{device.deviceId}</span></div>
                <div>Type: {device.deviceType}</div>
                {device.hardwareModel && <div>Model: {device.hardwareModel}</div>}
                {device.firmwareVersion && <div>Firmware: {device.firmwareVersion}</div>}
                {device.lastSeenAt && <div>Last seen: {new Date(device.lastSeenAt).toLocaleString()}</div>}
              </div>
              {device.isSimulator && <span className="badge-warning text-xs mt-2 inline-block">Simulator</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
