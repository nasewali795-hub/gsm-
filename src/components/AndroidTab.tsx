import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  FileCode,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Cpu,
  Radio,
  Shield,
  Layers,
  ExternalLink,
  ChevronRight,
  Terminal,
  Play,
  RotateCcw,
  Database,
  ArrowRight,
} from 'lucide-react';
import { AndroidFile } from '../types/gateway.ts';
import { api } from '../lib/api.ts';

export const AndroidTab: React.FC = () => {
  const [files, setFiles] = useState<AndroidFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Flow Simulation States
  const [isSimulatingFlow, setIsSimulatingFlow] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [simCode, setSimCode] = useState('*144#');
  const [simLog, setSimLog] = useState<string[]>([]);

  useEffect(() => {
    api
      .getAndroidFiles()
      .then((res) => {
        setFiles(res.files);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed loading Android files:', err);
        setLoading(false);
      });
  }, []);

  const currentFile = files[selectedFileIndex];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBundle = () => {
    window.location.href = '/api/v1/android/download';
  };

  const runFlowSimulation = async () => {
    setIsSimulatingFlow(true);
    setSimLog([]);

    const log = (msg: string) => {
      setSimLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    // Step 1: Hub sends request
    setActiveStep(1);
    log(`[Hub Server] POST http://phone-ip:8080/api/ussd with Bearer token & code: "${simCode}"`);
    await new Promise((r) => setTimeout(r, 700));

    // Step 2: ApiServer receives & validates
    setActiveStep(2);
    log(`[ApiServer:8080] Request authenticated as HUB_CLIENT. Role authorized. Status: 202 ACCEPTED`);
    await new Promise((r) => setTimeout(r, 800));

    // Step 3: UssdExecutor dials Intent.ACTION_CALL
    setActiveStep(3);
    log(`[UssdExecutor] Dialing via Intent.ACTION_CALL: Uri.parse("tel:${simCode.replace('#', '%23')}") on SIM 1`);
    await new Promise((r) => setTimeout(r, 900));

    // Step 4: Accessibility captures TYPE_WINDOW_CONTENT_CHANGED
    setActiveStep(4);
    log(`[UssdAccessibilityService] TYPE_WINDOW_CONTENT_CHANGED caught from com.android.phone`);
    log(`[UssdAccessibilityService] Extracted dialog text: "Vodafone GSM: Balance is $24.80. Data: 4.1GB. Ref: TX99201"`);
    log(`[UssdAccessibilityService] Auto-clicked "Dismiss" button to close system popup`);
    await new Promise((r) => setTimeout(r, 1000));

    // Step 5: ResponseParser parses
    setActiveStep(5);
    log(`[ResponseParser] Parsed: status=SUCCESS, balance="$24.80", transactionId="TX99201"`);
    await new Promise((r) => setTimeout(r, 700));

    // Step 6: ResultSender posts back to Hub with retries
    setActiveStep(6);
    log(`[ResultSender] POST http://hub-server/api/result (Attempt 1/3) -> HTTP 200 OK`);
    await new Promise((r) => setTimeout(r, 600));

    // Step 7: AuditLogger inserts to SQLite
    setActiveStep(7);
    log(`[AuditLogger] Inserted into SQLite table "transactions" & "audit_logs"`);
    await new Promise((r) => setTimeout(r, 400));

    setIsSimulatingFlow(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-sky-400" />
            Flametide GSM Gateway — Android Studio Project
          </h1>
          <p className="text-xs text-slate-400">
            Package: <code className="text-sky-300 font-mono">com.flametide.gateway</code> · Min SDK 21 (Android 5.0+) · Target SDK 35 · Kotlin
          </p>
        </div>

        <button
          onClick={handleDownloadBundle}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-400 transition-colors shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Download Android Studio Project (.json bundle)</span>
        </button>
      </div>

      {/* Permissions & Security Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300">
          <div className="text-[10px] text-slate-500">Permission 1</div>
          <div className="text-sky-400 font-semibold truncate">CALL_PHONE</div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300">
          <div className="text-[10px] text-slate-500">Permission 2</div>
          <div className="text-sky-400 font-semibold truncate">READ_PHONE_STATE</div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300">
          <div className="text-[10px] text-slate-500">Permission 3</div>
          <div className="text-sky-400 font-semibold truncate">INTERNET</div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300">
          <div className="text-[10px] text-slate-500">Permission 4</div>
          <div className="text-sky-400 font-semibold truncate">SYSTEM_ALERT_WINDOW</div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300">
          <div className="text-[10px] text-slate-500">Permission 5</div>
          <div className="text-purple-400 font-semibold truncate">BIND_ACCESSIBILITY</div>
        </div>
      </div>

      {/* Interactive Pipeline Visualizer */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              Automated Flow Pipeline (Hub $\rightarrow$ ApiServer $\rightarrow$ UssdExecutor $\rightarrow$ Accessibility $\rightarrow$ Parser $\rightarrow$ Sender $\rightarrow$ SQLite)
            </h2>
            <p className="text-xs text-slate-400">
              Visualizes the exact end-to-end execution path implemented in the Kotlin package.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={simCode}
              onChange={(e) => setSimCode(e.target.value)}
              className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-mono text-purple-300"
            />
            <button
              onClick={runFlowSimulation}
              disabled={isSimulatingFlow}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400 disabled:opacity-50 transition-colors"
            >
              {isSimulatingFlow ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing Flow...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Simulate Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 7-Step Pipeline Strip */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-xs">
          {[
            { step: 1, title: 'Hub Request', sub: 'POST :8080/api/ussd' },
            { step: 2, title: 'ApiServer', sub: 'Auth & 202 Accept' },
            { step: 3, title: 'UssdExecutor', sub: 'Intent.ACTION_CALL' },
            { step: 4, title: 'Accessibility', sub: 'WINDOW_CHANGED' },
            { step: 5, title: 'ResponseParser', sub: 'SUCCESS / FAILED' },
            { step: 6, title: 'ResultSender', sub: 'OkHttp POST + Retry' },
            { step: 7, title: 'AuditLogger', sub: 'SQLite Log Entry' },
          ].map((item) => (
            <div
              key={item.step}
              className={`p-2.5 rounded-lg border transition-all ${
                activeStep === item.step
                  ? 'border-sky-400 bg-sky-500/20 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-105'
                  : activeStep !== null && activeStep > item.step
                  ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span>0{item.step}</span>
                {activeStep !== null && activeStep > item.step && (
                  <Check className="h-3 w-3 text-emerald-400" />
                )}
              </div>
              <div className="font-semibold mt-1 text-slate-200 truncate">{item.title}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Pipeline Terminal Log */}
        {simLog.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 max-h-36 overflow-y-auto">
            {simLog.map((line, idx) => (
              <div key={idx} className="leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Viewer Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: File Tree (4 cols) */}
        <div className="lg:col-span-4 border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden flex flex-col h-[640px]">
          <div className="border-b border-slate-800 px-4 py-3 bg-slate-950/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">com.flametide.gateway</span>
            <span className="text-[11px] font-mono text-slate-500">{files.length} files</span>
          </div>

          <div className="divide-y divide-slate-800/80 overflow-y-auto flex-1">
            {files.map((file, idx) => (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 ${
                  selectedFileIndex === idx
                    ? 'bg-sky-500/10 border-l-2 border-sky-400 text-sky-300'
                    : 'text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <FileCode className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate font-mono">{file.filename}</div>
                  <div className="text-[11px] text-slate-400 truncate">{file.path}</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>

          {/* Setup Checklist */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 text-xs space-y-1.5">
            <span className="font-semibold text-slate-200">Execution Guarantees:</span>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>· Min SDK 21: Compatible with legacy & modern devices</div>
              <div>· ACTION_CALL encodes <code className="text-slate-300">#</code> as <code className="text-slate-300">%23</code></div>
              <div>· Retries: OkHttp exponential backoff up to 3 times</div>
              <div>· Audit: SQLite stores every dial & parsed result</div>
            </div>
          </div>
        </div>

        {/* Right Area: Code Display (8 cols) */}
        <div className="lg:col-span-8 border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden flex flex-col h-[640px]">
          {currentFile ? (
            <>
              {/* Code Header */}
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/80">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-400">{currentFile.filename}</span>
                    <span className="text-[11px] text-slate-500 font-mono">({currentFile.language})</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{currentFile.description}</p>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy File</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Viewer */}
              <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed selection:bg-sky-500/30">
                <pre className="whitespace-pre">
                  <code>{currentFile.content}</code>
                </pre>
              </div>
            </>
          ) : (
            <div className="m-auto text-center text-xs text-slate-400">
              Select a file from the left to inspect its implementation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
