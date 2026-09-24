import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header.tsx';
import { OverviewTab } from './components/OverviewTab.tsx';
import { SmsTab } from './components/SmsTab.tsx';
import { UssdTab } from './components/UssdTab.tsx';
import { AndroidTab } from './components/AndroidTab.tsx';
import { DevicesTab } from './components/DevicesTab.tsx';
import { ApiWebhooksTab } from './components/ApiWebhooksTab.tsx';
import { AntigravityTab } from './components/AntigravityTab.tsx';
import { PairDeviceModal } from './components/PairDeviceModal.tsx';
import { Device, SmsMessage, UssdSession, SystemStats } from './types/gateway.ts';
import { api } from './lib/api.ts';
import { Smartphone, Send, Terminal, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [devices, setDevices] = useState<Device[]>([]);
  const [smsList, setSmsList] = useState<SmsMessage[]>([]);
  const [ussdSessions, setUssdSessions] = useState<UssdSession[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [pairingDevice, setPairingDevice] = useState<Device | null>(null);

  const loadData = async () => {
    try {
      const [statsRes, devRes, outSmsRes, inSmsRes, ussdRes] = await Promise.all([
        api.getStats().catch(() => null),
        api.getDevices().catch(() => ({ devices: [] })),
        api.getOutboundSms().catch(() => ({ total: 0, messages: [] })),
        api.getInboundSms().catch(() => ({ total: 0, messages: [] })),
        api.getUssdSessions().catch(() => ({ total: 0, sessions: [] })),
      ]);

      if (statsRes) setStats(statsRes);
      if (devRes) setDevices(devRes.devices);
      
      const combinedSms = [...outSmsRes.messages, ...inSmsRes.messages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSmsList(combinedSms);

      if (ussdRes) setUssdSessions(ussdRes.sessions);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed connecting to GSM Gateway Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh telemetry every 6 seconds
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const onlineDevicesCount = devices.filter((d) => d.isOnline).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onlineDevicesCount={onlineDevicesCount}
        totalDevicesCount={devices.length}
        onOpenQuickSend={() => setActiveTab('sms')}
        onOpenQuickUssd={() => setActiveTab('ussd')}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-800/80 bg-rose-950/60 p-4 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            devices={devices}
            recentSms={smsList}
            recentUssd={ussdSessions}
            setActiveTab={setActiveTab}
            onOpenQuickSend={() => setActiveTab('sms')}
            onOpenQuickUssd={() => setActiveTab('ussd')}
            onPairDevice={(dev) => setPairingDevice(dev)}
          />
        )}

        {activeTab === 'sms' && (
          <SmsTab
            devices={devices}
            smsList={smsList}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'ussd' && (
          <UssdTab
            devices={devices}
            sessions={ussdSessions}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'android' && <AndroidTab />}

        {activeTab === 'devices' && (
          <DevicesTab
            devices={devices}
            onRefresh={loadData}
            onPairDevice={(dev) => setPairingDevice(dev)}
          />
        )}

        {activeTab === 'api' && <ApiWebhooksTab />}

        {activeTab === 'antigravity' && <AntigravityTab />}
      </main>

      {/* Modals */}
      {pairingDevice && (
        <PairDeviceModal
          device={pairingDevice}
          onClose={() => setPairingDevice(null)}
        />
      )}

      {/* Editorial Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">GSM Gateway & USSD Relay Engine</span>
            <span>·</span>
            <span>Android TelephonyManager API 26–35</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono">
            <span>REST API v1</span>
            <span>·</span>
            <span>Bearer Auth</span>
            <span>·</span>
            <span>Dual-SIM Multiplexing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
