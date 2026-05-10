import React, { useState } from "react";
import { Plus, Trash2, Play } from "lucide-react";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function WebhookTab({ node, onUpdate }) {
  const config = node.config || {};
  const headers = config.headers || [];
  const mapping = config.response_field_mapping || [];
  const [testOpen, setTestOpen] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const update = (patch) => onUpdate({ config: { ...config, ...patch } });

  const applyPreset = () => {
    update({
      method: "POST",
      url: "",
      headers: [{ key: "Content-Type", value: "application/json" }],
      body_template: '{"state":"{state}","accident_date_bucket":"{accident_date_bucket}"}',
    });
  };

  const runTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(config.url, {
        method: config.method || "POST",
        headers: Object.fromEntries((config.headers || []).map((h) => [h.key, h.value])),
        body: ["GET", "DELETE"].includes(config.method) ? undefined : config.body_template || "",
      });
      const text = await res.text();
      setTestResult({ status: res.status, body: text });
    } catch (err) {
      setTestResult({ error: err.message });
    }
    setTestLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Webhook / API</h3>
        <button onClick={applyPreset} className="text-xs text-blue-600 hover:underline">Cloud Run preset</button>
      </div>

      <div className="flex gap-2">
        <select value={config.method || "POST"}
          onChange={(e) => update({ method: e.target.value })}
          className="h-8 px-2 rounded border border-slate-200 bg-white text-sm w-24">
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input value={config.url || ""}
          onChange={(e) => update({ url: e.target.value })}
          placeholder="https://..."
          className="flex-1 h-8 px-2 rounded border border-slate-200 bg-white text-sm font-mono" />
      </div>

      <div>
        <label className="text-xs text-slate-500">Timeout (ms)</label>
        <input type="number" value={config.timeout_ms || 8000}
          onChange={(e) => update({ timeout_ms: Number(e.target.value) })}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-slate-500">Headers</label>
          <button onClick={() => update({ headers: [...headers, { key: "", value: "" }] })}
            className="text-[10px] text-blue-600 hover:underline">+ Add</button>
        </div>
        {headers.map((h, idx) => (
          <div key={idx} className="flex gap-1.5 mb-1">
            <input value={h.key} placeholder="Key"
              onChange={(e) => update({ headers: headers.map((x, i) => i === idx ? { ...x, key: e.target.value } : x) })}
              className="flex-1 h-7 px-2 rounded border border-slate-200 bg-white text-xs" />
            <input value={h.value} placeholder="Value"
              onChange={(e) => update({ headers: headers.map((x, i) => i === idx ? { ...x, value: e.target.value } : x) })}
              className="flex-1 h-7 px-2 rounded border border-slate-200 bg-white text-xs" />
            <button onClick={() => update({ headers: headers.filter((_, i) => i !== idx) })}
              className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs text-slate-500">Body Template (use {"{field_key}"} interpolation)</label>
        <textarea value={config.body_template || ""} rows={4}
          onChange={(e) => update({ body_template: e.target.value })}
          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs font-mono resize-y mt-0.5" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-slate-500">Response Field Mapping</label>
          <button onClick={() => update({ response_field_mapping: [...mapping, { response_path: "", target_custom_field_id: "" }] })}
            className="text-[10px] text-blue-600 hover:underline">+ Add</button>
        </div>
        {mapping.map((m, idx) => (
          <div key={idx} className="flex gap-1.5 mb-1">
            <input value={m.response_path} placeholder="response.path"
              onChange={(e) => update({ response_field_mapping: mapping.map((x, i) => i === idx ? { ...x, response_path: e.target.value } : x) })}
              className="flex-1 h-7 px-2 rounded border border-slate-200 bg-white text-xs font-mono" />
            <input value={m.target_custom_field_id} placeholder="field_key"
              onChange={(e) => update({ response_field_mapping: mapping.map((x, i) => i === idx ? { ...x, target_custom_field_id: e.target.value } : x) })}
              className="flex-1 h-7 px-2 rounded border border-slate-200 bg-white text-xs" />
            <button onClick={() => update({ response_field_mapping: mapping.filter((_, i) => i !== idx) })}
              className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      <button onClick={() => setTestOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded border border-blue-300 text-sm text-blue-600 hover:bg-blue-50 transition-colors">
        <Play size={13} /> Test Webhook
      </button>

      {testOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Test Webhook (TEST MODE - no leads created)</h3>
              <button onClick={() => setTestOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">&times;</button>
            </div>
            <p className="text-xs text-slate-500">URL: <span className="font-mono">{config.url || "(empty)"}</span></p>
            <button onClick={runTest} disabled={testLoading || !config.url}
              className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-40">
              <Play size={13} /> {testLoading ? "Running..." : "Run Test"}
            </button>
            {testResult && (
              <div className="bg-slate-900 text-green-300 rounded-lg p-3 text-xs font-mono overflow-auto max-h-48">
                {testResult.error ? (
                  <span className="text-red-400">{testResult.error}</span>
                ) : (
                  <>
                    <div className="text-slate-400">HTTP {testResult.status}</div>
                    <pre className="mt-1 whitespace-pre-wrap">{testResult.body}</pre>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}