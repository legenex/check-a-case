import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, CheckCircle2, Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import FormFieldRow from "./FormFieldRow";
import FormPreview from "./FormPreview";
import TcpaTab from "./TcpaTab";
import WebhookTab from "./WebhookTab";

export default function ContactFormEditor({ form: initialForm, onBack }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [savedAt, setSavedAt] = useState(null);
  const [pending, setPending] = useState(false);

  const saveMut = useMutation({
    mutationFn: (data) => base44.entities.ContactForm.update(form.id, data),
    onSuccess: (updated) => {
      setForm((f) => ({ ...f, ...updated }));
      setSavedAt(new Date());
      setPending(false);
      qc.invalidateQueries(['contact-forms']);
    },
  });

  const patch = (data) => {
    setForm((f) => ({ ...f, ...data }));
    setPending(true);
  };

  const handleSave = () => saveMut.mutate(form);

  const addField = () => {
    patch({ fields: [...(form.fields || []), { custom_field_id: '', display_label_override: '', is_required: true, width: 'full', placeholder: '', autocomplete: '', display_order: (form.fields || []).length }] });
  };

  const updateField = (idx, data) => {
    const fields = [...(form.fields || [])];
    fields[idx] = { ...fields[idx], ...data };
    patch({ fields });
  };

  const removeField = (idx) => {
    const fields = (form.fields || []).filter((_, i) => i !== idx);
    patch({ fields });
  };

  const moveField = (from, to) => {
    const fields = [...(form.fields || [])];
    const [item] = fields.splice(from, 1);
    fields.splice(to, 0, item);
    patch({ fields: fields.map((f, i) => ({ ...f, display_order: i })) });
  };

  return (
    <div className="flex flex-col h-screen bg-muted/30 overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-14 bg-card border-b border-border flex-shrink-0">
        <button onClick={onBack} className="p-1.5 rounded hover:bg-muted">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm text-muted-foreground hidden sm:block">Contact Forms /</span>
        <span className="text-sm font-semibold truncate max-w-[200px]">{form.title}</span>
        <div className="flex-1" />
        {pending && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        {savedAt && !pending && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Saved</span>}
        <button onClick={handleSave} disabled={saveMut.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90">
          <Save className="w-4 h-4" /> Save
        </button>
      </div>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: metadata (260px) */}
        <div className="w-64 flex-shrink-0 border-r border-border bg-card overflow-y-auto p-4 space-y-4">
          <FormMetadata form={form} onChange={patch} />
        </div>

        {/* Center: fields + preview */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Fields ({(form.fields || []).length})</h3>
            <button onClick={addField} className="flex items-center gap-1 text-sm text-primary hover:underline">
              <Plus className="w-4 h-4" /> Add Field
            </button>
          </div>

          {(form.fields || []).length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
              No fields yet. Click "+ Add Field" to start.
            </div>
          )}

          {(form.fields || []).map((field, idx) => (
            <FormFieldRow
              key={idx}
              field={field}
              index={idx}
              total={(form.fields || []).length}
              onChange={(data) => updateField(idx, data)}
              onRemove={() => removeField(idx)}
              onMoveUp={() => idx > 0 && moveField(idx, idx - 1)}
              onMoveDown={() => idx < (form.fields || []).length - 1 && moveField(idx, idx + 1)}
            />
          ))}

          {(form.fields || []).length > 0 && (
            <>
              <hr className="border-border" />
              <h3 className="font-semibold text-foreground">Preview</h3>
              <FormPreview form={form} />
            </>
          )}
        </div>

        {/* Right: tabs (300px) */}
        <div className="w-72 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
          <Tabs defaultValue="tcpa" className="h-full flex flex-col">
            <TabsList className="rounded-none border-b px-2 pt-2 bg-transparent justify-start gap-1 flex-shrink-0">
              <TabsTrigger value="tcpa" className="text-xs">TCPA</TabsTrigger>
              <TabsTrigger value="trustedform" className="text-xs">TrustedForm</TabsTrigger>
              <TabsTrigger value="webhook" className="text-xs">Webhook</TabsTrigger>
            </TabsList>
            <TabsContent value="tcpa" className="flex-1 overflow-auto p-4">
              <TcpaTab form={form} onChange={patch} />
            </TabsContent>
            <TabsContent value="trustedform" className="flex-1 overflow-auto p-4">
              <TrustedFormTab form={form} onChange={patch} />
            </TabsContent>
            <TabsContent value="webhook" className="flex-1 overflow-auto p-4">
              <WebhookTab form={form} onChange={patch} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function FormMetadata({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
        <input value={form.title || ''} onChange={(e) => onChange({ title: e.target.value })}
          className="w-full h-8 px-2 rounded border border-input bg-background text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
        <textarea value={form.description || ''} onChange={(e) => onChange({ description: e.target.value })} rows={3}
          className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs resize-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Form Type</label>
        <select value={form.form_type || 'custom'} onChange={(e) => onChange({ form_type: e.target.value })}
          className="w-full h-8 px-2 rounded border border-input bg-background text-sm">
          <option value="qualified">Qualified</option>
          <option value="disqualified">Disqualified</option>
          <option value="newsletter">Newsletter</option>
          <option value="callback">Callback</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Submit Button Text</label>
        <input value={form.submit_button_text || 'Continue'} onChange={(e) => onChange({ submit_button_text: e.target.value })}
          className="w-full h-8 px-2 rounded border border-input bg-background text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Post-Submit Redirect URL</label>
        <input value={form.post_submit_redirect_url || ''} onChange={(e) => onChange({ post_submit_redirect_url: e.target.value })}
          placeholder="/Submitted?lid={lead_id}"
          className="w-full h-8 px-2 rounded border border-input bg-background text-xs font-mono" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Active</span>
        <Switch checked={!!form.is_active} onCheckedChange={(v) => onChange({ is_active: v })} />
      </div>
    </div>
  );
}

function TrustedFormTab({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">TrustedForm Enabled</span>
        <Switch checked={!!form.trustedform_enabled} onCheckedChange={(v) => onChange({ trustedform_enabled: v })} />
      </div>
      {form.trustedform_enabled && (
        <>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Field ID</label>
            <input value={form.trustedform_field_id || 'xxTrustedFormCertUrl'}
              onChange={(e) => onChange({ trustedform_field_id: e.target.value })}
              className="w-full h-8 px-2 rounded border border-input bg-background text-xs font-mono" />
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Setup Required</p>
            <p>Requires TrustedForm credentials in <a href="/admin/integrations" className="underline">Admin Integrations</a>. Cert URL is captured server-side on submit.</p>
          </div>
        </>
      )}
    </div>
  );
}