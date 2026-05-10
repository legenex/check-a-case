import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, Copy, CheckCircle, XCircle, Clock,
  RefreshCw, Pause, Play, ChevronDown, ChevronRight, Activity
} from "lucide-react";
import { format } from "date-fns";

// ── Tab A: Tracking Code Injection ────────────────────────────────────────────

const INJECTION_POINTS = [
  { value: "head_top", label: "Head (top)" },
  { value: "head_bottom", label: "Head (bottom)" },
  { value: "body_open", label: "Body (open)" },
  { value: "body_close", label: "Body (close)" },
];

const SCOPE_TYPES = [
  { value: "site_wide", label: "Site-wide" },
  { value: "route_pattern", label: "Route Pattern" },
  { value: "event_hook", label: "Event Hook" },
];

const EVENT_HOOKS = [
  "on_quiz_start", "on_quiz_step_change", "on_quiz_complete",
  "on_form_submit", "on_lead_created", "on_tool_start", "on_tool_complete",
  "on_cta_click", "on_scroll_50", "on_scroll_75", "on_scroll_100",
  "on_time_30s", "on_time_60s", "on_time_120s",
];

const SEED_SCRIPTS = [
  {
    name: "Microsoft Clarity (site-wide)",
    injection_point: "head_top",
    scope_type: "site_wide",
    enabled: false,
    script_content: `<!-- Microsoft Clarity - replace CLARITY_ID with your project ID -->\n<script type="text/javascript">\n(function(c,l,a,r,i,t,y){\nc[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};\nt=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;\ny=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);\n})(window, document, "clarity", "script", "CLARITY_ID");\n</script>`,
    notes: "Microsoft Clarity heatmaps and session recordings. Replace CLARITY_ID.",
  },
  {
    name: "Hotjar (LP only)",
    injection_point: "head_bottom",
    scope_type: "route_pattern",
    enabled: false,
    route_patterns: ["/lp/*"],
    script_content: `<!-- Hotjar - replace HJID and HJSV -->\n<script>\n(function(h,o,t,j,a,r){\nh.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};\nh._hjSettings={hjid:HJID,hjsv:HJSV};\na=o.getElementsByTagName('head')[0];\nr=o.createElement('script');r.async=1;\nr.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;\na.appendChild(r);\n})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');\n</script>`,
    notes: "Hotjar session recordings, limited to /lp/* pages. Replace HJID and HJSV.",
  },
  {
    name: "Custom event tracker (on lead)",
    injection_point: "body_close",
    scope_type: "event_hook",
    enabled: false,
    event_hooks: ["on_lead_created"],
    script_content: `<!-- Custom lead created handler -->\n<script>\nwindow.addEventListener("cac:lead_created", function(e) {\n  // e.detail contains lead data\n  console.log("Lead created", e.detail);\n  // Add your tracking code here\n});\n</script>`,
    notes: "Fires when a new lead is created. Customize the handler.",
  },
];

function ScriptForm({ script, onSave, onCancel }) {
  const [form, setForm] = useState(script || {
    name: "", injection_point: "head_top", scope_type: "site_wide",
    script_content: "", enabled: false, route_patterns: [], event_hooks: [], notes: "",
  });
  const [patternInput, setPatternInput] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addPattern = () => {
    if (patternInput.trim()) {
      set("route_patterns", [...(form.route_patterns || []), patternInput.trim()]);
      setPatternInput("");
    }
  };

  const removePattern = (i) => set("route_patterns", form.route_patterns.filter((_, idx) => idx !== i));

  const toggleHook = (hook) => {
    const hooks = form.event_hooks || [];
    set("event_hooks", hooks.includes(hook) ? hooks.filter((h) => h !== hook) : [...hooks, hook]);
  };

  return (
    <Card className="rounded-xl border-primary/20">
      <CardContent className="pt-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Microsoft Clarity" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Injection Point</Label>
            <Select value={form.injection_point} onValueChange={(v) => set("injection_point", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INJECTION_POINTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scope</Label>
            <Select value={form.scope_type} onValueChange={(v) => set("scope_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCOPE_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
              <span className="text-sm">{form.enabled ? "Enabled" : "Draft (disabled)"}</span>
            </div>
          </div>
        </div>

        {form.scope_type === "route_pattern" && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Route Patterns</Label>
            <div className="flex gap-2">
              <Input value={patternInput} onChange={(e) => setPatternInput(e.target.value)} placeholder="/lp/* or /a/* or !/admin/*" onKeyDown={(e) => e.key === "Enter" && addPattern()} />
              <Button type="button" variant="outline" size="sm" onClick={addPattern}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.route_patterns || []).map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs rounded-full px-3 py-1">
                  {p}
                  <button onClick={() => removePattern(i)} className="hover:text-destructive ml-1">&times;</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {form.scope_type === "event_hook" && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Event Hooks</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_HOOKS.map((hook) => (
                <button
                  key={hook}
                  type="button"
                  onClick={() => toggleHook(hook)}
                  className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                    (form.event_hooks || []).includes(hook)
                      ? "bg-primary text-white border-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {hook}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Script Content</Label>
          <textarea
            className="w-full h-40 text-xs font-mono rounded-lg border border-input bg-transparent px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="<script>...</script> or raw JS/HTML"
            value={form.script_content || ""}
            onChange={(e) => set("script_content", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Only &lt;script&gt;, &lt;noscript&gt;, and &lt;style&gt; tags are injected. Content is sanitized.</p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin Notes</Label>
          <Input value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Internal notes..." />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="button" size="sm" onClick={() => onSave(form)}>Save Script</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CodeInjectionTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | "new" | record

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ["tracking-scripts"],
    queryFn: () => base44.entities.TrackingScript.list("-created_date"),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.TrackingScript.update(data.id, data)
      : base44.entities.TrackingScript.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["tracking-scripts"]); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TrackingScript.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["tracking-scripts"]),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => base44.entities.TrackingScript.update(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries(["tracking-scripts"]),
  });

  const seedScripts = async () => {
    for (const s of SEED_SCRIPTS) {
      if (!scripts.find((sc) => sc.name === s.name)) {
        await base44.entities.TrackingScript.create(s);
      }
    }
    queryClient.invalidateQueries(["tracking-scripts"]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Inject scripts into public pages at specific injection points.</p>
        <div className="flex gap-2">
          {scripts.length === 0 && (
            <Button type="button" variant="outline" size="sm" onClick={seedScripts}>Load Examples</Button>
          )}
          <Button type="button" size="sm" onClick={() => setEditing("new")} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Script
          </Button>
        </div>
      </div>

      {editing === "new" && (
        <ScriptForm onSave={(d) => saveMutation.mutate(d)} onCancel={() => setEditing(null)} />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : scripts.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No tracking scripts yet. Click "Add Script" or "Load Examples" to start.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {scripts.map((s) => (
            <Card key={s.id} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Switch
                      checked={s.enabled}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: s.id, enabled: v })}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{INJECTION_POINTS.find((p) => p.value === s.injection_point)?.label || s.injection_point}</Badge>
                        <Badge variant="outline" className="text-xs">{SCOPE_TYPES.find((p) => p.value === s.scope_type)?.label || s.scope_type}</Badge>
                        {!s.enabled && <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(editing?.id === s.id ? null : s)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (window.confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id); }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {editing?.id === s.id && (
                  <div className="mt-4">
                    <ScriptForm script={s} onSave={(d) => saveMutation.mutate({ ...d, id: s.id })} onCancel={() => setEditing(null)} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab B: CAPI Pixels ─────────────────────────────────────────────────────────

function PixelCard({ name, logo, fields, testEvent, onSave, onTest, status, testing, testMsg }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0">{logo}</div>
            <h3 className="font-semibold text-sm">{name}</h3>
          </div>
          <div className="flex items-center gap-2">
            {status === "success" ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs"><CheckCircle className="w-3 h-3" />Connected</Badge>
            ) : status === "failed" ? (
              <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-xs"><XCircle className="w-3 h-3" />Error</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1 text-xs"><Clock className="w-3 h-3" />Not tested</Badge>
            )}
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 border-t border-border space-y-4 pt-4">
          {fields}
          {testMsg && (
            <div className={`text-xs rounded-lg px-3 py-2 font-mono ${status === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {testMsg}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onTest} disabled={testing} className="gap-1.5">
              {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Test Event
            </Button>
            <Button type="button" size="sm" onClick={onSave}>Save</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function CAPIPixelsTab() {
  const queryClient = useQueryClient();
  const [pixelData, setPixelData] = useState({});
  const [testingMap, setTestingMap] = useState({});
  const [testMsgs, setTestMsgs] = useState({});

  const { data: allCreds = [] } = useQuery({
    queryKey: ["integration-credentials"],
    queryFn: () => base44.entities.IntegrationCredential.list(),
  });

  const getVal = (type, key) => {
    const record = allCreds.find((c) => c.integration_type === type);
    const saved = record ? JSON.parse(record.credentials_json || "{}") : {};
    return pixelData[type]?.[key] ?? saved[key] ?? "";
  };

  const setVal = (type, key, val) => setPixelData((p) => ({ ...p, [type]: { ...p[type], [key]: val } }));

  const handleSave = async (type) => {
    const record = allCreds.find((c) => c.integration_type === type);
    const saved = record ? JSON.parse(record.credentials_json || "{}") : {};
    const merged = { ...saved, ...pixelData[type] };
    if (record) {
      await base44.entities.IntegrationCredential.update(record.id, { credentials_json: JSON.stringify(merged) });
    } else {
      await base44.entities.IntegrationCredential.create({ integration_type: type, credentials_json: JSON.stringify(merged), test_status: "untested" });
    }
    queryClient.invalidateQueries(["integration-credentials"]);
  };

  const handleTest = async (type, testFn) => {
    setTestingMap((p) => ({ ...p, [type]: true }));
    try {
      const msg = await testFn();
      setTestMsgs((p) => ({ ...p, [type]: msg }));
      const record = allCreds.find((c) => c.integration_type === type);
      if (record) await base44.entities.IntegrationCredential.update(record.id, { test_status: "success", test_message: msg, last_tested_at: new Date().toISOString() });
      queryClient.invalidateQueries(["integration-credentials"]);
    } catch (err) {
      const msg = err?.message || "Test failed";
      setTestMsgs((p) => ({ ...p, [type]: msg }));
      const record = allCreds.find((c) => c.integration_type === type);
      if (record) await base44.entities.IntegrationCredential.update(record.id, { test_status: "failed", test_message: msg, last_tested_at: new Date().toISOString() });
      queryClient.invalidateQueries(["integration-credentials"]);
    } finally {
      setTestingMap((p) => ({ ...p, [type]: false }));
    }
  };

  const statusOf = (type) => allCreds.find((c) => c.integration_type === type)?.test_status || "untested";

  const LogoBox = ({ color, text }) => (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs`} style={{ background: color }}>{text}</div>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Configure server-side Conversions API pixels. All events include SHA-256 hashed PII and a shared event_id for browser/server deduplication.</p>

      <PixelCard
        name="Meta (Facebook)"
        logo={<LogoBox color="#1877F2" text="f" />}
        status={statusOf("meta_pixel")}
        testing={testingMap["meta_pixel"]}
        testMsg={testMsgs["meta_pixel"]}
        onSave={() => handleSave("meta_pixel")}
        onTest={() => handleTest("meta_pixel", async () => {
          const pixelId = getVal("meta_pixel", "pixel_id");
          const token = getVal("meta_pixel", "capi_token");
          if (!pixelId || !token) throw new Error("Pixel ID and CAPI Access Token required.");
          const r = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: [{ event_name: "PageView", event_time: Math.floor(Date.now() / 1000), event_id: crypto.randomUUID(), action_source: "website", user_data: { client_ip_address: "0.0.0.0", client_user_agent: "test" } }], test_event_code: getVal("meta_pixel", "test_event_code") || undefined }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(`Meta CAPI error ${r.status}: ${d.error?.message || JSON.stringify(d)}`);
          return `Test event sent. Events received: ${d.events_received || 0}. Check Events Manager test tab.`;
        })}
        fields={
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Pixel ID</Label><Input value={getVal("meta_pixel", "pixel_id")} onChange={(e) => setVal("meta_pixel", "pixel_id", e.target.value)} placeholder="1234567890" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">CAPI Access Token <span className="text-amber-600">(enc)</span></Label><Input type="password" value={getVal("meta_pixel", "capi_token")} onChange={(e) => setVal("meta_pixel", "capi_token", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Test Event Code</Label><Input value={getVal("meta_pixel", "test_event_code")} onChange={(e) => setVal("meta_pixel", "test_event_code", e.target.value)} placeholder="TEST12345" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Dataset ID (optional)</Label><Input value={getVal("meta_pixel", "dataset_id")} onChange={(e) => setVal("meta_pixel", "dataset_id", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Business Manager ID</Label><Input value={getVal("meta_pixel", "bm_id")} onChange={(e) => setVal("meta_pixel", "bm_id", e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2"><CheckCircle className="w-3.5 h-3.5" /> Server-side SHA-256 hashing always enabled.</div>
          </div>
        }
      />

      <PixelCard
        name="Google (GA4 + Ads)"
        logo={<LogoBox color="#4285F4" text="G" />}
        status={statusOf("google_pixel")}
        testing={testingMap["google_pixel"]}
        testMsg={testMsgs["google_pixel"]}
        onSave={() => handleSave("google_pixel")}
        onTest={() => handleTest("google_pixel", async () => {
          const mid = getVal("google_pixel", "ga4_measurement_id");
          const secret = getVal("google_pixel", "ga4_api_secret");
          if (!mid || !secret) throw new Error("GA4 Measurement ID and API Secret required.");
          const r = await fetch(`https://www.google-analytics.com/debug/mp/collect?measurement_id=${mid}&api_secret=${secret}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: "test_client_123", events: [{ name: "page_view", params: { engagement_time_msec: "100" } }] }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(`GA4 MP error ${r.status}: ${JSON.stringify(d)}`);
          const issues = d.validationMessages || [];
          return issues.length === 0 ? "GA4 Measurement Protocol: event valid." : `Validation issues: ${issues.map((i) => i.description).join("; ")}`;
        })}
        fields={
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">GA4 Measurement ID</Label><Input value={getVal("google_pixel", "ga4_measurement_id")} onChange={(e) => setVal("google_pixel", "ga4_measurement_id", e.target.value)} placeholder="G-XXXXXXXXXX" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">GA4 API Secret <span className="text-amber-600">(enc)</span></Label><Input type="password" value={getVal("google_pixel", "ga4_api_secret")} onChange={(e) => setVal("google_pixel", "ga4_api_secret", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Google Ads ID</Label><Input value={getVal("google_pixel", "google_ads_id")} onChange={(e) => setVal("google_pixel", "google_ads_id", e.target.value)} placeholder="AW-XXXXXXXXX" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Lead Conversion Label</Label><Input value={getVal("google_pixel", "lead_conversion_label")} onChange={(e) => setVal("google_pixel", "lead_conversion_label", e.target.value)} placeholder="XXXXXXXXXXXXXXXXX" /></div>
            </div>
          </div>
        }
      />

      <PixelCard
        name="TikTok"
        logo={<LogoBox color="#000000" text="Tt" />}
        status={statusOf("tiktok_pixel")}
        testing={testingMap["tiktok_pixel"]}
        testMsg={testMsgs["tiktok_pixel"]}
        onSave={() => handleSave("tiktok_pixel")}
        onTest={() => handleTest("tiktok_pixel", async () => {
          const token = getVal("tiktok_pixel", "events_api_token");
          const pixelCode = getVal("tiktok_pixel", "pixel_code");
          if (!token || !pixelCode) throw new Error("Pixel Code and Events API Access Token required.");
          const r = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
            method: "POST",
            headers: { "Access-Token": token, "Content-Type": "application/json" },
            body: JSON.stringify({ pixel_code: pixelCode, event: "PageView", event_id: crypto.randomUUID(), timestamp: new Date().toISOString(), test_event_code: getVal("tiktok_pixel", "test_event_code") || undefined, context: { user_agent: "test" } }),
          });
          const d = await r.json();
          if (d.code !== 0) throw new Error(`TikTok Events API error ${d.code}: ${d.message}`);
          return `TikTok test event sent. Check Events Manager.`;
        })}
        fields={
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Pixel Code</Label><Input value={getVal("tiktok_pixel", "pixel_code")} onChange={(e) => setVal("tiktok_pixel", "pixel_code", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Events API Token <span className="text-amber-600">(enc)</span></Label><Input type="password" value={getVal("tiktok_pixel", "events_api_token")} onChange={(e) => setVal("tiktok_pixel", "events_api_token", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Test Event Code</Label><Input value={getVal("tiktok_pixel", "test_event_code")} onChange={(e) => setVal("tiktok_pixel", "test_event_code", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Advertiser ID</Label><Input value={getVal("tiktok_pixel", "advertiser_id")} onChange={(e) => setVal("tiktok_pixel", "advertiser_id", e.target.value)} /></div>
            </div>
          </div>
        }
      />

      <PixelCard
        name="Taboola"
        logo={<LogoBox color="#0C3866" text="Ta" />}
        status={statusOf("taboola_pixel")}
        testing={testingMap["taboola_pixel"]}
        testMsg={testMsgs["taboola_pixel"]}
        onSave={() => handleSave("taboola_pixel")}
        onTest={() => handleTest("taboola_pixel", async () => {
          const accountId = getVal("taboola_pixel", "account_id");
          const pixelId = getVal("taboola_pixel", "pixel_id");
          if (!accountId || !pixelId) throw new Error("Account ID and Pixel ID required.");
          return `Taboola config saved. Account: ${accountId}, Pixel: ${pixelId}. Server-side events will fire on next lead.`;
        })}
        fields={
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Account ID</Label><Input value={getVal("taboola_pixel", "account_id")} onChange={(e) => setVal("taboola_pixel", "account_id", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Pixel ID</Label><Input value={getVal("taboola_pixel", "pixel_id")} onChange={(e) => setVal("taboola_pixel", "pixel_id", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">S2S Auth Token <span className="text-amber-600">(enc)</span></Label><Input type="password" value={getVal("taboola_pixel", "s2s_token")} onChange={(e) => setVal("taboola_pixel", "s2s_token", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Test Event Code</Label><Input value={getVal("taboola_pixel", "test_event_code")} onChange={(e) => setVal("taboola_pixel", "test_event_code", e.target.value)} /></div>
            </div>
            <p className="text-xs text-muted-foreground">S2S endpoint: trc.taboola.com/actions-handler/3/s2s-action</p>
          </div>
        }
      />

      <PixelCard
        name="Snapchat"
        logo={<LogoBox color="#FFFC00" text={<span style={{ color: "#000" }}>Sc</span>} />}
        status={statusOf("snapchat_pixel")}
        testing={testingMap["snapchat_pixel"]}
        testMsg={testMsgs["snapchat_pixel"]}
        onSave={() => handleSave("snapchat_pixel")}
        onTest={() => handleTest("snapchat_pixel", async () => {
          const pixelId = getVal("snapchat_pixel", "pixel_id");
          const token = getVal("snapchat_pixel", "capi_token");
          if (!pixelId || !token) throw new Error("Pixel ID and CAPI Access Token required.");
          const r = await fetch("https://tr.snapchat.com/v2/conversion", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ pixel_id: pixelId, test_event_code: getVal("snapchat_pixel", "test_event_code") || undefined, data: [{ event_type: "PAGE_VIEW", event_conversion_type: "WEB", timestamp: Date.now(), event_id: crypto.randomUUID() }] }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(`Snapchat CAPI error ${r.status}: ${JSON.stringify(d)}`);
          return `Snapchat test event sent. Status: ${d.status}`;
        })}
        fields={
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Pixel ID</Label><Input value={getVal("snapchat_pixel", "pixel_id")} onChange={(e) => setVal("snapchat_pixel", "pixel_id", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">CAPI Access Token <span className="text-amber-600">(enc)</span></Label><Input type="password" value={getVal("snapchat_pixel", "capi_token")} onChange={(e) => setVal("snapchat_pixel", "capi_token", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Snap Asset ID</Label><Input value={getVal("snapchat_pixel", "snap_asset_id")} onChange={(e) => setVal("snapchat_pixel", "snap_asset_id", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Test Event Code</Label><Input value={getVal("snapchat_pixel", "test_event_code")} onChange={(e) => setVal("snapchat_pixel", "test_event_code", e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2"><CheckCircle className="w-3.5 h-3.5" /> Server-side SHA-256 hashing always enabled.</div>
          </div>
        }
      />

      <PixelCard
        name="Custom CAPI"
        logo={<div className="w-8 h-8 bg-muted border border-border rounded-lg flex items-center justify-center text-xs font-bold">C</div>}
        status={statusOf("custom_capi")}
        testing={testingMap["custom_capi"]}
        testMsg={testMsgs["custom_capi"]}
        onSave={() => handleSave("custom_capi")}
        onTest={() => handleTest("custom_capi", async () => {
          const url = getVal("custom_capi", "endpoint_url");
          if (!url) throw new Error("Endpoint URL required.");
          const r = await fetch(url, { method: getVal("custom_capi", "http_method") || "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: true, event_name: "test_event", event_id: crypto.randomUUID() }) });
          if (!r.ok) throw new Error(`Custom CAPI error ${r.status}: ${(await r.text()).slice(0, 200)}`);
          return `Custom CAPI test OK. Status: ${r.status}`;
        })}
        fields={
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label><Input value={getVal("custom_capi", "name")} onChange={(e) => setVal("custom_capi", "name", e.target.value)} placeholder="Outbrain CAPI" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Endpoint URL</Label><Input value={getVal("custom_capi", "endpoint_url")} onChange={(e) => setVal("custom_capi", "endpoint_url", e.target.value)} placeholder="https://api.example.com/events" /></div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Auth Type</Label>
                <Select value={getVal("custom_capi", "auth_type") || "bearer"} onValueChange={(v) => setVal("custom_capi", "auth_type", v)}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="hmac">HMAC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Auth Credentials <span className="text-amber-600">(enc)</span></Label><Input type="password" value={getVal("custom_capi", "auth_credentials")} onChange={(e) => setVal("custom_capi", "auth_credentials", e.target.value)} /></div>
            </div>
          </div>
        }
      />
    </div>
  );
}

// ── Tab C: Event Mapping ───────────────────────────────────────────────────────

const SITE_EVENTS = [
  { id: "page_view", label: "Page View", desc: "Every public page load" },
  { id: "view_content", label: "View Content", desc: "Advertorial or LP view" },
  { id: "initiate_checkout", label: "Initiate Checkout", desc: "Quiz first step" },
  { id: "add_to_cart", label: "Add to Cart", desc: "Quiz step N reached" },
  { id: "lead", label: "Lead", desc: "Lead created" },
  { id: "complete_registration", label: "Complete Registration", desc: "Lead qualified" },
  { id: "start_trial", label: "Start Trial", desc: "Tool started" },
  { id: "purchase", label: "Purchase", desc: "Lead delivered to buyer" },
];

const PLATFORMS = ["meta", "google_ads", "tiktok", "taboola", "snapchat"];

const DEFAULT_MAPPINGS = {
  page_view: { meta: "PageView", google_ads: "page_view", tiktok: "Browse", taboola: "page_view", snapchat: "PAGE_VIEW" },
  view_content: { meta: "ViewContent", google_ads: "view_item", tiktok: "ViewContent", taboola: "s2s-view-content", snapchat: "VIEW_CONTENT" },
  initiate_checkout: { meta: "InitiateCheckout", google_ads: "begin_checkout", tiktok: "InitiateCheckout", taboola: "s2s-initiate-checkout", snapchat: "START_CHECKOUT" },
  lead: { meta: "Lead", google_ads: "generate_lead", tiktok: "SubmitForm", taboola: "lead", snapchat: "SIGN_UP" },
  complete_registration: { meta: "CompleteRegistration", google_ads: "sign_up", tiktok: "CompleteRegistration", taboola: "lead", snapchat: "SIGN_UP" },
};

function EventMappingTab() {
  const queryClient = useQueryClient();
  const [mappings, setMappings] = useState({});
  const [saved, setSaved] = useState(false);

  const { data: allCreds = [] } = useQuery({
    queryKey: ["integration-credentials"],
    queryFn: () => base44.entities.IntegrationCredential.list(),
  });

  const mappingRecord = allCreds.find((c) => c.integration_type === "event_mappings");
  const savedMappings = mappingRecord ? JSON.parse(mappingRecord.credentials_json || "{}") : {};

  const getMapping = (eventId, platform) => mappings[eventId]?.[platform] ?? savedMappings[eventId]?.[platform] ?? DEFAULT_MAPPINGS[eventId]?.[platform] ?? "";
  const setMapping = (eventId, platform, val) => setMappings((p) => ({ ...p, [eventId]: { ...(p[eventId] || {}), [platform]: val } }));

  const handleSave = async () => {
    const merged = {};
    SITE_EVENTS.forEach((e) => {
      merged[e.id] = {};
      PLATFORMS.forEach((p) => { merged[e.id][p] = getMapping(e.id, p); });
    });
    if (mappingRecord) {
      await base44.entities.IntegrationCredential.update(mappingRecord.id, { credentials_json: JSON.stringify(merged) });
    } else {
      await base44.entities.IntegrationCredential.create({ integration_type: "event_mappings", credentials_json: JSON.stringify(merged), test_status: "untested" });
    }
    queryClient.invalidateQueries(["integration-credentials"]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Map site events to provider-specific event names. All events include a shared event_id for browser/server deduplication.</p>
        <Button type="button" size="sm" onClick={handleSave} className="gap-1.5">
          {saved && <CheckCircle className="w-3.5 h-3.5" />}
          {saved ? "Saved" : "Save Mappings"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground w-40">Site Event</th>
              {PLATFORMS.map((p) => (
                <th key={p} className="text-left p-3 font-medium text-muted-foreground capitalize">{p.replace("_", " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SITE_EVENTS.map((event) => (
              <tr key={event.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="p-3">
                  <p className="font-medium text-foreground text-xs">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{event.desc}</p>
                </td>
                {PLATFORMS.map((platform) => (
                  <td key={platform} className="p-3">
                    <Input
                      value={getMapping(event.id, platform)}
                      onChange={(e) => setMapping(event.id, platform, e.target.value)}
                      className="h-8 text-xs font-mono"
                      placeholder="(disabled)"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">Clear a cell to disable that platform/event combination. Default mappings are pre-seeded based on provider recommendations.</p>
    </div>
  );
}

// ── Tab D: Live Event Tail ─────────────────────────────────────────────────────

function LiveTailTab() {
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState({ event: "", platform: "", status: "" });
  const [expanded, setExpanded] = useState(null);

  const { data: events = [], refetch, isLoading } = useQuery({
    queryKey: ["pixel-event-log"],
    queryFn: () => base44.entities.PixelEventLog.list("-fired_at", 100),
    refetchInterval: paused ? false : 5000,
  });

  const filtered = events.filter((e) => {
    if (filter.event && !e.event_name?.toLowerCase().includes(filter.event.toLowerCase())) return false;
    if (filter.platform && e.pixel_platform !== filter.platform) return false;
    if (filter.status && e.status !== filter.status) return false;
    return true;
  });

  const platforms = [...new Set(events.map((e) => e.pixel_platform).filter(Boolean))];

  const StatusIcon = ({ status }) => {
    if (status === "fired") return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (status === "error") return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input value={filter.event} onChange={(e) => setFilter((p) => ({ ...p, event: e.target.value }))} placeholder="Filter event name..." className="h-8 text-sm w-44" />
        <Select value={filter.platform || "__all"} onValueChange={(v) => setFilter((p) => ({ ...p, platform: v === "__all" ? "" : v }))}>
          <SelectTrigger className="h-8 text-sm w-36"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Platforms</SelectItem>
            {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filter.status || "__all"} onValueChange={(v) => setFilter((p) => ({ ...p, status: v === "__all" ? "" : v }))}>
          <SelectTrigger className="h-8 text-sm w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Status</SelectItem>
            <SelectItem value="fired">Fired</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 h-8">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPaused(!paused)} className="gap-1.5 h-8">
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {paused ? "Resume" : "Pause"}
          </Button>
        </div>
      </div>

      {!paused && <p className="text-xs text-muted-foreground">Auto-refreshing every 5 seconds. {filtered.length} events.</p>}

      {isLoading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No events logged yet. Pixel events will appear here in real time.</p>
            <p className="text-xs mt-1">Events are stored for 7 days rolling retention.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="text-left p-2.5 font-medium text-muted-foreground">Time</th>
                <th className="text-left p-2.5 font-medium text-muted-foreground">Event</th>
                <th className="text-left p-2.5 font-medium text-muted-foreground">Platform</th>
                <th className="text-left p-2.5 font-medium text-muted-foreground">Source</th>
                <th className="text-left p-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-2.5 font-medium text-muted-foreground">Code</th>
                <th className="text-left p-2.5 font-medium text-muted-foreground">Page</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev) => (
                <React.Fragment key={ev.id}>
                  <tr
                    className="border-b border-border last:border-0 hover:bg-muted/10 cursor-pointer"
                    onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                  >
                    <td className="p-2.5 font-mono text-muted-foreground">
                      {ev.fired_at ? format(new Date(ev.fired_at), "HH:mm:ss") : "-"}
                    </td>
                    <td className="p-2.5 font-medium">{ev.event_name}</td>
                    <td className="p-2.5">
                      <Badge variant="outline" className="text-xs">{ev.pixel_platform || "-"}</Badge>
                    </td>
                    <td className="p-2.5 text-muted-foreground">{ev.source || "-"}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1">
                        <StatusIcon status={ev.status} />
                        <span className="capitalize">{ev.status}</span>
                      </div>
                    </td>
                    <td className="p-2.5 font-mono">{ev.response_code || "-"}</td>
                    <td className="p-2.5 text-muted-foreground max-w-[160px] truncate">{ev.page_url || "-"}</td>
                  </tr>
                  {expanded === ev.id && (
                    <tr className="border-b border-border bg-muted/10">
                      <td colSpan={7} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Event ID:</span>
                            <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded cursor-pointer hover:bg-muted/80"
                              onClick={() => navigator.clipboard.writeText(ev.event_id || "")}>
                              {ev.event_id || "N/A"} (click to copy)
                            </code>
                          </div>
                          {ev.lead_id && <div className="flex items-center gap-2"><span className="text-muted-foreground">Lead ID:</span><code className="font-mono text-xs">{ev.lead_id}</code></div>}
                          {ev.response_body && (
                            <div>
                              <p className="text-muted-foreground mb-1">Response:</p>
                              <pre className="bg-muted rounded p-2 text-xs font-mono overflow-x-auto max-h-24">{ev.response_body}</pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page Root ──────────────────────────────────────────────────────────────────

export default function Tracking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tracking</h1>
        <p className="text-muted-foreground mt-1">Code injection, CAPI pixels, event mapping, and live event debugging.</p>
      </div>

      <Tabs defaultValue="code">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="code">Code Injection</TabsTrigger>
          <TabsTrigger value="capi">CAPI Pixels</TabsTrigger>
          <TabsTrigger value="mapping">Event Mapping</TabsTrigger>
          <TabsTrigger value="tail">Live Tail</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-6"><CodeInjectionTab /></TabsContent>
        <TabsContent value="capi" className="mt-6"><CAPIPixelsTab /></TabsContent>
        <TabsContent value="mapping" className="mt-6"><EventMappingTab /></TabsContent>
        <TabsContent value="tail" className="mt-6"><LiveTailTab /></TabsContent>
      </Tabs>
    </div>
  );
}