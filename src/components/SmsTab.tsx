import React, { useState } from 'react';
import {
  Send,
  Inbox,
  Filter,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';
import { Device, SmsMessage } from '../types/gateway.ts';
import { api } from '../lib/api.ts';

interface SmsTabProps {
  devices: Device[];
  smsList: SmsMessage[];
  onRefresh: () => void;
}

export const SmsTab: React.FC<SmsTabProps> = ({ devices, smsList, onRefresh }) => {
  const [activeSubView, setActiveSubView] = useState<'dispatch' | 'outbound' | 'inbound'>('dispatch');

  // Dispatch Form State
  const [recipient, setRecipient] = useState('+1 415 555 2671');
  const [message, setMessage] = useState('Your secure authentication PIN is 749102. Valid for 10 minutes. Do not share this code.');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || '');
  const [selectedSimSlot, setSelectedSimSlot] = useState<1 | 2>(1);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Inbound Simulation State
  const [simSender, setSimSender] = useState('+1 312 555 0198');
  const [simMessage, setSimMessage] = useState('YES, I approve the card payment of $120.00');
  const [isSimulatingInbound, setIsSimulatingInbound] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calculate encoding and parts
  const isGsm7 = /^[\x20-\x7E\r\n\t]*$/.test(message);
  const encoding = isGsm7 ? 'GSM-7' : 'UCS-2 (Unicode)';
  const maxSingle = isGsm7 ? 160 : 70;
  const maxMultipart = isGsm7 ? 153 : 67;
  const partsCount = message.length <= maxSingle ? 1 : Math.ceil(message.length / maxMultipart);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !message.trim()) {
      setSendError('Please provide both recipient phone number and message content');
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccessMessage(null);

    try {
      const res = await api.sendSms({
        to: recipient.trim(),
        message: message.trim(),
        deviceId: selectedDeviceId || undefined,
        simSlot: selectedSimSlot,
        webhookUrl: webhookUrl.trim() || undefined,
      });

      setSendSuccessMessage(`SMS successfully queued for dispatch via ${selectedDevice?.name || 'Gateway'} (Message ID: ${res.messageId})`);
      onRefresh();
    } catch (err: any) {
      setSendError(err.message || 'Failed to dispatch SMS');
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simSender.trim() || !simMessage.trim()) return;

    setIsSimulatingInbound(true);
    try {
      await api.simulateInboundSms({
        from: simSender.trim(),
        message: simMessage.trim(),
        simSlot: selectedSimSlot,
        deviceId: selectedDeviceId || undefined,
      });
      onRefresh();
      setActiveSubView('inbound');
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setIsSimulatingInbound(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSms(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete SMS');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const outboundMessages = smsList.filter((m) => m.direction === 'outbound');
  const inboundMessages = smsList.filter((m) => m.direction === 'inbound');

  return (
    <div className="space-y-6">
      {/* Tab Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Send className="h-5 w-5 text-sky-400" />
            SMS Hub & GSM Dispatcher
          </h1>
          <p className="text-xs text-slate-400">
            Send programmatic SMS via Android SIM cards, track delivery receipts, and capture inbound carrier responses.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubView('dispatch')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubView === 'dispatch'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dispatch Outbound
          </button>
          <button
            onClick={() => setActiveSubView('outbound')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubView === 'outbound'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Outbound Logs ({outboundMessages.length})
          </button>
          <button
            onClick={() => setActiveSubView('inbound')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubView === 'inbound'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inbound Inbox ({inboundMessages.length})
          </button>
        </div>
      </div>

      {/* View 1: Dispatch Outbound Form */}
      {activeSubView === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-white">Send SMS Message via GSM Gateway</h2>
                <span className="text-xs text-slate-400 font-mono">REST: POST /api/v1/sms/send</span>
              </div>

              {sendSuccessMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-800/80 bg-emerald-950/60 p-3 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{sendSuccessMessage}</span>
                </div>
              )}

              {sendError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}

              <form onSubmit={handleSend} className="space-y-4">
                {/* Target Device & SIM Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Target Android Gateway Phone</label>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                    >
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.isOnline ? 'Online' : 'Offline'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">SIM Slot Routing</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSimSlot(1)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors ${
                          selectedSimSlot === 1
                            ? 'border-sky-500 bg-sky-500/10 text-white font-semibold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>SIM 1 ({selectedDevice?.simCards[0]?.carrier || 'Primary'})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedSimSlot(2)}
                        disabled={!selectedDevice?.simCards[1]}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors ${
                          selectedSimSlot === 2
                            ? 'border-sky-500 bg-sky-500/10 text-white font-semibold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 disabled:opacity-40'
                        }`}
                      >
                        <span>SIM 2 ({selectedDevice?.simCards[1]?.carrier || 'Slot Empty'})</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recipient Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Recipient Phone Number (E.164 standard)</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="+1 202 555 0192"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                    required
                  />
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Include country code prefix (e.g. +1 for US/CA, +44 for UK, +234 for Nigeria)</span>
                  </div>
                </div>

                {/* Message Body & Real-Time Encoding Calculator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">SMS Text Body</label>
                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400">
                      <span>{encoding}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-sky-400 font-semibold">{message.length} chars</span>
                      <span aria-hidden="true">·</span>
                      <span>{partsCount} SMS {partsCount > 1 ? 'parts' : 'part'}</span>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter message text to be delivered over GSM radio..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Optional Webhook Callback */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Optional Delivery Report Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://api.yourdomain.com/webhooks/sms-delivery"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMessage('Your verification code is 849201. Do not share this.')}
                      className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    >
                      OTP Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessage('Your order #9921 has shipped via Express delivery.')}
                      className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    >
                      Shipping Template
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-400 disabled:opacity-50 transition-colors"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending via GSM...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Dispatch to Phone Queue</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Inbound Simulator & GSM Specs */}
          <div className="space-y-6">
            {/* Simulator Box */}
            <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Simulate Inbound SMS</h3>
                </div>
                <span className="text-[11px] text-slate-400">Test Webhook</span>
              </div>

              <p className="text-xs text-slate-400">
                Simulate receiving an SMS on the Android phone (triggers the Android SMS BroadcastReceiver relay to your backend).
              </p>

              <form onSubmit={handleSimulateInbound} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300">From (Customer Phone)</label>
                  <input
                    type="text"
                    value={simSender}
                    onChange={(e) => setSimSender(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300">Message Body</label>
                  <textarea
                    rows={2}
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSimulatingInbound}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  <span>Push Inbound SMS Event</span>
                </button>
              </form>
            </div>

            {/* GSM Radio Protocol Spec */}
            <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 text-xs space-y-2 text-slate-400 font-mono">
              <div className="font-semibold text-slate-200 font-sans">GSM Radio Standards</div>
              <div>· Single SMS: 160 chars (7-bit) / 70 chars (UCS-2)</div>
              <div>· Concatenated: 153 chars / 67 chars per part</div>
              <div>· Android API: SmsManager.sendMultipartTextMessage()</div>
              <div>· Dual-SIM: SubscriptionManager.getSubscriptionId()</div>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Outbound Logs Table */}
      {activeSubView === 'outbound' && (
        <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-white">Outbound SMS Dispatch History</h2>
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">SIM Slot</th>
                  <th className="px-4 py-3">GSM Ref</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {outboundMessages.map((sms) => (
                  <tr key={sms.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono text-[11px] ${
                          sms.status === 'delivered'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                            : sms.status === 'sent'
                            ? 'bg-sky-950/80 text-sky-400 border border-sky-800/50'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                        }`}
                      >
                        {sms.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-200 tabular-nums whitespace-nowrap">
                      {sms.phoneNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{sms.message}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                      SIM {sms.simSlot}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                      {sms.gsmReference || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                      {new Date(sms.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyToClipboard(sms.id, sms.id)}
                          className="text-slate-400 hover:text-slate-200"
                          title="Copy Message ID"
                        >
                          {copiedId === sms.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(sms.id)}
                          className="text-slate-500 hover:text-rose-400"
                          title="Delete Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {outboundMessages.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No outbound messages recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Inbound Inbox */}
      {activeSubView === 'inbound' && (
        <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Inbound SMS Inbox (Received by Android Phones)</h2>
            </div>
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh Inbox</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="px-4 py-3">Sender</th>
                  <th className="px-4 py-3">Inbound Message Body</th>
                  <th className="px-4 py-3">Target SIM</th>
                  <th className="px-4 py-3">Gateway Device</th>
                  <th className="px-4 py-3">Received At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {inboundMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-emerald-400 whitespace-nowrap tabular-nums">
                      {msg.phoneNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60 font-mono text-[11px] max-w-md">
                        {msg.message}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                      SIM {msg.simSlot}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {devices.find((d) => d.id === msg.deviceId)?.name || 'Default Gateway'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setRecipient(msg.phoneNumber);
                            setActiveSubView('dispatch');
                          }}
                          className="px-2 py-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded font-semibold text-[11px]"
                        >
                          Reply SMS
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {inboundMessages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No inbound SMS messages captured yet. Use the simulator or send an SMS to your connected phone's number.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
