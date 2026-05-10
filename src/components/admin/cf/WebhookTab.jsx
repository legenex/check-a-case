import React, { useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";

const DEFAULT_TEMPLATE = `{"field_values": {field_values_json}, "form_id": "{form_id}", "lead_id": "{lead_id}"}`;

export default function WebhookTab({ form, onChange }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    if (!form.submit_webhook_url) return;
    setTesting(true);
    setTestResult(null);
    try {
      const sample = { first_name: 'Test', last_name: 'User', email: 'test@example.com', phone: '5555555555' };
      const body = (form.webhook_body_template || DEFAULT_TEMPLATE)
        .replace('{field_values_json}', JSON.stringify(sample))
        .replace(/{(\w+)}/g, (_, k) => sample[k] || k);
      const res = await fetch(form.submit_webhook_url, {
        method: form.webhook_method || 'POST',
        headers: { 'Content-Type': 'application/json', ...(form.webhook_headers || {}) },
        body,
      });
      setTestResult({ status: res.status, ok: res.ok });
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Webhook URL</label>
        <input value={form.submit_webhook_url || ''}
          onChange={(e) => onChange({ submit_webhook_url: e.target.value })}
          placeholder="https://..."
          className="w-full h-8 px-2 rounded border border-input bg-background text-xs" />
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Method</label>
        <select value={form.webhook_method || 'POST'}
          onChange={(e) => onChange({ webhook_method: e.target.value })}
          className="w-full h-8 px-2 rounded border border-input bg-background text-sm">
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Body Template</label>
        <textarea
          value={form.webhook_body_template || DEFAULT_TEMPLATE}
          onChange={(e) => onChange({ webhook_body_template: e.target.value })}
          rows={6}
          className="w-full px-2 py-1.5 rounded border border-input bg-background text-[11px] font-mono resize-none"
        />
        <p className="text-[10px] text-muted-foreground mt-1">Use {"{field_key}"} for interpolation. {"{field_values_json}"} for full object.</p>
      </div>

      {form.submit_webhook_url && (
        <div>
          <button onClick={handleTest} disabled={testing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-colors">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Test Webhook
          </button>
          {testResult && (
            <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.error || `HTTP ${testResult.status}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}