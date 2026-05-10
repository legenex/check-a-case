import React from "react";

const CHANNEL_LABELS = {
  notification_sms: "SMS (Twilio)",
  notification_email: "Email (SendGrid)",
  notification_whatsapp: "WhatsApp (Twilio)",
  notification_messenger: "Messenger",
  notification_telegram: "Telegram",
};

export default function NotificationTab({ node, onUpdate }) {
  const config = node.config || {};
  const isEmail = node.node_type === "notification_email";

  const update = (patch) => onUpdate({ config: { ...config, ...patch } });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-purple-50 border border-purple-200 rounded-lg p-2">
        <span className="font-medium">Channel:</span> {CHANNEL_LABELS[node.node_type] || node.node_type}
        <a href="/admin/integrations" className="ml-auto text-purple-600 hover:underline">Integrations settings</a>
      </div>

      {isEmail && (
        <div>
          <label className="text-xs text-slate-500">Subject</label>
          <input value={config.template_subject || ""}
            onChange={(e) => update({ template_subject: e.target.value })}
            placeholder="Subject line"
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5" />
        </div>
      )}

      <div>
        <label className="text-xs text-slate-500">Recipient (use {"{field_key}"} for dynamic)</label>
        <input value={config.recipient_template || ""}
          onChange={(e) => update({ recipient_template: e.target.value })}
          placeholder={isEmail ? "{email}" : "{phone}"}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm font-mono mt-0.5" />
      </div>

      <div>
        <label className="text-xs text-slate-500">Message Body (use {"{field_key}"} interpolation)</label>
        <textarea value={config.template_body || ""} rows={6}
          onChange={(e) => update({ template_body: e.target.value })}
          placeholder={isEmail ? "Markdown supported" : "Plain text SMS"}
          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs resize-y mt-0.5 font-mono" />
      </div>

      <div>
        <label className="text-xs text-slate-500">Delay (seconds)</label>
        <input type="number" value={config.delay_seconds || 0}
          onChange={(e) => update({ delay_seconds: Number(e.target.value) })}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5" />
      </div>
    </div>
  );
}