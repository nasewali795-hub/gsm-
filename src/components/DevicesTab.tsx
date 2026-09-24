import React, { useState } from 'react';
import {
  Smartphone,
  Plus,
  QrCode,
  Radio,
  Battery,
  BatteryCharging,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Device } from '../types/gateway.ts';
import { api } from '../lib/api.ts';

interface DevicesTabProps {
  devices: Device[];
  onRefresh: () => void;
  onPairDevice: (device: Device) => void;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({ devices, onRefresh, onPairDevice }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [model, setModel] = useState('Samsung Galaxy S23 Dual SIM');
  const [androidVersion, setAndroidVersion] = useState('Android 14 (OneUI 6.1)');
  const [sim1Carrier, setSim1Carrier] = useState('Vodafone');
  const [sim1Number, setSim1Number] = useState('+1 555-019-3321');
  const [sim2Carrier, setSim2Carrier] = useState('T-Mobile');
  const [sim2Number, setSim2Number] = useState('+1 555-019-3322');
  const [isVirtual, setIsVirtual] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createDevice({
        name: name.trim(),
        model,
        androidVersion,
        sim1Carrier,
        sim1Number,
        sim2Carrier,
        sim2Number,
        isVirtual,
      });
      setShowAddModal(false);
      setName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed creating device');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to remove this gateway device?')) return;
    try {
      await api.deleteDevice(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed removing device');
    }
  };

  const handleToggleAutoSimulate = async (device: Device) => {
    try {
      await api.updateDevice(device.id, {
        autoSimulateReplies: !device.autoSimulateReplies,
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const handleToggleOnline = async (device: Device) => {
    try {
      await api.updateDevice(device.id, {
        isOnline: !device.isOnline,
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const copyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-sky-400" />
            Connected GSM Gateway Hardware & SIMs
          </h1>
          <p className="text-xs text-slate-400">
            Manage paired Android smartphones, check dual-SIM statuses, battery health, and radio telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Register New Gateway</span>
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors"
          >
            {/* Header info */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      device.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-600'
                    }`}
                  />
                  <h2 className="text-sm font-bold text-white">{device.name}</h2>
                  {device.isVirtual && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                      Virtual
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {device.model} · {device.androidVersion}
                </div>
              </div>

              {/* Pair QR Button */}
              <button
                onClick={() => onPairDevice(device)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
                title="Scan QR Code in Android Companion App"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Pair QR</span>
              </button>
            </div>

            {/* Hardware Telemetry Bar */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                {device.isCharging ? (
                  <BatteryCharging className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Battery className="h-4 w-4 text-slate-400" />
                )}
                <div>
                  <div className="text-slate-400 text-[10px]">Battery</div>
                  <div className="font-mono font-semibold text-slate-200 tabular-nums">
                    {device.batteryLevel}% {device.isCharging && '(AC)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-sky-400" />
                <div>
                  <div className="text-slate-400 text-[10px]">Radio Signal</div>
                  <div className="font-mono font-semibold text-slate-200 tabular-nums">
                    {device.signalDbm} dBm
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-slate-400 text-[10px]">Network</div>
                  <div className="font-mono font-semibold text-slate-200">{device.networkType}</div>
                </div>
              </div>
            </div>

            {/* SIM Cards Detected */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400">Cellular SIM Subscriptions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {device.simCards.map((sim) => (
                  <div
                    key={sim.slot}
                    className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400">SIM {sim.slot}</span>
                      <span className="font-mono text-[11px] text-emerald-400">{sim.signalPercent}%</span>
                    </div>
                    <div className="font-medium text-slate-200">{sim.carrier}</div>
                    <div className="font-mono text-[11px] text-slate-400 tabular-nums">{sim.phoneNumber}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Token Bar */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <div className="space-y-0.5 truncate">
                <div className="text-[10px] text-slate-400">Device Gateway Auth Token (Bearer)</div>
                <div className="font-mono text-slate-300 truncate">{device.token}</div>
              </div>
              <button
                onClick={() => copyToken(device.token, device.id)}
                className="ml-2 text-slate-400 hover:text-slate-200 shrink-0"
                title="Copy Token"
              >
                {copiedTokenId === device.id ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Controls / Options */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={device.autoSimulateReplies}
                    onChange={() => handleToggleAutoSimulate(device)}
                    className="rounded border-slate-700 bg-slate-950 text-sky-500"
                  />
                  <span>Auto-simulate replies</span>
                </label>

                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={device.isOnline}
                    onChange={() => handleToggleOnline(device)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                  />
                  <span>Online</span>
                </label>
              </div>

              <button
                onClick={() => handleDeleteDevice(device.id)}
                className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                title="Unregister Device"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg border border-slate-800 bg-slate-900 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register Android Gateway Phone</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Gateway Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Galaxy A54 Gateway #2"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Phone Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Android Version</label>
                  <input
                    type="text"
                    value={androidVersion}
                    onChange={(e) => setAndroidVersion(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">SIM 1 Carrier</label>
                  <input
                    type="text"
                    value={sim1Carrier}
                    onChange={(e) => setSim1Carrier(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">SIM 1 Phone Number</label>
                  <input
                    type="text"
                    value={sim1Number}
                    onChange={(e) => setSim1Number(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">SIM 2 Carrier (Optional)</label>
                  <input
                    type="text"
                    value={sim2Carrier}
                    onChange={(e) => setSim2Carrier(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">SIM 2 Phone Number</label>
                  <input
                    type="text"
                    value={sim2Number}
                    onChange={(e) => setSim2Number(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="virtualCheck"
                  checked={isVirtual}
                  onChange={(e) => setIsVirtual(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500"
                />
                <label htmlFor="virtualCheck" className="text-slate-300 cursor-pointer">
                  Create as Virtual Gateway (Instant automated delivery without physical phone)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded bg-sky-500 text-white font-semibold hover:bg-sky-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
