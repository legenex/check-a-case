import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ExternalLink } from "lucide-react";
import EditorShell from "./_EditorShell";
import { Field, Toggle, NodePicker, EditorField, ScriptsEditor } from "./_primitives";

const TABS = [
  { id: "general", label: "General" },
  { id: "form", label: "Contact Form" },
  { id: "routing", label: "Routing" },
  { id: "overrides", label: "Override Settings" },
  { id: "scripts", label: "Scripts" },
];

export default function FormNodeEditor({ draft, updateDraft, updateConfig, allNodes }) {
  const config = draft.config || {};
  const { data: contactForms = [] } = useQuery({
    queryKey: ["contact-forms"],
    queryFn: () => base44.entities.ContactForm.list(),
    staleTime: 30000,
  });

  const selectedForm = contactForms.find((f) => f.id === draft.contact_form_id);

  return (
    <EditorShell tabs={TABS}>
      {(tab) => (
        <>
          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Admin Label" value={draft.label} onChange={(v) => updateDraft({ label: v })} required />
              <Field label="Form Heading" value={draft.title_display} onChange={(v) => updateDraft({ title_display: v })} rows={2}
                helper="Shown above the form to the user" />
              <Field label="Help Text" value={draft.help_text} onChange={(v) => updateDraft({ help_text: v })} rows={2} />
            </div>
          )}
          {tab === "form" && (
            <div className="space-y-4">
              <EditorField label="Contact Form" required>
                <select value={draft.contact_form_id || ""} onChange={(e) => updateDraft({ contact_form_id: e.target.value || null })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">Select a contact form...</option>
                  {contactForms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </EditorField>
              {selectedForm && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{selectedForm.title}</p>
                    <a href="/admin/contact-forms" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                      <ExternalLink size={11} /> Manage
                    </a>
                  </div>
                  <p className="text-xs text-slate-500">{selectedForm.fields?.length || 0} fields</p>
                  {selectedForm.tcpa_enabled && <p className="text-xs text-green-600">TCPA enabled</p>}
                  {selectedForm.trustedform_enabled && <p className="text-xs text-green-600">TrustedForm enabled</p>}
                </div>
              )}
              {contactForms.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs text-amber-700">No contact forms found. <a href="/admin/contact-forms" target="_blank" className="underline">Create one</a> in the Contact Forms section.</p>
                </div>
              )}
            </div>
          )}
          {tab === "routing" && (
            <div className="space-y-4">
              <EditorField label="On Success - Next Node">
                <NodePicker value={config.on_success_target_node_id} onChange={(v) => updateConfig({ on_success_target_node_id: v })} allNodes={allNodes} />
              </EditorField>
              <EditorField label="On Error - Next Node" helper="Optional fallback if form submission fails">
                <NodePicker value={config.on_error_target_node_id} onChange={(v) => updateConfig({ on_error_target_node_id: v })} allNodes={allNodes} />
              </EditorField>
            </div>
          )}
          {tab === "overrides" && (
            <div className="space-y-4">
              <Toggle label="Override ContactForm defaults" value={config.override_enabled || false}
                onChange={(v) => updateConfig({ override_enabled: v })} />
              {config.override_enabled && (
                <>
                  <Field label="Submit Button Label" value={config.submit_button_label || ""} onChange={(v) => updateConfig({ submit_button_label: v })} />
                  <Field label="Post-submit Message" value={config.post_submit_message || ""} rows={3}
                    onChange={(v) => updateConfig({ post_submit_message: v })} />
                  <Field label="Redirect After Submit" value={config.post_submit_redirect_url || ""}
                    onChange={(v) => updateConfig({ post_submit_redirect_url: v })} />
                </>
              )}
            </div>
          )}
          {tab === "scripts" && (
            <ScriptsEditor value={draft.scripts || []} onChange={(v) => updateDraft({ scripts: v })}
              triggers={["on_enter","on_submit_success","on_submit_error"]} />
          )}
        </>
      )}
    </EditorShell>
  );
}