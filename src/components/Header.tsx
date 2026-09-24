import React from 'react';
import { Smartphone, Send, Terminal, KeyRound } from 'lucide-react';

export type ActiveTab = 'overview' | 'sms' | 'ussd' | 'android' | 'devices' | 'api' | 'antigravity';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onlineDevicesCount: number;
  totalDevicesCount: number;
  onOpenQuickSend: () => void;
  onOpenQuickUssd: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onlineDevicesCount,
  totalDevicesCount,
  onOpenQuickSend,
  onOpenQuickUssd,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">
              GSM Gateway & USSD Relay
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`inline-block h-2 w-2 rounded-full ${onlineDevicesCount > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="font-mono tabular-nums">{onlineDevicesCount}/{totalDevicesCount} Gateways Online</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'sms'
                ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SMS Hub
          </button>

          <button
            onClick={() => setActiveTab('ussd')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'ussd'
                ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            USSD Console
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'android'
                ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Android Client App
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'devices'
                ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Devices & SIMs
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'api'
                ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            REST API & Keys
          </button>

          <button
            onClick={() => setActiveTab('antigravity')}
            className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'antigravity'
                ? 'text-purple-400 border-b-2 border-purple-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Antigravity Agent</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuickUssd}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Run USSD</span>
          </button>

          <button
            onClick={onOpenQuickSend}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-400 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Dispatch SMS</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-800/80 px-2 py-1.5 no-scrollbar">
        <div className="flex gap-1 whitespace-nowrap">
          {(
            [
              ['overview', 'Overview'],
              ['sms', 'SMS Hub'],
              ['ussd', 'USSD Console'],
              ['android', 'Android App'],
              ['devices', 'Devices'],
              ['api', 'REST API'],
              ['antigravity', 'Antigravity'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                activeTab === key
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
