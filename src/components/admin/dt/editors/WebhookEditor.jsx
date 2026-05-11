import React, { useState } from "react";
import { Plus, Trash2, Play, Eye } from "lucide-react";
import EditorShell from "./_EditorShell";
import { Field, Toggle, NodePicker, CustomFieldPicker, EditorField, ScriptsEditor } from "./_primitives";
import FieldRefInput from "./_primitives/FieldRefInput";

const TABS = [
  { id: "general", label: "General" },
  { id: "request", label: "Request" },
  { id: "body", label: "Body" },
  { id: "response_mapping", label: "Response Mapping" },
  { id: "routing", label: "Routing" },
  { id: "advanced", label: "Advanced" },
  { id: "test", label: "Test" },
];

const PRESETS = {
  cloud_run_state_lookup: {
    method: "POST",
    url: "https://your-service.run.app/lookup",
    headers: [{ key: "Content-Type", value: "application/json" }],
    body_template: JSON.stringify({ state: "{state}", accident_date_bucket: "{accident_date_bucket}" }, null, 2),
    response_mappings: [
      { response_path: "data.conversion_rate", target_custom_field_key: "conversion_rate", transform: "none" },
      { response_path: "data.tier", target_custom_field_key: "tier", transform: "none" },
    ],
  },
  generic_get: {
    method: "GET",
    url: "",
    headers: [{ key: "Accept", value: "application/json" }],
    body_template: "",
    response_mappings: [],
  },
  slack_webhook: {
    method: "POST",
    url: "https://hooks.slack.com/services/...",
    headers: [{ key: "Content-Type", value: "application/json" }],
    body_template: JSON.stringify({ text: "New lead: {first_name} {last_name} - {phone}" }, null, 2),
    response_mappings: [],
  },
  ghl_push_contact: {
    method: "POST",
    url: "https://rest.gohighlevel.com/v1/contacts/",
    headers: [{ key: "Authorization", value: "Bearer YOUR_GHL_API_KEY" }, { key: "Content-Type", value: "application/json" }],
    body_template: JSON.stringify({ firstName: "{first_name}", lastName: "{last_name}", email: "{email}", phone: "{phone}", source: "decision-tree" }, null, 2),
    response_mappings: [],
  },
};

export default function WebhookEditor({ draft, updateDraft, updateConfig, allNodes, quizId }) {
  const config = draft.config || {};
  const headers = config.headers || [];
  const responseMappings = config.response_mappings || [];
  const [testSampleData, setTestSampleData] = useState("");
  const [testResponse, setTestResponse] = useState(null);
  const [testing, setTesting] = useState(false);

  const updateHeader = (idx, patch) => updateConfig({ headers: headers.map((h, i) => i === idx ? { ...h, ...patch } : h) });
  const addHeader = () => updateConfig({ headers: [...headers, { key: "", value: "" }] });
  const removeHeader = (idx) => updateConfig({ headers: headers.filter((_, i) => i !== idx) });

  const updateMapping = (idx, patch) => updateConfig({ response_mappings: responseMappings.map((m, i) => i === idx ? { ...m, ...patch } : m) });
  const addMapping = () => updateConfig({ response_mappings: [...responseMappings, { response_path: "", target_custom_field_key: "", transform: "none" }] });
  const removeMapping = (idx) => updateConfig({ response_mappings: responseMappings.filter((_, i) => i !== idx) });

  const applyPreset = (key) => {
    const preset = PRESETS[key];
    if (preset) updateConfig({ method: preset.method, url: preset.url, headers: preset.headers, body_template: preset.body_template, response_mappings: preset.response_mappings });
  };

  const runTest = async () => {
    setTesting(true);
    setTestResponse(null);
    try {
      let sampleData = {};
      try { sampleData = JSON.parse(testSampleData || "{}"); } catch { sampleData = {}; }
      let url = config.url || "";
      let body = config.body_template || "";
      Object.entries(sampleData).forEach(([k, v]) => {
        url = url.replace(new RegExp(`\\{${k}\\}`, "g"), v);
        body = body.replace(new RegExp(`\\{${k}\\}`, "g"), v);
      });
      const headerObj = {};
      (config.headers || []).forEach((h) => { if (h.key) headerObj[h.key] = h.value; });
      const opts = { method: config.method || "POST", headers: headerObj };
      if (["POST","PUT","PATCH"].includes(config.method) && body) opts.body = body;
      const res = await fetch(url, opts);
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      setTestResponse({ status: res.status, statusText: res.statusText, body: json || text });
    } catch (err) {
      setTestResponse({ error: err.message });
    }
    setTesting(false);
  };

  return (
    <EditorShell tabs={TABS}>
      {(tab) => (
        <>
          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Admin Label" value={draft.label} onChange={(v) => updateDraft({ label: v })} required />
              <Field label="Description" value={draft.help_text} onChange={(v) => updateDraft({ help_text: v })} rows={2} />
              <EditorField label="Load Preset">
                <select defaultValue="" onChange={(e) => { if (e.target.value) applyPreset(e.target.value); }}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">Select preset...</option>
                  <option value="cloud_run_state_lookup">Cloud Run State Lookup</option>
                  <option value="generic_get">Generic GET with Accept header</option>
                  <option value="slack_webhook">Slack Webhook Notification</option>
                  <option value="ghl_push_contact">GHL Push Contact</option>
                </select>
              </EditorField>
            </div>
          )}
          {tab === "request" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <EditorField label="Method" className="w-28">
                  <select value={config.method || "POST"} onChange={(e) => updateConfig({ method: e.target.value })}
                    className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm font-semibold">
                    {["GET","POST","PUT","PATCH","DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </EditorField>
                <EditorField label="URL" className="flex-1">
                  <FieldRefInput
                    value={config.url || ""}
                    onChange={(v) => updateConfig({ url: v })}
                    quizId={quizId}
                    multiline={false}
                    placeholder="https://api.example.com/endpoint"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono"
                  />
                </EditorField>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Headers</p>
                <div className="space-y-2">
                  {headers.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input value={h.key || ""} onChange={(e) => updateHeader(idx, { key: e.target.value })}
                        placeholder="Header-Name" className="flex-1 h-8 px-2 rounded border border-slate-200 bg-white text-xs font-mono" />
                      <input value={h.value || ""} onChange={(e) => updateHeader(idx, { value: e.target.value })}
                        placeholder="value" className="flex-1 h-8 px-2 rounded border border-slate-200 bg-white text-xs" />
                      <button type="button" onClick={() => removeHeader(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addHeader}
                    className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-200">
                    + Add Header
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === "body" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Use {"{field_key}"} for dynamic interpolation. Must be valid JSON for POST requests.</p>
              <FieldRefInput
                value={config.body_template || ""}
                onChange={(v) => updateConfig({ body_template: v })}
                quizId={quizId}
                multiline={true}
                rows={16}
                placeholder={'{\n  "phone": "{phone}",\n  "state": "{state}"\n}'}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-y"
              />
            </div>
          )}
          {tab === "response_mapping" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Map JSON response fields to custom fields. Use dot notation for nested paths, e.g. <span className="font-mono">data.conversion_rate</span></p>
              <div className="space-y-2">
                {responseMappings.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2 flex-wrap">
                    <input value={m.response_path || ""} onChange={(e) => updateMapping(idx, { response_path: e.target.value })}
                      placeholder="data.field_path" className="flex-1 h-8 px-2 rounded border border-slate-200 bg-white text-xs font-mono min-w-[120px]" />
                    <div className="w-40">
                      <CustomFieldPicker value={m.target_custom_field_key}
                        onChange={(v) => updateMapping(idx, { target_custom_field_key: v })} />
                    </div>
                    <select value={m.transform || "none"} onChange={(e) => updateMapping(idx, { transform: e.target.value })}
                      className="h-8 px-2 rounded border border-slate-200 bg-white text-xs">
                      {["none","lowercase","uppercase","trim","json_parse"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button type="button" onClick={() => removeMapping(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addMapping}
                className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-200">
                + Add Mapping
              </button>
            </div>
          )}
          {tab === "routing" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">These correspond to the success and failure handles on the canvas.</p>
              <EditorField label="On Success - Next Node">
                <NodePicker value={config.success_target_node_id} onChange={(v) => updateConfig({ success_target_node_id: v })} allNodes={allNodes} />
              </EditorField>
              <EditorField label="On Failure - Next Node">
                <NodePicker value={config.failure_target_node_id} onChange={(v) => updateConfig({ failure_target_node_id: v })} allNodes={allNodes} />
              </EditorField>
            </div>
          )}
          {tab === "advanced" && (
            <div className="space-y-4">
              <Field label="Timeout (ms)" type="number" value={config.timeout_ms || 8000}
                onChange={(v) => updateConfig({ timeout_ms: Number(v) })} />
              <Toggle label="Retry on failure" value={config.retry_on_failure || false}
                onChange={(v) => updateConfig({ retry_on_failure: v })} />
              {config.retry_on_failure && (
                <>
                  <Field label="Max Retries" type="number" value={config.max_retries || 2}
                    onChange={(v) => updateConfig({ max_retries: Number(v) })} />
                  <Field label="Backoff (seconds)" type="number" value={config.retry_backoff_seconds || 2}
                    onChange={(v) => updateConfig({ retry_backoff_seconds: Number(v) })} />
                </>
              )}
            </div>
          )}
          {tab === "test" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Test this webhook without creating real leads or side effects.</p>
              <EditorField label="Sample Field Values (JSON)" helper='e.g. {"state":"CA","phone":"+15551234567"}'>
                <textarea value={testSampleData} onChange={(e) => setTestSampleData(e.target.value)} rows={5}
                  placeholder='{"state": "CA"}'
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-y" />
              </EditorField>
              <button type="button" onClick={runTest} disabled={testing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">
                <Play size={13} /> {testing ? "Testing..." : "Test Webhook"}
              </button>
              {testResponse && (
                <div className="p-4 bg-slate-900 rounded-lg text-xs font-mono space-y-2 overflow-auto max-h-64">
                  {testResponse.error ? (
                    <p className="text-red-400">Error: {testResponse.error}</p>
                  ) : (
                    <>
                      <p className={`font-bold ${testResponse.status >= 200 && testResponse.status < 300 ? "text-green-400" : "text-red-400"}`}>
                        {testResponse.status} {testResponse.statusText}
                      </p>
                      <pre className="text-slate-300 whitespace-pre-wrap break-words">
                        {typeof testResponse.body === "string" ? testResponse.body : JSON.stringify(testResponse.body, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </EditorShell>
  );
}