import React from "react";
import EditorShell from "./_EditorShell";
import { Field, Toggle, NodePicker, CustomFieldPicker, EditorField, ScriptsEditor } from "./_primitives";

const TABS = [
  { id: "general", label: "General" },
  { id: "binding", label: "Phone Binding" },
  { id: "settings", label: "Verification Settings" },
  { id: "routing", label: "Routing" },
  { id: "ux", label: "UX Options" },
];

export default function PhoneVerificationEditor({ draft, updateDraft, updateConfig, allNodes }) {
  const config = draft.config || {};

  return (
    <EditorShell tabs={TABS}>
      {(tab) => (
        <>
          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Admin Label" value={draft.label} onChange={(v) => updateDraft({ label: v })} required />
              <Field label="Title Display" value={draft.title_display} onChange={(v) => updateDraft({ title_display: v })} rows={2}
                helper="Shown to user above the code input" />
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">Provider: <span className="font-semibold">Twilio Verify</span></p>
                <a href="/admin/integrations" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800">Configure Twilio in Integrations</a>
              </div>
            </div>
          )}
          {tab === "binding" && (
            <div className="space-y-4">
              <EditorField label="Phone Field" helper="The custom field that holds the phone number to verify">
                <CustomFieldPicker value={config.phone_field_key || "phone"}
                  onChange={(v) => updateConfig({ phone_field_key: v })} />
              </EditorField>
            </div>
          )}
          {tab === "settings" && (
            <div className="space-y-4">
              <EditorField label="Code Length">
                <select value={config.code_length || 6} onChange={(e) => updateConfig({ code_length: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option value={4}>4 digits</option>
                  <option value={6}>6 digits</option>
                  <option value={8}>8 digits</option>
                </select>
              </EditorField>
              <Field label="Max Attempts" type="number" value={config.max_attempts || 3}
                onChange={(v) => updateConfig({ max_attempts: Number(v) })} />
              <Field label="Resend Cooldown (seconds)" type="number" value={config.resend_cooldown_seconds || 60}
                onChange={(v) => updateConfig({ resend_cooldown_seconds: Number(v) })} />
              <Field label="Code Message Template" value={config.code_message_template || "Your verification code is {code}"}
                onChange={(v) => updateConfig({ code_message_template: v })} helper="Use {code} placeholder" />
            </div>
          )}
          {tab === "routing" && (
            <div className="space-y-4">
              <EditorField label="On Success - Next Node">
                <NodePicker value={config.success_target_node_id} onChange={(v) => updateConfig({ success_target_node_id: v })} allNodes={allNodes} />
              </EditorField>
              <EditorField label="On Failure (max attempts exceeded)">
                <NodePicker value={config.failure_target_node_id} onChange={(v) => updateConfig({ failure_target_node_id: v })} allNodes={allNodes} />
              </EditorField>
            </div>
          )}
          {tab === "ux" && (
            <div className="space-y-4">
              <Field label="Submit Button Label" value={config.submit_button_label || "Verify"}
                onChange={(v) => updateConfig({ submit_button_label: v })} />
              <Toggle label='Show "Skip verification" link (testing only)'
                value={config.show_skip_link || false}
                onChange={(v) => updateConfig({ show_skip_link: v })}
                helper="This link should be hidden in production environments." />
            </div>
          )}
        </>
      )}
    </EditorShell>
  );
}