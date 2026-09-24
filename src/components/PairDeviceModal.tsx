import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Smartphone, ExternalLink, X, RefreshCw } from 'lucide-react';
import { Device } from '../types/gateway.ts';
import { api } from '../lib/api.ts';

interface PairDeviceModalProps {
  device: Device | null;
  onClose: () => void;
}

export const PairDeviceModal: React.FC<PairDeviceModalProps> = ({ device, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (!device) return;
    setLoading(true);
    api
      .getDeviceQr(device.id)
      .then((res) => {
        setQrDataUrl(res.qrDataUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed fetching QR:', err);
        setLoading(false);
      });
  }, [device]);

  if (!device) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const copyUrl = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(device.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md border border-slate-800 bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Pair Android Gateway Phone</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200">
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-800 gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span className="text-xs font-medium">Generating Pairing QR...</span>
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Gateway Pairing QR Code"
              className="h-56 w-56 object-contain"
            />
          ) : (
            <div className="h-56 flex items-center justify-center text-rose-500 text-xs">
              Failed loading QR code
            </div>
          )}
          <span className="mt-2 text-[11px] font-mono font-semibold text-slate-700">
            Scan from Android Gateway App
          </span>
        </div>

        {/* Instructions */}
        <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <span className="font-semibold text-white">Pairing Instructions:</span>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>Install & launch the companion app on <strong className="text-slate-200">{device.name}</strong>.</li>
            <li>Tap "Scan QR Code" and aim camera at this code.</li>
            <li>The phone connects immediately and begins processing SMS/USSD jobs.</li>
          </ol>
        </div>

        {/* Manual Credentials */}
        <div className="space-y-2 text-xs">
          <span className="text-slate-400 font-medium">Or Enter Manually in Android App:</span>
          
          <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-950 px-3 py-2">
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block">Server URL</span>
              <span className="font-mono text-slate-300 truncate">{currentOrigin}</span>
            </div>
            <button
              onClick={copyUrl}
              className="ml-2 text-slate-400 hover:text-slate-200 shrink-0"
            >
              {copiedUrl ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-950 px-3 py-2">
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block">Device Token</span>
              <span className="font-mono text-slate-300 truncate">{device.token}</span>
            </div>
            <button
              onClick={copyToken}
              className="ml-2 text-slate-400 hover:text-slate-200 shrink-0"
            >
              {copiedToken ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
