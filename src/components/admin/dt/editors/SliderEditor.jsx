import React from "react";
import { Plus, Trash2 } from "lucide-react";
import EditorShell from "./_EditorShell";
import { Field, Toggle, CustomFieldPicker, EditorField, ScriptsEditor } from "./_primitives";

const TABS = [
  { id: "general", label: "General" },
  { id: "range", label: "Range" },
  { id: "format", label: "Format" },
  { id: "binding", label: "Field Binding" },
  { id: "buckets", label: "Buckets" },
  { id: "scripts", label: "Scripts" },
];

export default function SliderEditor({ draft, updateDraft, updateConfig }) {
  const config = draft.config || {};
  const buckets = config.buckets || [];

  const addBucket = () => updateConfig({ buckets: [...buckets, { min: 0, max: 0, label: "", value: "" }] });
  const updateBucket = (idx, patch) => updateConfig({ buckets: buckets.map((b, i) => i === idx ? { ...b, ...patch } : b) });
  const removeBucket = (idx) => updateConfig({ buckets: buckets.filter((_, i) => i !== idx) });

  return (
    <EditorShell tabs={TABS}>
      {(tab) => (
        <>
          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Admin Label" value={draft.label} onChange={(v) => updateDraft({ label: v })} required />
              <Field label="Question Text" value={draft.title_display} onChange={(v) => updateDraft({ title_display: v })} rows={2} />
              <Field label="Help Text" value={draft.help_text} onChange={(v) => updateDraft({ help_text: v })} rows={2} />
            </div>
          )}
          {tab === "range" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Min" type="number" value={config.min ?? 0} onChange={(v) => updateConfig({ min: Number(v) })} />
                <Field label="Max" type="number" value={config.max ?? 100} onChange={(v) => updateConfig({ max: Number(v) })} />
                <Field label="Step" type="number" value={config.step ?? 1} onChange={(v) => updateConfig({ step: Number(v) })} />
              </div>
              <Field label="Default Value" type="number" value={config.default_value ?? config.min ?? 0}
                onChange={(v) => updateConfig({ default_value: Number(v) })} />
              <Toggle label="Show tick marks" value={config.show_ticks || false} onChange={(v) => updateConfig({ show_ticks: v })} />
              <Toggle label="Live value display" value={config.live_display !== false} onChange={(v) => updateConfig({ live_display: v })} />
            </div>
          )}
          {tab === "format" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prefix" value={config.prefix || ""} onChange={(v) => updateConfig({ prefix: v })} placeholder="e.g. $" />
                <Field label="Suffix" value={config.suffix || ""} onChange={(v) => updateConfig({ suffix: v })} placeholder="e.g. miles" />
              </div>
              <EditorField label="Format">
                <select value={config.format || "number"} onChange={(e) => updateConfig({ format: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  {["number","currency_usd","currency_eur","percent"].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </EditorField>
              <Field label="Decimal Places" type="number" value={config.decimal_places ?? 0}
                onChange={(v) => updateConfig({ decimal_places: Number(v) })} />
            </div>
          )}
          {tab === "binding" && (
            <div className="space-y-4">
              <EditorField label="Target Custom Field">
                <CustomFieldPicker value={draft.custom_field_assignments?.[0]?.custom_field_id || ""}
                  onChange={(v) => updateDraft({ custom_field_assignments: v ? [{ custom_field_id: v, value_source: "user_input", transform: "none" }] : [] })} />
              </EditorField>
            </div>
          )}
          {tab === "buckets" && (
            <div className="space-y-3">
              <Toggle label="Bucket the value into ranges" value={config.bucketing_enabled || false}
                onChange={(v) => updateConfig({ bucketing_enabled: v })} />
              {config.bucketing_enabled && (
                <>
                  <p className="text-xs text-slate-500">Define value ranges. A derived field <span className="font-mono">{(config.derived_bucket_field_key || "{field_key}_bucket")}</span> will be set at runtime.</p>
                  <Field label="Derived field key" value={config.derived_bucket_field_key || ""}
                    onChange={(v) => updateConfig({ derived_bucket_field_key: v })} placeholder="field_key_bucket" className="font-mono" />
                  <div className="space-y-2">
                    {buckets.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap">
                        <Field label="Min" type="number" value={b.min} onChange={(v) => updateBucket(idx, { min: Number(v) })} className="w-20" />
                        <Field label="Max" type="number" value={b.max} onChange={(v) => updateBucket(idx, { max: Number(v) })} className="w-20" />
                        <Field label="Label" value={b.label} onChange={(v) => updateBucket(idx, { label: v })} className="w-40" />
                        <Field label="Value" value={b.value} onChange={(v) => updateBucket(idx, { value: v })} className="w-32 font-mono" />
                        <button type="button" onClick={() => removeBucket(idx)} className="mt-5 text-red-400 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addBucket}
                    className="w-full flex items-center justify-center gap-1 py-2 rounded border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                    <Plus size={12} /> Add Bucket
                  </button>
                </>
              )}
            </div>
          )}
          {tab === "scripts" && (
            <ScriptsEditor value={draft.scripts || []} onChange={(v) => updateDraft({ scripts: v })}
              triggers={["on_enter","on_exit","on_change"]} />
          )}
        </>
      )}
    </EditorShell>
  );
}