import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Lock,
  Terminal,
  Send,
  Smartphone,
} from 'lucide-react';
import { ApiKey, WebhookConfig } from '../types/gateway.ts';
import { api, getAuthToken, setAuthToken } from '../lib/api.ts';

export const ApiWebhooksTab: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go'>('curl');
  const [selectedEndpoint, setSelectedEndpoint] = useState<'send_sms' | 'inbound_sms' | 'run_ussd' | 'list_devices'>('send_sms');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // New Key Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [permSmsSend, setPermSmsSend] = useState(true);
  const [permSmsRead, setPermSmsRead] = useState(true);
  const [permUssdRun, setPermUssdRun] = useState(true);
  const [permDeviceManage, setPermDeviceManage] = useState(false);

  // New Webhook Modal
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  const loadData = () => {
    api.getKeys().then((res) => setKeys(res.keys)).catch(console.error);
    api.getWebhooks().then((res) => setWebhooks(res.webhooks)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const perms: string[] = [];
    if (permSmsSend) perms.push('sms:send');
    if (permSmsRead) perms.push('sms:read');
    if (permUssdRun) perms.push('ussd:run');
    if (permDeviceManage) perms.push('device:manage');

    try {
      await api.createKey({ name: keyName.trim(), permissions: perms });
      setShowKeyModal(false);
      setKeyName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed creating key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await api.deleteKey(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed deleting key');
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    try {
      await api.createWebhook({ url: webhookUrl.trim() });
      setShowWebhookModal(false);
      setWebhookUrl('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed creating webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await api.deleteWebhook(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed deleting webhook');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const sampleKey = keys[0]?.keyFull || 'gsm_live_8f3a9b1c7e6d5a4209bf184e9d2c1';

  // Dynamic code snippets
  const getCodeSnippet = () => {
    if (selectedEndpoint === 'send_sms') {
      if (activeLang === 'curl') {
        return `curl -X POST "${currentOrigin}/api/v1/sms/send" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+12025550192",
    "message": "Your verification code is 849201",
    "simSlot": 1
  }'`;
      }
      if (activeLang === 'node') {
        return `const response = await fetch("${currentOrigin}/api/v1/sms/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${sampleKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    to: "+12025550192",
    message: "Your verification code is 849201",
    simSlot: 1
  })
});
const result = await response.json();
console.log("Dispatched SMS ID:", result.messageId);`;
      }
      if (activeLang === 'python') {
        return `import requests

url = "${currentOrigin}/api/v1/sms/send"
headers = {
    "Authorization": "Bearer ${sampleKey}",
    "Content-Type": "application/json"
}
payload = {
    "to": "+12025550192",
    "message": "Your verification code is 849201",
    "simSlot": 1
}

res = requests.post(url, json=payload, headers=headers)
print(res.json())`;
      }
      if (activeLang === 'php') {
        return `<?php
$ch = curl_init("${currentOrigin}/api/v1/sms/send");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer ${sampleKey}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "to" => "+12025550192",
    "message" => "Your verification code is 849201",
    "simSlot" => 1
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
      }
      if (activeLang === 'go') {
        return `package main

import (
  "bytes"
  "fmt"
  "net/http"
)

func main() {
  url := "${currentOrigin}/api/v1/sms/send"
  jsonBody := []byte(\`{"to": "+12025550192", "message": "Code: 849201", "simSlot": 1}\`)
  req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
  req.Header.Set("Authorization", "Bearer ${sampleKey}")
  req.Header.Set("Content-Type", "application/json")

  client := &http.Client{}
  resp, _ := client.Do(req)
  defer resp.Body.Close()
  fmt.Println("Status:", resp.Status)
}`;
      }
    }

    if (selectedEndpoint === 'run_ussd') {
      if (activeLang === 'curl') {
        return `curl -X POST "${currentOrigin}/api/v1/ussd/run" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ussdCode": "*144#",
    "simSlot": 1
  }'`;
      }
      if (activeLang === 'node') {
        return `const response = await fetch("${currentOrigin}/api/v1/ussd/run", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${sampleKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    ussdCode: "*144#",
    simSlot: 1
  })
});
const session = await response.json();
console.log("USSD Session Queued:", session.sessionId);`;
      }
      if (activeLang === 'python') {
        return `import requests

res = requests.post(
    "${currentOrigin}/api/v1/ussd/run",
    headers={"Authorization": "Bearer ${sampleKey}"},
    json={"ussdCode": "*144#", "simSlot": 1}
)
print(res.json())`;
      }
    }

    if (selectedEndpoint === 'inbound_sms') {
      return `curl -X GET "${currentOrigin}/api/v1/sms/inbound?limit=25" \\
  -H "Authorization: Bearer ${sampleKey}"`;
    }

    return `curl -X GET "${currentOrigin}/api/v1/devices" \\
  -H "Authorization: Bearer ${sampleKey}"`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet() || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-400" />
            REST API & Secure Authentication
          </h1>
          <p className="text-xs text-slate-400">
            Generate programmatic Bearer API keys with granular scopes (<code className="text-slate-300">sms:send</code>, <code className="text-slate-300">sms:read</code>, <code className="text-slate-300">ussd:run</code>) and configure inbound webhooks.
          </p>
        </div>

        <button
          onClick={() => setShowKeyModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-400 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* API Keys Table */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">Active REST API Keys</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{keys.length} keys</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="px-4 py-3">Key Label</th>
                <th className="px-4 py-3">Token String</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                    {k.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                    <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {k.keyFull}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {k.permissions.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/50 text-[10px] font-mono text-sky-400"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap tabular-nums">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyToClipboard(k.keyFull, k.id)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="Copy Key"
                      >
                        {copiedKeyId === k.id ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Revoke Key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippets & Endpoints Catalog */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">Interactive REST API Code Snippets</h2>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['curl', 'node', 'python', 'php', 'go'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-2.5 py-1 text-xs font-mono uppercase rounded transition-colors ${
                  activeLang === lang
                    ? 'bg-sky-500 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setSelectedEndpoint('send_sms')}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
              selectedEndpoint === 'send_sms'
                ? 'border-sky-500 bg-sky-500/10 text-white font-semibold'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Send className="h-3.5 w-3.5 text-sky-400" />
            <span>POST /api/v1/sms/send</span>
          </button>

          <button
            onClick={() => setSelectedEndpoint('inbound_sms')}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
              selectedEndpoint === 'inbound_sms'
                ? 'border-sky-500 bg-sky-500/10 text-white font-semibold'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span>GET /api/v1/sms/inbound</span>
          </button>

          <button
            onClick={() => setSelectedEndpoint('run_ussd')}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
              selectedEndpoint === 'run_ussd'
                ? 'border-sky-500 bg-sky-500/10 text-white font-semibold'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-purple-400" />
            <span>POST /api/v1/ussd/run</span>
          </button>

          <button
            onClick={() => setSelectedEndpoint('list_devices')}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
              selectedEndpoint === 'list_devices'
                ? 'border-sky-500 bg-sky-500/10 text-white font-semibold'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 text-amber-400" />
            <span>GET /api/v1/devices</span>
          </button>
        </div>

        {/* Code Box */}
        <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
          <button
            onClick={copyCode}
            className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
          >
            {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
          <pre className="pr-16">{getCodeSnippet()}</pre>
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Inbound SMS & Event Webhooks</h2>
          </div>
          <button
            onClick={() => setShowWebhookModal(true)}
            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Webhook URL</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          When the Android gateway receives an incoming SMS from a customer or when a USSD session finishes, an HTTP POST request is sent to your webhook URL with HMAC-SHA256 signature <code className="text-slate-200">X-Gateway-Signature</code>.
        </p>

        <div className="divide-y divide-slate-800">
          {webhooks.map((wh) => (
            <div key={wh.id} className="py-3 flex items-center justify-between text-xs gap-4">
              <div className="space-y-1 truncate">
                <div className="font-mono font-medium text-slate-200 truncate">{wh.url}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>Secret: {wh.secret.slice(0, 10)}...</span>
                  <span>·</span>
                  <span>Events: {wh.events.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <button
                  onClick={() => handleDeleteWebhook(wh.id)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {webhooks.length === 0 && (
            <div className="py-4 text-center text-xs text-slate-400">
              No webhook URLs configured. Add one to receive real-time HTTP callbacks.
            </div>
          )}
        </div>
      </div>

      {/* Create Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-slate-800 bg-slate-900 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Generate API Key</h3>

            <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Key Description / Service Name</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Backend Notification Service"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-medium">Scopes & Permissions</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={permSmsSend}
                      onChange={(e) => setPermSmsSend(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500"
                    />
                    <span>sms:send (Send programmatic SMS)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={permSmsRead}
                      onChange={(e) => setPermSmsRead(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500"
                    />
                    <span>sms:read (Read inbound & outbound message logs)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={permUssdRun}
                      onChange={(e) => setPermUssdRun(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500"
                    />
                    <span>ussd:run (Execute USSD session queries)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={permDeviceManage}
                      onChange={(e) => setPermDeviceManage(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500"
                    />
                    <span>device:manage (Register & configure phones)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-sky-500 text-white font-semibold hover:bg-sky-400"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-slate-800 bg-slate-900 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Webhook URL</h3>

            <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Callback Endpoint URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-crm.com/webhooks/gsm"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-sky-500 text-white font-semibold hover:bg-sky-400"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
