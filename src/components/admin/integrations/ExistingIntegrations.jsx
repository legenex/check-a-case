import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import CredentialField from "./CredentialField";
import { Label } from "@/components/ui/label";

const INTEGRATION_META = {
  search_console: {
    label: "Google Search Console",
    fields: [
      { key: "client_email", label: "Service Account Email", placeholder: "xxx@project.iam.gserviceaccount.com" },
      { key: "private_key", label: "Private Key", secret: true },
      { key: "site_url", label: "Site URL", placeholder: "https://checkacase.com" },
    ],
    color: "bg-blue-100",
    abbr: "GSC",
  },
  ga4: {
    label: "Google Analytics 4",
    fields: [
      { key: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" },
      { key: "api_secret", label: "Measurement Protocol API Secret", secret: true },
      { key: "property_id", label: "Property ID", placeholder: "123456789" },
    ],
    color: "bg-orange-100",
    abbr: "GA4",
  },
  meta_ads: {
    label: "Meta Ads (Facebook)",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "123456789012345" },
      { key: "access_token", label: "Conversions API Token", secret: true },
      { key: "test_event_code", label: "Test Event Code", placeholder: "TEST12345 (optional)" },
    ],
    color: "bg-blue-100",
    abbr: "Meta",
  },
  gtm: {
    label: "Google Tag Manager",
    fields: [
      { key: "container_id", label: "Container ID", placeholder: "GTM-XXXXXXX" },
      { key: "server_url", label: "Server-side GTM URL", placeholder: "https://gtm.example.com (optional)" },
    ],
    color: "bg-blue-100",
    abbr: "GTM",
  },
  smtp: {
    label: "Email SMTP",
    fields: [
      { key: "host", label: "SMTP Host", placeholder: "smtp.sendgrid.net" },
      { key: "port", label: "Port", placeholder: "587" },
      { key: "username", label: "Username / API Key", placeholder: "apikey" },
      { key: "password", label: "Password", secret: true },
      { key: "from_email", label: "From Email", placeholder: "noreply@checkacase.com" },
      { key: "from_name", label: "From Name", placeholder: "CheckACase" },
    ],
    color: "bg-green-100",
    abbr: "SMTP",
  },
  slack: {
    label: "Slack",
    fields: [
      { key: "webhook_url", label: "Incoming Webhook URL", secret: true, placeholder: "https://hooks.slack.com/..." },
      { key: "default_channel", label: "Default Channel", placeholder: "#leads" },
      { key: "bot_token", label: "Bot Token (optional)", secret: true, placeholder: "xoxb-..." },
    ],
    color: "bg-purple-100",
    abbr: "SL",
  },
  custom_webhook: {
    label: "Custom Webhooks",
    fields: [
      { key: "endpoint_url", label: "Endpoint URL", placeholder: "https://api.example.com/webhook" },
      { key: "secret", label: "Signing Secret", secret: true, placeholder: "Optional HMAC secret" },
      { key: "headers", label: "Custom Headers (JSON)", placeholder: '{"X-Api-Key": "..."}' },
    ],
    color: "bg-slate-100",
    abbr: "WHK",
  },
  trusted_form: {
    label: "TrustedForm",
    fields: [
      { key: "api_key", label: "API Key", secret: true },
      { key: "account_id", label: "Account ID" },
    ],
    color: "bg-teal-100",
    abbr: "TF",
  },
  hlr_lookup: {
    label: "HLR Lookup",
    fields: [
      { key: "api_key", label: "API Key", secret: true },
      { key: "provider", label: "Provider", placeholder: "e.g. hlr-lookups.com" },
      { key: "endpoint", label: "Endpoint URL", placeholder: "https://api.hlr-lookups.com/..." },
    ],
    color: "bg-cyan-100",
    abbr: "HLR",
  },
};

function StatusBadge({ status }) {
  if (status === "success") return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs"><CheckCircle2 size={11} /> Connected</Badge>;
  if (status === "failed") return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-xs"><XCircle size={11} /> Failed</Badge>;
  return <Badge className="bg-slate-100 text-slate-500 border-slate-200 gap-1 text-xs"><AlertCircle size={11} /> Untested</Badge>;
}

function ExistingCard({ type, record }) {
  const meta = INTEGRATION_META[type];
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [localCreds, setLocalCreds] = useState({});
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState(null);

  const savedCreds = record?.credentials ? record.credentials : {};
  const getValue = (key) => localCreds[key] ?? savedCreds[key] ?? "";
  const setField = (key, val) => setLocalCreds((p) => ({ ...p, [key]: val }));

  const saveMut = useMutation({
    mutationFn: async () => {
      const merged = { ...savedCreds, ...localCreds };
      const payload = { type, label: meta.label, credentials: merged, enabled: record?.enabled ?? false };
      if (record) return base44.entities.IntegrationConfig.update(record.id, payload);
      return base44.entities.IntegrationConfig.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries(["integration-configs"]); setLocalCreds({}); },
  });

  const toggleMut = useMutation({
    mutationFn: async (enabled) => {
      if (record) return base44.entities.IntegrationConfig.update(record.id, { enabled });
      const payload = { type, label: meta.label, enabled, credentials: savedCreds };
      return base44.entities.IntegrationConfig.create(payload);
    },
    onSuccess: () => qc.invalidateQueries(["integration-configs"]),
  });

  const handleTest = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      // Generic connectivity test: just validate required fields are filled
      const missing = meta.fields
        .filter((f) => !f.secret && !f.placeholder?.includes("optional") && !f.placeholder?.includes("Optional"))
        .filter((f) => !getValue(f.key))
        .map((f) => f.label);
      if (missing.length) throw new Error(`Missing required fields: ${missing.join(", ")}`);
      setTestMsg("Config looks complete. Save and deploy to fully test connectivity.");
      if (record) {
        await base44.entities.IntegrationConfig.update(record.id, {
          test_status: "success",
          test_message: "Config validated",
          last_sync: new Date().toISOString(),
        });
        qc.invalidateQueries(["integration-configs"]);
      }
    } catch (err) {
      setTestMsg(err.message);
      if (record) {
        await base44.entities.IntegrationConfig.update(record.id, {
          test_status: "failed",
          test_message: err.message,
        });
        qc.invalidateQueries(["integration-configs"]);
      }
    } finally {
      setTesting(false);
    }
  };

  const isDirty = Object.keys(localCreds).length > 0;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0 ${meta.color}`}>
          {meta.abbr}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{meta.label}</p>
          <StatusBadge status={record?.test_status || "untested"} />
        </div>
        <Switch
          checked={record?.enabled || false}
          onCheckedChange={(v) => toggleMut.mutate(v)}
          disabled={toggleMut.isPending}
        />
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-border px-4 py-4 space-y-3 bg-muted/20">
          {meta.fields.map((f) => (
            <CredentialField
              key={f.key}
              label={f.label}
              fieldKey={f.key}
              value={getValue(f.key)}
              onChange={(k, v) => setField(k, v)}
              secret={f.secret}
              placeholder={f.placeholder}
            />
          ))}

          {testMsg && (
            <p className={`text-xs rounded-lg px-3 py-2 ${testMsg.includes("Missing") || testMsg.includes("failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {testMsg}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {testing ? <Loader2 size={12} className="animate-spin" /> : <AlertCircle size={12} />}
              Test
            </button>
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || !isDirty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saveMut.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
              Save
            </button>
            {isDirty && (
              <button onClick={() => setLocalCreds({})} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Discard
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExistingIntegrations() {
  const { data: configs = [] } = useQuery({
    queryKey: ["integration-configs"],
    queryFn: () => base44.entities.IntegrationConfig.list(),
  });

  const types = Object.keys(INTEGRATION_META);

  return (
    <div className="space-y-3">
      {types.map((type) => (
        <ExistingCard
          key={type}
          type={type}
          record={configs.find((c) => c.type === type)}
        />
      ))}
    </div>
  );
}