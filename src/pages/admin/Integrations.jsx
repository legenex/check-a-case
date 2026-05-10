import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plug, CheckCircle } from "lucide-react";
import IntegrationCard from "@/components/admin/integrations/IntegrationCard";
import CredentialField from "@/components/admin/integrations/CredentialField";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIntegration(type, allCreds) {
  const record = allCreds.find((c) => c.integration_type === type);
  const creds = record ? JSON.parse(record.credentials_json || "{}") : {};
  return { record, creds };
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function StripeIcon() {
  return (
    <div className="w-8 h-8 bg-[#635BFF] rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">S</span>
    </div>
  );
}

function TwilioIcon() {
  return (
    <div className="w-8 h-8 bg-[#F22F46] rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-xs">Tw</span>
    </div>
  );
}

function AnthropicIcon() {
  return (
    <div className="w-8 h-8 bg-[#CC785C] rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-xs">A</span>
    </div>
  );
}

function OpenAIIcon() {
  return (
    <div className="w-8 h-8 bg-[#10A37F] rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-xs">AI</span>
    </div>
  );
}

function RingbaIcon() {
  return (
    <div className="w-8 h-8 bg-[#005AFF] rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-xs">R</span>
    </div>
  );
}

function GHLIcon() {
  return (
    <div className="w-8 h-8 bg-[#FF7A00] rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-xs">GHL</span>
    </div>
  );
}

function BigQueryIcon() {
  return (
    <div className="w-8 h-8 bg-[#4285F4] rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-xs">BQ</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Integrations() {
  const queryClient = useQueryClient();
  const [localCreds, setLocalCreds] = useState({});
  const [testingMap, setTestingMap] = useState({});
  const [testMessages, setTestMessages] = useState({});

  const { data: allCreds = [] } = useQuery({
    queryKey: ["integration-credentials"],
    queryFn: () => base44.entities.IntegrationCredential.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ type, creds, enabled, settings }) => {
      const existing = allCreds.find((c) => c.integration_type === type);
      const payload = {
        integration_type: type,
        enabled: enabled ?? existing?.enabled ?? false,
        credentials_json: JSON.stringify(creds),
        settings: settings || existing?.settings || {},
      };
      if (existing) {
        return base44.entities.IntegrationCredential.update(existing.id, payload);
      }
      return base44.entities.IntegrationCredential.create(payload);
    },
    onSuccess: () => queryClient.invalidateQueries(["integration-credentials"]),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ type, enabled }) => {
      const existing = allCreds.find((c) => c.integration_type === type);
      if (existing) {
        return base44.entities.IntegrationCredential.update(existing.id, { enabled });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(["integration-credentials"]),
  });

  const getLocal = (type) => localCreds[type] || {};
  const setField = (type, key, val) => {
    setLocalCreds((prev) => ({ ...prev, [type]: { ...prev[type], [key]: val } }));
  };

  const getMergedCreds = (type) => {
    const { creds } = getIntegration(type, allCreds);
    return { ...creds, ...getLocal(type) };
  };

  const handleSave = (type, extraSettings) => {
    const existing = allCreds.find((c) => c.integration_type === type);
    const existingCreds = existing ? JSON.parse(existing.credentials_json || "{}") : {};
    const merged = { ...existingCreds, ...getLocal(type) };
    saveMutation.mutate({ type, creds: merged, settings: extraSettings });
  };

  const handleTest = async (type, testFn) => {
    setTestingMap((p) => ({ ...p, [type]: true }));
    setTestMessages((p) => ({ ...p, [type]: null }));
    try {
      const msg = await testFn();
      setTestMessages((p) => ({ ...p, [type]: msg }));
      const existing = allCreds.find((c) => c.integration_type === type);
      if (existing) {
        await base44.entities.IntegrationCredential.update(existing.id, {
          test_status: "success",
          test_message: msg,
          last_tested_at: new Date().toISOString(),
        });
      }
      queryClient.invalidateQueries(["integration-credentials"]);
    } catch (err) {
      const msg = err?.message || "Test failed";
      setTestMessages((p) => ({ ...p, [type]: msg }));
      const existing = allCreds.find((c) => c.integration_type === type);
      if (existing) {
        await base44.entities.IntegrationCredential.update(existing.id, {
          test_status: "failed",
          test_message: msg,
          last_tested_at: new Date().toISOString(),
        });
      }
      queryClient.invalidateQueries(["integration-credentials"]);
    } finally {
      setTestingMap((p) => ({ ...p, [type]: false }));
    }
  };

  const cardProps = (type) => {
    const record = allCreds.find((c) => c.integration_type === type);
    return {
      status: record?.test_status || "untested",
      lastTested: record?.last_tested_at,
      enabled: record?.enabled || false,
      onToggle: (val) => toggleMutation.mutate({ type, enabled: val }),
      testing: testingMap[type] || false,
      testMessage: testMessages[type],
      onSave: () => handleSave(type),
    };
  };

  const getCredValue = (type, key) => {
    const record = allCreds.find((c) => c.integration_type === type);
    const saved = record ? JSON.parse(record.credentials_json || "{}") : {};
    return getLocal(type)?.[key] ?? saved[key] ?? "";
  };

  const connectedCount = allCreds.filter((c) => c.test_status === "success" && c.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground mt-1">Connect external services. Credentials are encrypted at rest.</p>
        </div>
        <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
          <CheckCircle className="w-3.5 h-3.5" />
          {connectedCount} connected
        </Badge>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="existing">Existing (9)</TabsTrigger>
          <TabsTrigger value="new">New Integrations (10)</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="mt-4">
          <div className="rounded-xl border border-border bg-muted/30 p-6 text-center text-muted-foreground">
            <Plug className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-medium">Existing integrations</p>
            <p className="text-sm mt-1">Google Search Console, Google Analytics, Meta Ads, Google Tag Manager, Email SMTP, Slack, Custom Webhooks, TrustedForm, HLR Lookup are managed via the IntegrationConfig entity and are already configured.</p>
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-4 space-y-4">

          {/* Gmail */}
          <IntegrationCard
            icon={<GoogleIcon />}
            name="Gmail"
            description="Send transactional emails through admin Gmail account. Requires OAuth 2.0."
            {...cardProps("gmail")}
            onTest={() => handleTest("gmail", async () => {
              const token = getCredValue("gmail", "access_token");
              if (!token) throw new Error("No access token. Complete OAuth flow first.");
              const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
                headers: { Authorization: `Bearer ${token}` },
              });
              const d = await r.json();
              if (!r.ok) throw new Error(`Gmail API error ${r.status}: ${d.error?.message || JSON.stringify(d)}`);
              return `Connected as ${d.emailAddress}`;
            })}
            onSave={() => handleSave("gmail")}
          >
            <div className="space-y-3">
              <CredentialField label="OAuth Client ID" fieldKey="client_id" value={getCredValue("gmail", "client_id")} onChange={(k, v) => setField("gmail", k, v)} placeholder="*.apps.googleusercontent.com" />
              <CredentialField label="OAuth Client Secret" fieldKey="client_secret" value={getCredValue("gmail", "client_secret")} onChange={(k, v) => setField("gmail", k, v)} secret />
              <CredentialField label="Refresh Token" fieldKey="refresh_token" value={getCredValue("gmail", "refresh_token")} onChange={(k, v) => setField("gmail", k, v)} secret hint="Obtained after completing the OAuth consent flow." />
              <CredentialField label="Sender Email" fieldKey="sender_email" value={getCredValue("gmail", "sender_email")} onChange={(k, v) => setField("gmail", k, v)} placeholder="you@gmail.com" />
              <CredentialField label="Test Send To" fieldKey="test_email" value={getCredValue("gmail", "test_email")} onChange={(k, v) => setField("gmail", k, v)} placeholder="test@example.com" hint="Address used for Test Connection." />
              <p className="text-xs text-muted-foreground bg-blue-50 rounded-lg p-3">Required scopes: <code className="text-blue-700">gmail.send</code>, <code className="text-blue-700">gmail.readonly</code>. Configure OAuth at console.cloud.google.com.</p>
            </div>
          </IntegrationCard>

          {/* Google Sheets */}
          <IntegrationCard
            icon={<GoogleIcon />}
            name="Google Sheets"
            description="Write leads to a Google Sheet in real time. Read config mappings from sheets."
            {...cardProps("google_sheets")}
            onTest={() => handleTest("google_sheets", async () => {
              const sheetId = getCredValue("google_sheets", "sheet_id");
              const token = getCredValue("google_sheets", "access_token");
              if (!sheetId || !token) throw new Error("Sheet ID and access token required.");
              const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z1`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const d = await r.json();
              if (!r.ok) throw new Error(`Sheets API error ${r.status}: ${d.error?.message || JSON.stringify(d)}`);
              const headers = d.values?.[0] || [];
              return `Connected. Header row: ${headers.join(", ") || "(empty)"}`;
            })}
            onSave={() => handleSave("google_sheets")}
          >
            <div className="space-y-3">
              <CredentialField label="OAuth Client ID" fieldKey="client_id" value={getCredValue("google_sheets", "client_id")} onChange={(k, v) => setField("google_sheets", k, v)} />
              <CredentialField label="OAuth Client Secret" fieldKey="client_secret" value={getCredValue("google_sheets", "client_secret")} onChange={(k, v) => setField("google_sheets", k, v)} secret />
              <CredentialField label="Refresh Token" fieldKey="refresh_token" value={getCredValue("google_sheets", "refresh_token")} onChange={(k, v) => setField("google_sheets", k, v)} secret />
              <CredentialField label="Sheet ID" fieldKey="sheet_id" value={getCredValue("google_sheets", "sheet_id")} onChange={(k, v) => setField("google_sheets", k, v)} hint="From the Google Sheets URL: /spreadsheets/d/{SHEET_ID}/edit" />
              <CredentialField label="Tab Name" fieldKey="tab_name" value={getCredValue("google_sheets", "tab_name")} onChange={(k, v) => setField("google_sheets", k, v)} placeholder="Sheet1" />
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trigger Event</Label>
                <Select value={getCredValue("google_sheets", "trigger_event") || "lead.created"} onValueChange={(v) => setField("google_sheets", "trigger_event", v)}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead.created">lead.created</SelectItem>
                    <SelectItem value="lead.qualified">lead.qualified</SelectItem>
                    <SelectItem value="quiz.completed">quiz.completed</SelectItem>
                    <SelectItem value="tool.completed">tool.completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </IntegrationCard>

          {/* Stripe */}
          <IntegrationCard
            icon={<StripeIcon />}
            name="Stripe"
            description="Process payments for consultations or premium tools. Optional - only configure if selling paid services."
            {...cardProps("stripe")}
            onTest={() => handleTest("stripe", async () => {
              const key = getCredValue("stripe", "secret_key");
              if (!key) throw new Error("Secret key required.");
              const r = await fetch("https://api.stripe.com/v1/balance", {
                headers: { Authorization: `Bearer ${key}` },
              });
              const d = await r.json();
              if (!r.ok) throw new Error(`Stripe error ${r.status}: ${d.error?.message || JSON.stringify(d)}`);
              const avail = d.available?.[0];
              return `Connected. Balance: ${avail ? (avail.amount / 100).toFixed(2) + " " + avail.currency.toUpperCase() : "OK"}`;
            })}
            onSave={() => handleSave("stripe")}
          >
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mode</Label>
                <div className="flex gap-3 text-sm">
                  {["test", "live"].map((m) => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="stripe_mode" checked={(getCredValue("stripe", "mode") || "test") === m} onChange={() => setField("stripe", "mode", m)} />
                      <span className="capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <CredentialField label="Publishable Key" fieldKey="publishable_key" value={getCredValue("stripe", "publishable_key")} onChange={(k, v) => setField("stripe", k, v)} placeholder="pk_live_..." />
              <CredentialField label="Secret Key" fieldKey="secret_key" value={getCredValue("stripe", "secret_key")} onChange={(k, v) => setField("stripe", k, v)} secret placeholder="sk_live_..." />
              <CredentialField label="Webhook Signing Secret" fieldKey="webhook_secret" value={getCredValue("stripe", "webhook_secret")} onChange={(k, v) => setField("stripe", k, v)} secret placeholder="whsec_..." />
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3">Stripe is optional. Only configure if you sell paid services on the site.</p>
            </div>
          </IntegrationCard>

          {/* Twilio */}
          <IntegrationCard
            icon={<TwilioIcon />}
            name="Twilio"
            description="Send SMS to leads and admins. Manage call tracking numbers provisioned through Twilio."
            {...cardProps("twilio")}
            onTest={() => handleTest("twilio", async () => {
              const sid = getCredValue("twilio", "account_sid");
              const token = getCredValue("twilio", "auth_token");
              if (!sid || !token) throw new Error("Account SID and Auth Token required.");
              const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
                headers: { Authorization: "Basic " + btoa(`${sid}:${token}`) },
              });
              const d = await r.json();
              if (!r.ok) throw new Error(`Twilio error ${r.status}: ${d.message || JSON.stringify(d)}`);
              return `Connected. Account: ${d.friendly_name} (${d.status})`;
            })}
            onSave={() => handleSave("twilio")}
          >
            <div className="space-y-3">
              <CredentialField label="Account SID" fieldKey="account_sid" value={getCredValue("twilio", "account_sid")} onChange={(k, v) => setField("twilio", k, v)} placeholder="AC..." />
              <CredentialField label="Auth Token" fieldKey="auth_token" value={getCredValue("twilio", "auth_token")} onChange={(k, v) => setField("twilio", k, v)} secret />
              <CredentialField label="Default From Number" fieldKey="from_number" value={getCredValue("twilio", "from_number")} onChange={(k, v) => setField("twilio", k, v)} placeholder="+15005550006" hint="Must be a Twilio-verified number." />
              <CredentialField label="Messaging Service SID" fieldKey="messaging_service_sid" value={getCredValue("twilio", "messaging_service_sid")} onChange={(k, v) => setField("twilio", k, v)} placeholder="MG... (optional)" />
            </div>
          </IntegrationCard>

          {/* Anthropic */}
          <IntegrationCard
            icon={<AnthropicIcon />}
            name="Claude (Anthropic)"
            description="Use your own Anthropic API key for AI generation, bypassing Base44 built-in quotas."
            {...cardProps("anthropic")}
            onTest={() => handleTest("anthropic", async () => {
              const key = getCredValue("anthropic", "api_key");
              if (!key) throw new Error("API key required.");
              const r = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
                body: JSON.stringify({ model: getCredValue("anthropic", "default_model") || "claude-haiku-4-5-20251001", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(`Anthropic error ${r.status}: ${d.error?.message || JSON.stringify(d)}`);
              return `Connected. Model: ${d.model}`;
            })}
            onSave={() => handleSave("anthropic")}
          >
            <div className="space-y-3">
              <CredentialField label="API Key" fieldKey="api_key" value={getCredValue("anthropic", "api_key")} onChange={(k, v) => setField("anthropic", k, v)} secret placeholder="sk-ant-..." />
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Default Model</Label>
                <Select value={getCredValue("anthropic", "default_model") || "claude-haiku-4-5-20251001"} onValueChange={(v) => setField("anthropic", "default_model", v)}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-opus-4-7">claude-opus-4-7</SelectItem>
                    <SelectItem value="claude-sonnet-4-6">claude-sonnet-4-6</SelectItem>
                    <SelectItem value="claude-haiku-4-5-20251001">claude-haiku-4-5-20251001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max Tokens (default {getCredValue("anthropic", "max_tokens") || 2048})</Label>
                <Input type="number" value={getCredValue("anthropic", "max_tokens") || 2048} onChange={(e) => setField("anthropic", "max_tokens", parseInt(e.target.value))} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Temperature ({getCredValue("anthropic", "temperature") ?? 0.7})</Label>
                <Slider min={0} max={1} step={0.1} value={[parseFloat(getCredValue("anthropic", "temperature") ?? 0.7)]} onValueChange={([v]) => setField("anthropic", "temperature", v)} />
              </div>
            </div>
          </IntegrationCard>

          {/* OpenAI */}
          <IntegrationCard
            icon={<OpenAIIcon />}
            name="OpenAI (ChatGPT)"
            description="Use your own OpenAI API key for AI generation. Useful with existing OpenAI infrastructure."
            {...cardProps("openai")}
            onTest={() => handleTest("openai", async () => {
              const key = getCredValue("openai", "api_key");
              if (!key) throw new Error("API key required.");
              const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
              if (getCredValue("openai", "org_id")) headers["OpenAI-Organization"] = getCredValue("openai", "org_id");
              const r = await fetch("https://api.openai.com/v1/models", { headers });
              const d = await r.json();
              if (!r.ok) throw new Error(`OpenAI error ${r.status}: ${d.error?.message || JSON.stringify(d)}`);
              return `Connected. ${d.data?.length || 0} models available.`;
            })}
            onSave={() => handleSave("openai")}
          >
            <div className="space-y-3">
              <CredentialField label="API Key" fieldKey="api_key" value={getCredValue("openai", "api_key")} onChange={(k, v) => setField("openai", k, v)} secret placeholder="sk-..." />
              <CredentialField label="Organization ID" fieldKey="org_id" value={getCredValue("openai", "org_id")} onChange={(k, v) => setField("openai", k, v)} placeholder="org-... (optional)" />
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Default Model</Label>
                <Select value={getCredValue("openai", "default_model") || "gpt-4o-mini"} onValueChange={(v) => setField("openai", "default_model", v)}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                    <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                    <SelectItem value="o1">o1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max Tokens (default {getCredValue("openai", "max_tokens") || 2048})</Label>
                <Input type="number" value={getCredValue("openai", "max_tokens") || 2048} onChange={(e) => setField("openai", "max_tokens", parseInt(e.target.value))} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Temperature ({getCredValue("openai", "temperature") ?? 0.7})</Label>
                <Slider min={0} max={1} step={0.1} value={[parseFloat(getCredValue("openai", "temperature") ?? 0.7)]} onValueChange={([v]) => setField("openai", "temperature", v)} />
              </div>
            </div>
          </IntegrationCard>

          {/* Ringba */}
          <IntegrationCard
            icon={<RingbaIcon />}
            name="Ringba"
            description="Call tracking platform. Provision numbers, route calls, fetch call detail records for attribution."
            {...cardProps("ringba")}
            onTest={() => handleTest("ringba", async () => {
              const accountId = getCredValue("ringba", "account_id");
              const apiKey = getCredValue("ringba", "api_key");
              if (!accountId || !apiKey) throw new Error("Account ID and API key required.");
              const r = await fetch(`https://api.ringba.com/v2/${accountId}/account`, {
                headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
              });
              if (!r.ok) {
                const txt = await r.text();
                throw new Error(`Ringba error ${r.status}: ${txt.slice(0, 200)}`);
              }
              const d = await r.json();
              return `Connected. Account: ${d.name || accountId}`;
            })}
            onSave={() => handleSave("ringba")}
          >
            <div className="space-y-3">
              <CredentialField label="Account ID" fieldKey="account_id" value={getCredValue("ringba", "account_id")} onChange={(k, v) => setField("ringba", k, v)} />
              <CredentialField label="API Key" fieldKey="api_key" value={getCredValue("ringba", "api_key")} onChange={(k, v) => setField("ringba", k, v)} secret />
              <CredentialField label="Default Campaign ID" fieldKey="default_campaign_id" value={getCredValue("ringba", "default_campaign_id")} onChange={(k, v) => setField("ringba", k, v)} placeholder="Optional" />
              <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">When connected, the Numbers admin will show a "Sync from Ringba" button to import provisioned numbers.</p>
            </div>
          </IntegrationCard>

          {/* GoHighLevel */}
          <IntegrationCard
            icon={<GHLIcon />}
            name="GoHighLevel (GHL)"
            description="Push every Lead into a GHL location for automation, drip campaigns, and pipeline management."
            {...cardProps("ghl")}
            onTest={() => handleTest("ghl", async () => {
              const apiKey = getCredValue("ghl", "api_key");
              const locationId = getCredValue("ghl", "location_id");
              if (!apiKey || !locationId) throw new Error("API key and Location ID required.");
              const r = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
                headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28" },
              });
              const d = await r.json();
              if (!r.ok) throw new Error(`GHL error ${r.status}: ${d.message || JSON.stringify(d)}`);
              return `Connected. Location: ${d.location?.name || locationId}`;
            })}
            onSave={() => handleSave("ghl")}
          >
            <div className="space-y-3">
              <CredentialField label="API Key (V2 Token)" fieldKey="api_key" value={getCredValue("ghl", "api_key")} onChange={(k, v) => setField("ghl", k, v)} secret hint="V2 Private Integration Token recommended." />
              <CredentialField label="Location ID" fieldKey="location_id" value={getCredValue("ghl", "location_id")} onChange={(k, v) => setField("ghl", k, v)} />
              <CredentialField label="Default Pipeline ID" fieldKey="pipeline_id" value={getCredValue("ghl", "pipeline_id")} onChange={(k, v) => setField("ghl", k, v)} placeholder="Optional" />
              <CredentialField label="Default Stage ID" fieldKey="stage_id" value={getCredValue("ghl", "stage_id")} onChange={(k, v) => setField("ghl", k, v)} placeholder="Optional" />
              <CredentialField label="Tag Prefix" fieldKey="tag_prefix" value={getCredValue("ghl", "tag_prefix")} onChange={(k, v) => setField("ghl", k, v)} placeholder="checkacase_" />
            </div>
          </IntegrationCard>

          {/* BigQuery */}
          <IntegrationCard
            icon={<BigQueryIcon />}
            name="Google BigQuery"
            description="Stream leads, quiz submissions, tool completions, and pixel events to BigQuery for analytics and ML."
            {...cardProps("bigquery")}
            onTest={() => handleTest("bigquery", async () => {
              const projectId = getCredValue("bigquery", "project_id");
              const serviceAccountJson = getCredValue("bigquery", "service_account_json");
              if (!projectId || !serviceAccountJson) throw new Error("Project ID and service account JSON required.");
              try { JSON.parse(serviceAccountJson); } catch { throw new Error("Service account JSON is not valid JSON."); }
              return `Config valid. Project: ${projectId}. Connection will be verified when first event streams.`;
            })}
            onSave={() => handleSave("bigquery")}
          >
            <div className="space-y-3">
              <CredentialField label="Project ID" fieldKey="project_id" value={getCredValue("bigquery", "project_id")} onChange={(k, v) => setField("bigquery", k, v)} placeholder="my-gcp-project" />
              <CredentialField label="Dataset ID" fieldKey="dataset_id" value={getCredValue("bigquery", "dataset_id")} onChange={(k, v) => setField("bigquery", k, v)} placeholder="checkacase_events" />
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Service Account JSON <span className="text-amber-600 font-normal">(encrypted)</span></Label>
                <textarea
                  className="w-full h-28 text-xs font-mono rounded-lg border border-input bg-transparent px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  value={getCredValue("bigquery", "service_account_json") || ""}
                  onChange={(e) => setField("bigquery", "service_account_json", e.target.value)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">Requires BigQuery Data Editor role minimum.</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={getCredValue("bigquery", "auto_create_tables") !== false}
                  onCheckedChange={(v) => setField("bigquery", "auto_create_tables", v)}
                />
                <span className="text-sm">Auto-create tables on first write</span>
              </div>
            </div>
          </IntegrationCard>

          {/* Custom APIs */}
          <IntegrationCard
            icon={<div className="w-8 h-8 bg-muted border border-border rounded-lg flex items-center justify-center text-xs font-bold">API</div>}
            name="Custom APIs"
            description="Outbound webhooks with retry and auth. Inbound endpoints to receive external data and create leads."
            {...cardProps("custom_api")}
            onTest={() => handleTest("custom_api", async () => {
              const url = getCredValue("custom_api", "test_url");
              if (!url) return "No test URL configured. Add a webhook endpoint URL to test.";
              const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: true, source: "checkacase_integration_test" }) });
              if (!r.ok) throw new Error(`Endpoint returned ${r.status}: ${(await r.text()).slice(0, 200)}`);
              return `Outbound test OK. Status: ${r.status}`;
            })}
            onSave={() => handleSave("custom_api")}
          >
            <Tabs defaultValue="outbound">
              <TabsList className="h-8">
                <TabsTrigger value="outbound" className="text-xs">Outbound</TabsTrigger>
                <TabsTrigger value="inbound" className="text-xs">Inbound</TabsTrigger>
              </TabsList>
              <TabsContent value="outbound" className="mt-3 space-y-3">
                <CredentialField label="Webhook Name" fieldKey="outbound_name" value={getCredValue("custom_api", "outbound_name")} onChange={(k, v) => setField("custom_api", k, v)} placeholder="My CRM Webhook" />
                <CredentialField label="Target URL" fieldKey="outbound_url" value={getCredValue("custom_api", "outbound_url")} onChange={(k, v) => setField("custom_api", k, v)} placeholder="https://api.example.com/webhook" />
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auth Type</Label>
                  <Select value={getCredValue("custom_api", "auth_type") || "none"} onValueChange={(v) => setField("custom_api", "auth_type", v)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="api_key_header">API Key Header</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="hmac_sha256">HMAC-SHA256</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {getCredValue("custom_api", "auth_type") && getCredValue("custom_api", "auth_type") !== "none" && (
                  <CredentialField label="Auth Credentials" fieldKey="auth_credentials" value={getCredValue("custom_api", "auth_credentials")} onChange={(k, v) => setField("custom_api", k, v)} secret />
                )}
                <CredentialField label="Test URL" fieldKey="test_url" value={getCredValue("custom_api", "test_url")} onChange={(k, v) => setField("custom_api", k, v)} hint="Used for Test Connection above." />
              </TabsContent>
              <TabsContent value="inbound" className="mt-3 space-y-3">
                <CredentialField label="Endpoint Name" fieldKey="inbound_name" value={getCredValue("custom_api", "inbound_name")} onChange={(k, v) => setField("custom_api", k, v)} placeholder="My CRM Inbound" />
                <CredentialField label="Endpoint Slug" fieldKey="inbound_slug" value={getCredValue("custom_api", "inbound_slug")} onChange={(k, v) => setField("custom_api", k, v)} placeholder="my-crm" hint="Creates /api/inbound/{slug} route." />
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Action on Receipt</Label>
                  <Select value={getCredValue("custom_api", "inbound_action") || "create_lead"} onValueChange={(v) => setField("custom_api", "inbound_action", v)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create_lead">Create Lead</SelectItem>
                      <SelectItem value="update_lead_by_email">Update Lead by Email</SelectItem>
                      <SelectItem value="create_event">Create Event</SelectItem>
                      <SelectItem value="trigger_webhook">Trigger Outbound Webhook</SelectItem>
                      <SelectItem value="custom">Custom (AI-mediated)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CredentialField label="Inbound API Key" fieldKey="inbound_api_key" value={getCredValue("custom_api", "inbound_api_key")} onChange={(k, v) => setField("custom_api", k, v)} secret hint="Incoming requests must include this key in X-API-Key header." />
                {getCredValue("custom_api", "inbound_slug") && (
                  <p className="text-xs bg-muted rounded-lg p-3 font-mono">
                    POST /api/inbound/{getCredValue("custom_api", "inbound_slug")}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </IntegrationCard>

        </TabsContent>
      </Tabs>
    </div>
  );
}