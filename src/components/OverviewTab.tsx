import React from 'react';
import {
  Send,
  Inbox,
  Terminal,
  Smartphone,
  Battery,
  BatteryCharging,
  Radio,
  ExternalLink,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Key,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { Device, SmsMessage, UssdSession, SystemStats } from '../types/gateway.ts';
import { ActiveTab } from './Header.tsx';

interface OverviewTabProps {
  stats: SystemStats | null;
  devices: Device[];
  recentSms: SmsMessage[];
  recentUssd: UssdSession[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickSend: () => void;
  onOpenQuickUssd: () => void;
  onPairDevice: (device: Device) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  devices,
  recentSms,
  recentUssd,
  setActiveTab,
  onOpenQuickSend,
  onOpenQuickUssd,
  onPairDevice,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome / Architecture Bar */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              GSM Gateway Control Center
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Turn your Android smartphones into high-throughput GSM hardware gateways. Dispatch SMS messages, stream inbound carrier texts, and trigger USSD balance / menu codes programmatically through secure REST APIs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('android')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 transition-colors"
            >
              <Smartphone className="h-4 w-4" />
              <span>Android Companion App Source</span>
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Key className="h-4 w-4 text-amber-400" />
              <span>API Explorer & Keys</span>
            </button>
          </div>
        </div>

        {/* System Highlights */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Dual-SIM Subscription Routing</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
            <span>HMAC & Bearer Token Auth</span>
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-purple-400 shrink-0" />
            <span>TelephonyManager USSD Runner</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Persistent Radio Foreground Lock</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Outbound SMS Dispatched</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              {stats?.totalSent ?? 0}
            </span>
            <span className="text-xs text-emerald-400 font-mono tabular-nums">
              {stats?.deliveryRate ?? 100}% delivered
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Routed via physical GSM radio</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Inbound Messages Received</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Inbox className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              {stats?.totalReceived ?? 0}
            </span>
            <span className="text-xs text-slate-400">real-time sync</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Captured via SMS BroadcastReceiver</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">USSD Commands Executed</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Terminal className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              {stats?.totalUssd ?? 0}
            </span>
            <span className="text-xs text-slate-400">sessions</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Balance, airtime & menu dialogs</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Gateway Radios</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Smartphone className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              {stats?.activeDevices ?? 0} / {stats?.totalDevices ?? 0}
            </span>
            <span className="text-xs text-emerald-400">online</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Connected Android hardware units</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Phones & Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hardware Devices Card */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">Connected Android Gateway Hardware</h2>
              </div>
              <button
                onClick={() => setActiveTab('devices')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                Manage All ({devices.length}) →
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {devices.map((device) => (
                <div key={device.id} className="p-4 sm:p-5 hover:bg-slate-800/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${device.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-600'}`} />
                        <span className="text-sm font-semibold text-white">{device.name}</span>
                        {device.isVirtual && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                            Simulator
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                        <span>{device.model}</span>
                        <span aria-hidden="true">·</span>
                        <span>{device.androidVersion}</span>
                        <span aria-hidden="true">·</span>
                        <span>Token: {device.token.slice(0, 10)}...</span>
                      </div>
                    </div>

                    {/* Telemetry badges & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Battery indicator */}
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 font-mono tabular-nums">
                        {device.isCharging ? (
                          <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Battery className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>{device.batteryLevel}%</span>
                      </div>

                      {/* Signal indicator */}
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 font-mono tabular-nums">
                        <Radio className="h-3.5 w-3.5 text-sky-400" />
                        <span>{device.networkType} ({device.signalDbm} dBm)</span>
                      </div>

                      {/* Pair Button */}
                      <button
                        onClick={() => onPairDevice(device)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                        title="View Pairing QR Code for Android App"
                      >
                        <QrCode className="h-3.5 w-3.5 text-sky-400" />
                        <span>Pair</span>
                      </button>
                    </div>
                  </div>

                  {/* Dual SIM Cards Strip */}
                  <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
                    {device.simCards.map((sim) => (
                      <div
                        key={sim.slot}
                        className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-sky-400">
                            S{sim.slot}
                          </span>
                          <div>
                            <span className="font-medium text-slate-200">{sim.carrier}</span>
                            <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                              {sim.phoneNumber}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>{sim.signalPercent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outbound SMS Feed */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">Recent Outbound SMS Dispatched</h2>
              </div>
              <button
                onClick={() => setActiveTab('sms')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                View SMS Hub ({recentSms.filter((s) => s.direction === 'outbound').length}) →
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {recentSms
                .filter((s) => s.direction === 'outbound')
                .slice(0, 4)
                .map((sms) => (
                  <div key={sms.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-3.5 w-3.5 text-sky-400" />
                        <span className="font-semibold text-slate-200 font-mono tabular-nums">
                          {sms.phoneNumber}
                        </span>
                        <span className="text-slate-500 font-mono">SIM {sms.simSlot}</span>
                      </div>
                      <p className="text-slate-300 text-xs line-clamp-1">{sms.message}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono ${
                          sms.status === 'delivered'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                            : sms.status === 'sent'
                            ? 'bg-sky-950/80 text-sky-400 border border-sky-800/50'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                        }`}
                      >
                        {sms.status}
                      </span>
                      <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
                        {new Date(sms.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

              {recentSms.filter((s) => s.direction === 'outbound').length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No outbound messages dispatched yet. Click "Dispatch SMS" to send your first message.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Inbound SMS & USSD Execution Sessions */}
        <div className="space-y-6">
          {/* Inbound Messages Stream */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Live Inbound Stream</h2>
              </div>
              <span className="text-xs text-slate-400">From Radio</span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {recentSms
                .filter((s) => s.direction === 'inbound')
                .slice(0, 3)
                .map((msg) => (
                  <div key={msg.id} className="p-3.5 space-y-1 text-xs hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-semibold text-slate-200 font-mono tabular-nums">
                          {msg.phoneNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 bg-slate-950/60 rounded p-2 border border-slate-800/60 font-mono text-[11px]">
                      {msg.message}
                    </p>
                  </div>
                ))}

              {recentSms.filter((s) => s.direction === 'inbound').length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No incoming SMS recorded yet. Incoming messages forwarded by the phone appear here.
                </div>
              )}
            </div>
          </div>

          {/* Recent USSD Sessions */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-white">USSD Execution Sessions</h2>
              </div>
              <button
                onClick={onOpenQuickUssd}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium"
              >
                Run Code →
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {recentUssd.slice(0, 3).map((session) => (
                <div key={session.id} className="p-3.5 space-y-1.5 text-xs hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/50">
                        {session.ussdCode}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">SIM {session.simSlot}</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {session.executionTimeMs ? `${session.executionTimeMs}ms` : session.status}
                    </span>
                  </div>

                  {session.responseDialog && (
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 font-mono leading-relaxed line-clamp-3">
                      {session.responseDialog}
                    </div>
                  )}
                </div>
              ))}

              {recentUssd.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No USSD sessions executed yet. Dial *144# to test your SIM's USSD relay.
                </div>
              )}
            </div>
          </div>

          {/* Quick Setup Card */}
          <div className="rounded-xl border border-sky-950/80 bg-gradient-to-b from-sky-950/30 to-slate-900/60 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-sky-400" />
              How to Turn Your Phone into a Gateway
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 marker:text-sky-400">
              <li>Open Android Client App tab and get the Kotlin project.</li>
              <li>Install on your Android smartphone (API 26+).</li>
              <li>Grant SMS & Call permissions + Battery Unrestricted.</li>
              <li>Scan the Pairing QR code to sync with this REST backend.</li>
            </ol>
            <button
              onClick={() => setActiveTab('android')}
              className="w-full mt-2 rounded-lg bg-sky-500 py-2 text-xs font-semibold text-white hover:bg-sky-400 transition-colors"
            >
              Explore Android Code & Setup Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
