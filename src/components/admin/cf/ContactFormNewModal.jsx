import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Layers, UserCheck, Mail } from "lucide-react";

const QUALIFIED_FIELDS = [
  { custom_field_id: 'first_name', display_label_override: 'First Name', is_required: true, width: 'half', placeholder: 'John', autocomplete: 'given-name' },
  { custom_field_id: 'last_name', display_label_override: 'Last Name', is_required: true, width: 'half', placeholder: 'Doe', autocomplete: 'family-name' },
  { custom_field_id: 'email', display_label_override: 'Email Address', is_required: true, width: 'full', placeholder: 'john@example.com', autocomplete: 'email' },
  { custom_field_id: 'phone', display_label_override: 'Phone Number', is_required: true, width: 'full', placeholder: '(555) 555-5555', autocomplete: 'tel' },
  { custom_field_id: 'zip_code', display_label_override: 'ZIP Code', is_required: true, width: 'full', placeholder: '10001', autocomplete: 'postal-code' },
];

const DISQUALIFIED_FIELDS = [
  { custom_field_id: 'first_name', display_label_override: 'First Name', is_required: true, width: 'half', placeholder: 'John', autocomplete: 'given-name' },
  { custom_field_id: 'email', display_label_override: 'Email Address', is_required: true, width: 'full', placeholder: 'john@example.com', autocomplete: 'email' },
];

const TEMPLATES = [
  {
    id: 'qualified',
    label: 'Qualified Lead Form',
    icon: UserCheck,
    description: '5 fields (name, email, phone, zip), TCPA on, TrustedForm on',
    color: 'bg-green-50 border-green-200 hover:border-green-400',
    data: {
      form_type: 'qualified',
      fields: QUALIFIED_FIELDS,
      tcpa_enabled: true,
      trustedform_enabled: true,
      submit_button_text: 'See If I Qualify',
      is_active: true,
    },
  },
  {
    id: 'disqualified',
    label: 'Disqualified Form',
    icon: Mail,
    description: '2 fields (name, email), TCPA on, TrustedForm off',
    color: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    data: {
      form_type: 'disqualified',
      fields: DISQUALIFIED_FIELDS,
      tcpa_enabled: true,
      trustedform_enabled: false,
      submit_button_text: 'Get Updates',
      is_active: true,
    },
  },
  {
    id: 'custom',
    label: 'Custom Form',
    icon: Layers,
    description: 'Start from scratch',
    color: 'bg-slate-50 border-slate-200 hover:border-slate-400',
    data: {
      form_type: 'custom',
      fields: [],
      tcpa_enabled: false,
      trustedform_enabled: false,
      submit_button_text: 'Continue',
      is_active: true,
    },
  },
];

export default function ContactFormNewModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !selected) return;
    setCreating(true);
    try {
      const tpl = TEMPLATES.find((t) => t.id === selected);
      const form = await base44.entities.ContactForm.create({ title, ...tpl.data });
      onCreated(form);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New Contact Form</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Form Title <span className="text-destructive">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. MVA Qualified Lead Form"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Starting Template</label>
          <div className="grid gap-3">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  selected === t.id ? 'border-primary bg-primary/5' : t.color + ' border'
                }`}>
                <t.icon className="w-6 h-6 flex-shrink-0 text-slate-600" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Cancel</button>
          <button onClick={handleCreate} disabled={!title.trim() || !selected || creating}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90">
            {creating ? 'Creating...' : 'Create Form'}
          </button>
        </div>
      </div>
    </div>
  );
}