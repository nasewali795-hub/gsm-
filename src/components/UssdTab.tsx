import React, { useState } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Smartphone,
  Hash,
  Copy,
  Check,
  Radio,
} from 'lucide-react';
import { Device, UssdSession } from '../types/gateway.ts';
import { api } from '../lib/api.ts';

interface UssdTabProps {
  devices: Device[];
  sessions: UssdSession[];
  onRefresh: () => void;
}

export const UssdTab: React.FC<UssdTabProps> = ({ devices, sessions, onRefresh }) => {
  const [ussdCode, setUssdCode] = useState('*144#');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || '');
  const [selectedSimSlot, setSelectedSimSlot] = useState<1 | 2>(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentSession, setCurrentSession] = useState<UssdSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const presets = [
    { code: '*144#', label: 'Balance & Bundles', carrier: 'Vodafone/Orange' },
    { code: '*124#', label: 'Airtime Account', carrier: 'T-Mobile/Airtel' },
    { code: '*131#', label: 'Data Passes & Internet', carrier: 'General GSM' },
    { code: '*99#', label: 'Mobile Money / Banking', carrier: 'Financial Service' },
    { code: '*555*1#', label: 'Daily Data Pack', carrier: 'Bundle Query' },
  ];

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  const handleExecute = async (codeToRun = ussdCode) => {
    if (!codeToRun.trim()) return;

    setIsExecuting(true);
    setErrorMessage(null);
    setCurrentSession(null);

    try {
      const res = await api.runUssd({
        ussdCode: codeToRun.trim(),
        deviceId: selectedDeviceId || undefined,
        simSlot: selectedSimSlot,
        sessionType: 'single',
      });

      // Poll for response dialog
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const detail = await api.getUssdSessionById(res.sessionId);
          if (detail.session.status === 'completed' || detail.session.status === 'failed' || attempts > 10) {
            clearInterval(pollInterval);
            setIsExecuting(false);
            setCurrentSession(detail.session);
            onRefresh();
          }
        } catch (e) {
          if (attempts > 10) {
            clearInterval(pollInterval);
            setIsExecuting(false);
          }
        }
      }, 500);
    } catch (err: any) {
      setIsExecuting(false);
      setErrorMessage(err.message || 'USSD execution failed');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-purple-400" />
            USSD Relay Console
          </h1>
          <p className="text-xs text-slate-400">
            Execute Unstructured Supplementary Service Data (USSD) session requests programmatically over GSM radio via Android TelephonyManager.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">REST: POST /api/v1/ussd/run</span>
        </div>
      </div>

      {/* Main Execution Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Dial & Config */}
        <div className="lg:col-span-7 space-y-5">
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Execute USSD Request</h2>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Target Phone & SIM selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Target Android Gateway</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.isOnline ? 'Online' : 'Offline'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">SIM Slot for USSD Radio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSimSlot(1)}
                    className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                      selectedSimSlot === 1
                        ? 'border-purple-500 bg-purple-500/10 text-white font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>SIM 1 ({selectedDevice?.simCards[0]?.carrier || 'Primary'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSimSlot(2)}
                    disabled={!selectedDevice?.simCards[1]}
                    className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                      selectedSimSlot === 2
                        ? 'border-purple-500 bg-purple-500/10 text-white font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 disabled:opacity-40'
                    }`}
                  >
                    <span>SIM 2 ({selectedDevice?.simCards[1]?.carrier || 'Slot Empty'})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* USSD Code Input & Run Button */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-slate-300">USSD Code (e.g. *144#, *124#)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Hash className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={ussdCode}
                    onChange={(e) => setUssdCode(e.target.value)}
                    placeholder="*144#"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm font-mono font-semibold text-purple-300 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleExecute()}
                  disabled={isExecuting}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 transition-colors"
                >
                  {isExecuting ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Send USSD</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-medium text-slate-400">Quick USSD Carrier Presets</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.code}
                    onClick={() => {
                      setUssdCode(preset.code);
                      handleExecute(preset.code);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 hover:border-slate-700 text-left transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold font-mono text-purple-400">{preset.code}</div>
                      <div className="text-[11px] text-slate-400">{preset.label}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{preset.carrier}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Phone Screen Terminal Mockup */}
        <div className="lg:col-span-5">
          <div className="border border-slate-800 bg-slate-950 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Carrier Dialog Terminal</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>TelephonyManager Ready</span>
              </div>
            </div>

            {/* Simulated Phone Display Screen */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 min-h-[220px] flex flex-col justify-between">
              {isExecuting ? (
                <div className="my-auto text-center space-y-3">
                  <div className="inline-block p-3 rounded-full bg-purple-500/10 text-purple-400 animate-bounce">
                    <Radio className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">Opening USSD session with GSM Tower...</p>
                    <p className="text-[11px] font-mono text-slate-400">Request: {ussdCode}</p>
                  </div>
                </div>
              ) : currentSession ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono font-bold text-purple-400">{currentSession.ussdCode}</span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      {currentSession.executionTimeMs}ms roundtrip
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {currentSession.responseDialog}
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Completed at: {new Date(currentSession.completedAt || Date.now()).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="my-auto text-center space-y-2 p-4 text-slate-400">
                  <Terminal className="h-6 w-6 mx-auto text-slate-500" />
                  <p className="text-xs">No active USSD dialogue on display.</p>
                  <p className="text-[11px] text-slate-500">
                    Select a preset or enter a code like <code className="text-purple-400 font-mono">*144#</code> and press Send.
                  </p>
                </div>
              )}
            </div>

            {/* Android Architecture note */}
            <div className="rounded-lg bg-slate-900/40 p-3 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300">Android Implementation:</span>
              <p>
                Uses native Android 8.0+ <code className="text-sky-400 font-mono">telephonyManager.sendUssdRequest(code, callback, handler)</code> without user interaction required on device.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* USSD Execution Sessions History */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-white">USSD Execution Sessions Log</h2>
          <span className="text-xs text-slate-400 font-mono">{sessions.length} total sessions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="px-4 py-3">USSD Code</th>
                <th className="px-4 py-3">SIM Slot</th>
                <th className="px-4 py-3">Carrier Dialog Response</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-purple-400 whitespace-nowrap">
                    {sess.ussdCode}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                    SIM {sess.simSlot}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60 font-mono text-[11px] max-w-md line-clamp-2">
                      {sess.responseDialog || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono text-[11px] ${
                        sess.status === 'completed'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                      }`}
                    >
                      {sess.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap tabular-nums">
                    {sess.executionTimeMs ? `${sess.executionTimeMs}ms` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                    {new Date(sess.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setUssdCode(sess.ussdCode);
                        handleExecute(sess.ussdCode);
                      }}
                      className="px-2 py-1 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded font-semibold text-[11px]"
                    >
                      Re-run
                    </button>
                  </td>
                </tr>
              ))}

              {sessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No USSD commands recorded yet. Dial a code above to run your first session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
