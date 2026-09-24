import React, { useState } from 'react';
import {
  Cpu,
  Terminal,
  Code2,
  Copy,
  Check,
  Send,
  Smartphone,
  Play,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Shield,
  FileCode,
} from 'lucide-react';
import { api, getAuthToken } from '../lib/api.ts';

export const AntigravityTab: React.FC = () => {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'interactions' | 'python' | 'bash'>('interactions');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Live Agent Tool Execution Playground
  const [selectedTool, setSelectedTool] = useState<'send_sms' | 'run_ussd' | 'read_inbound_sms' | 'get_gateway_status'>('send_sms');
  const [toolTo, setToolTo] = useState('+1 202 555 0192');
  const [toolMessage, setToolMessage] = useState('Antigravity Agent: Build completed successfully. Tests passed: 48/48.');
  const [toolUssd, setToolUssd] = useState('*144#');
  const [toolSimSlot, setToolSimSlot] = useState<1 | 2>(1);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const apiKey = getAuthToken();

  const handleExecuteTool = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    setExecutionOutput(null);

    let args: any = {};
    if (selectedTool === 'send_sms') {
      args = { to: toolTo, message: toolMessage, simSlot: toolSimSlot };
    } else if (selectedTool === 'run_ussd') {
      args = { ussdCode: toolUssd, simSlot: toolSimSlot };
    } else if (selectedTool === 'read_inbound_sms') {
      args = { limit: 5 };
    } else if (selectedTool === 'get_gateway_status') {
      args = {};
    }

    try {
      const res = await fetch('/api/v1/antigravity/execute-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          toolName: selectedTool,
          arguments: args,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Execution failed');
      setExecutionOutput(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Tool execution error');
    } finally {
      setIsExecuting(false);
    }
  };

  const getInteractionsApiCode = () => {
    return `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

// 1. Declare GSM Gateway Tools for Antigravity Agent
const gsmTools = [
  {
    type: "function",
    name: "send_sms",
    description: "Send an SMS text message using the physical Android phone radio.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient phone number, e.g. +12025550192" },
        message: { type: "string", description: "Text content of the SMS" },
        simSlot: { type: "integer", description: "SIM slot (1 or 2)" }
      },
      required: ["to", "message"]
    }
  },
  {
    type: "function",
    name: "run_ussd",
    description: "Run a USSD code (e.g. *144#, *124#) to check balance or airtime.",
    parameters: {
      type: "object",
      properties: {
        ussdCode: { type: "string", description: "The USSD code string" },
        simSlot: { type: "integer", description: "SIM slot (1 or 2)" }
      },
      required: ["ussdCode"]
    }
  }
];

// 2. Invoke Antigravity Agent with remote Linux sandbox and GSM tools
const interaction = await ai.interactions.create({
  agent: "antigravity-preview-09-2026",
  input: "Check the airtime balance using USSD code *144# on SIM 1, then send an SMS summary to +12025550192.",
  environment: "remote",
  tools: gsmTools,
}, { timeout: 300000 });

console.log("Antigravity Output:", interaction.output_text);`;
  };

  const getPythonScriptCode = () => {
    return `#!/usr/bin/env python3
"""
Antigravity Agent GSM Gateway Helper
Run inside your Antigravity Linux sandbox container or automated task runner.
"""
import requests
import json

GATEWAY_URL = "${currentOrigin}"
API_KEY = "${apiKey}"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def send_sms(to: str, message: str, sim_slot: int = 1):
    """Dispatches SMS text message through Android phone radio"""
    url = f"{GATEWAY_URL}/api/v1/sms/send"
    payload = {"to": to, "message": message, "simSlot": sim_slot}
    res = requests.post(url, headers=headers, json=payload)
    return res.json()

def run_ussd(code: str = "*144#", sim_slot: int = 1):
    """Executes USSD balance / menu query via TelephonyManager"""
    url = f"{GATEWAY_URL}/api/v1/ussd/run"
    payload = {"ussdCode": code, "simSlot": sim_slot}
    res = requests.post(url, headers=headers, json=payload)
    return res.json()

def get_inbound_sms():
    """Fetches incoming SMS received on the phone"""
    url = f"{GATEWAY_URL}/api/v1/sms/inbound?limit=10"
    res = requests.get(url, headers=headers)
    return res.json()

if __name__ == "__main__":
    print("Testing GSM Gateway from Antigravity sandbox:")
    result = send_sms("+12025550192", "Hello from Antigravity Agent!")
    print(json.dumps(result, indent=2))
`;
  };

  const getBashCliCode = () => {
    return `#!/usr/bin/env bash
# Antigravity Command-Line Gateway Helper
GATEWAY_URL="${currentOrigin}"
API_KEY="${apiKey}"

# 1. Send SMS via curl
send_sms() {
  curl -s -X POST "$GATEWAY_URL/api/v1/sms/send" \\
    -H "Authorization: Bearer $API_KEY" \\
    -H "Content-Type: application/json" \\
    -d "{\\"to\\": \\"$1\\", \\"message\\": \\"$2\\", \\"simSlot\\": \${3:-1}}"
}

# 2. Run USSD code
run_ussd() {
  curl -s -X POST "$GATEWAY_URL/api/v1/ussd/run" \\
    -H "Authorization: Bearer $API_KEY" \\
    -H "Content-Type: application/json" \\
    -d "{\\"ussdCode\\": \\"$1\\", \\"simSlot\\": \${2:-1}}"
}

# Examples:
# send_sms "+12025550192" "Deployment to production finished"
# run_ussd "*144#"
`;
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const activeSnippet =
    activeSnippetTab === 'interactions'
      ? getInteractionsApiCode()
      : activeSnippetTab === 'python'
      ? getPythonScriptCode()
      : getBashCliCode();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-sky-400" />
            Antigravity Agent Integration Bridge
          </h1>
          <p className="text-xs text-slate-400">
            Attach this GSM Gateway to your Antigravity agent (<code className="text-slate-300">antigravity-preview-09-2026</code>) to run commands, dispatch SMS alerts, and execute USSD sessions programmatically.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/50">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Antigravity Tool Endpoints Live</span>
        </div>
      </div>

      {/* Integration Workflow Diagram */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-sky-400" />
          Antigravity Agent $\leftrightarrow$ GSM Gateway Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sky-400">
              <Cpu className="h-4 w-4" />
              <span>1. Antigravity Agent</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Runs in Google-hosted Linux container. Analyzes tasks, writes code, and invokes <code className="text-slate-200">send_sms</code> or <code className="text-slate-200">run_ussd</code> tools or Python scripts.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <Terminal className="h-4 w-4" />
              <span>2. REST API Gateway</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Validates Bearer token, routes requests to target phone, splits multipart SMS messages, and manages asynchronous USSD response dialogues.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-400">
              <Smartphone className="h-4 w-4" />
              <span>3. Android Phone Radio</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Pulls tasks via Foreground Service, uses <code className="text-slate-200">SmsManager</code> & <code className="text-slate-200">TelephonyManager</code> to transmit over cellular GSM towers.
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column: Code Recipes & Live Test Tool Invoker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Ready-to-use Code */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden space-y-3 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">How to Attach to Antigravity</h3>
              </div>

              {/* Snippet tab selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveSnippetTab('interactions')}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    activeSnippetTab === 'interactions'
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Interactions API
                </button>
                <button
                  onClick={() => setActiveSnippetTab('python')}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    activeSnippetTab === 'python'
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Python SDK
                </button>
                <button
                  onClick={() => setActiveSnippetTab('bash')}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    activeSnippetTab === 'bash'
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bash CLI
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[480px]">
              <button
                onClick={() => copyCode(activeSnippet)}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                {copiedSnippet ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSnippet ? 'Copied' : 'Copy Snippet'}</span>
              </button>
              <pre className="pr-16 leading-relaxed whitespace-pre">{activeSnippet}</pre>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Tool Invocation Playground */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Test Antigravity Tool Invocation</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Direct Runner</span>
            </div>

            <p className="text-xs text-slate-400">
              Test invoking the exact same function calls that Antigravity executes when solving tasks.
            </p>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Select Tool to Test</label>
                <select
                  value={selectedTool}
                  onChange={(e: any) => setSelectedTool(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono"
                >
                  <option value="send_sms">send_sms (Dispatch SMS)</option>
                  <option value="run_ussd">run_ussd (Execute USSD Code)</option>
                  <option value="read_inbound_sms">read_inbound_sms (Fetch Incoming SMS)</option>
                  <option value="get_gateway_status">get_gateway_status (Telemetry)</option>
                </select>
              </div>

              {selectedTool === 'send_sms' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-300">Recipient Phone (to)</label>
                    <input
                      type="text"
                      value={toolTo}
                      onChange={(e) => setToolTo(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300">Message Text</label>
                    <textarea
                      rows={3}
                      value={toolMessage}
                      onChange={(e) => setToolMessage(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-950 p-2.5 text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300">SIM Slot</label>
                    <select
                      value={toolSimSlot}
                      onChange={(e) => setToolSimSlot(Number(e.target.value) as 1 | 2)}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono"
                    >
                      <option value={1}>SIM 1</option>
                      <option value={2}>SIM 2</option>
                    </select>
                  </div>
                </>
              )}

              {selectedTool === 'run_ussd' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-300">USSD Code (ussdCode)</label>
                    <input
                      type="text"
                      value={toolUssd}
                      onChange={(e) => setToolUssd(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-purple-300 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300">SIM Slot</label>
                    <select
                      value={toolSimSlot}
                      onChange={(e) => setToolSimSlot(Number(e.target.value) as 1 | 2)}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono"
                    >
                      <option value={1}>SIM 1</option>
                      <option value={2}>SIM 2</option>
                    </select>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleExecuteTool}
                disabled={isExecuting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-400 disabled:opacity-50 transition-colors"
              >
                {isExecuting ? (
                  <span>Invoking Tool on Gateway...</span>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run Tool "{selectedTool}"</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Display */}
            {executionOutput && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-300">Tool Execution Result:</span>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-200 overflow-x-auto max-h-48 leading-relaxed">
                  <pre>{JSON.stringify(executionOutput, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
