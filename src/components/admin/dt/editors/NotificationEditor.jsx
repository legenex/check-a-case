import React from "react";
import EditorShell from "./_EditorShell";
import { Field, Toggle, NodePicker, EditorField, ScriptsEditor } from "./_primitives";
import FieldRefInput from "./_primitives/FieldRefInput";

const TABS = [
  { id: "general", label: "General" },
  { id: "recipient", label: "Recipient" },
  { id: "message", label: "Message" },
  { id: "delivery", label: "Delivery Options" },
  { id: "scripts", label: "Scripts" },
];

const CHANNEL_LABELS = {
  notification_sms: "SMS (Twilio)",
  notification_email: "Email",
  notification_whatsapp: "WhatsApp (Twilio)",
  notification_messenger: "Facebook Messenger",
  notification_telegram: "Telegram",
};

const RECIPIENT_HINTS = {
  notification_sms: "Phone number field key, e.g. {phone}",
  notification_email: "Email field key, e.g. {email}",
  notification_whatsapp: "Phone number field key, e.g. {phone}",
  notification_messenger: "Messenger chat ID field key",
  notification_telegram: "Telegram chat ID field key",
};

export default function NotificationEditor({ draft, updateDraft, updateConfig, allNodes, quizId }) {
  const config = draft.config || {};
  const channel = draft.node_type;
  const isEmail = channel === "notification_email";

  return (
    <EditorShell tabs={TABS}>
      {(tab) => (
        <>
          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Admin Label" value={draft.label} onChange={(v) => updateDraft({ label: v })} required />
              <Field label="Description" value={draft.help_text} onChange={(v) => updateDraft({ help_text: v })} rows={2} />
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">Provider: <span className="font-semibold text-slate-700">{CHANNEL_LABELS[channel] || channel}</span></p>
                <a href="/admin/integrations" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 block">Configure integrations</a>
              </div>
            </div>
          )}
          {tab === "recipient" && (
            <div className="space-y-4">
              <EditorField label="Recipient Template" helper="Use {field_key} for interpolation. E.g. {phone} or hardcoded +15551234567">
                <FieldRefInput
                  value={config.recipient_template || ""}
                  onChange={(v) => updateConfig({ recipient_template: v })}
                  quizId={quizId}
                  multiline={false}
                  placeholder={RECIPIENT_HINTS[channel] || "{recipient_field}"}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                />
              </EditorField>
            </div>
          )}
          {tab === "message" && (
            <div className="space-y-4">
              {isEmail && (
                <EditorField label="Subject">
                  <FieldRefInput
                    value={config.subject || ""}
                    onChange={(v) => updateConfig({ subject: v })}
                    quizId={quizId}
                    multiline={false}
                    placeholder="e.g. Your case review is in progress"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  />
                </EditorField>
              )}
              <EditorField label={isEmail ? "Body (HTML/Markdown)" : "Message Body"}>
                <FieldRefInput
                  value={config.template_body || ""}
                  onChange={(v) => updateConfig({ template_body: v })}
                  quizId={quizId}
                  multiline={true}
                  rows={isEmail ? 12 : 6}
                  placeholder="Use {field_key} for dynamic interpolation. E.g. Hi {first_name}, ..."
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-y"
                />
              </EditorField>
              <p className="text-xs text-slate-400">Available interpolation: {"{first_name}"}, {"{phone}"}, {"{email}"}, {"{state}"}, any custom field key.</p>
            </div>
          )}
          {tab === "delivery" && (
            <div className="space-y-4">
              <Field label="Delay (seconds)" type="number" value={config.delay_seconds || 0}
                onChange={(v) => updateConfig({ delay_seconds: Number(v) })}
                helper="Schedule send after delay. 0 = immediate." />
              <Toggle label="Retry on failure" value={config.retry_on_failure || false}
                onChange={(v) => updateConfig({ retry_on_failure: v })} />
              {config.retry_on_failure && (
                <Field label="Max Retries" type="number" value={config.max_retries || 2}
                  onChange={(v) => updateConfig({ max_retries: Number(v) })} />
              )}
              <Toggle label="Wait for delivery confirmation (blocking)" value={config.wait_for_delivery || false}
                onChange={(v) => updateConfig({ wait_for_delivery: v })}
                helper="When ON, the tree pauses until the provider confirms send. Not recommended for SMS." />
            </div>
          )}
          {tab === "scripts" && (
            <ScriptsEditor value={draft.scripts || []} onChange={(v) => updateDraft({ scripts: v })}
              triggers={["on_send_success","on_send_failure"]} />
          )}
        </>
      )}
    </EditorShell>
  );
}