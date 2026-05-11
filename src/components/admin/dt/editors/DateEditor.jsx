import React from "react";
import EditorShell from "./_EditorShell";
import { Field, Toggle, CustomFieldPicker, EditorField, ScriptsEditor } from "./_primitives";

const DATE_BUCKETS = [
  "within_7_days","within_14_days","within_30_days","within_3_months","within_6_months",
  "within_12_months","within_18_months","within_24_months","more_than_2_years",
];

const TABS_DATE = [
  { id: "general", label: "General" },
  { id: "range", label: "Date Range" },
  { id: "format", label: "Format" },
  { id: "binding", label: "Field Binding" },
  { id: "bucketing", label: "Bucketing" },
  { id: "validation", label: "Validation" },
  { id: "scripts", label: "Scripts" },
];
const TABS_DATETIME = [
  { id: "general", label: "General" },
  { id: "range", label: "Date Range" },
  { id: "format", label: "Format" },
  { id: "binding", label: "Field Binding" },
  { id: "scripts", label: "Scripts" },
];

export default function DateEditor({ draft, updateDraft, updateConfig }) {
  const config = draft.config || {};
  const isDatetime = draft.node_type === "datetime_picker";
  const tabs = isDatetime ? TABS_DATETIME : TABS_DATE;

  return (
    <EditorShell tabs={tabs}>
      {(tab) => (
        <>
          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Admin Label" value={draft.label} onChange={(v) => updateDraft({ label: v })} required />
              <Field label="Question Text" value={draft.title_display} onChange={(v) => updateDraft({ title_display: v })} rows={2} />
              <Field label="Help Text" value={draft.help_text} onChange={(v) => updateDraft({ help_text: v })} rows={2} />
              <Toggle label="Required" value={draft.required !== false} onChange={(v) => updateDraft({ required: v })} />
            </div>
          )}
          {tab === "range" && (
            <div className="space-y-4">
              <Field label="Min Date" type="date" value={config.min_date || ""}
                onChange={(v) => updateConfig({ min_date: v })} />
              <Field label="Max Date" type="date" value={config.max_date || ""}
                onChange={(v) => updateConfig({ max_date: v })} />
              <Field label="Default Date" type="date" value={config.default_date || ""}
                onChange={(v) => updateConfig({ default_date: v })} />
            </div>
          )}
          {tab === "format" && (
            <div className="space-y-4">
              <EditorField label="Date Format">
                <select value={config.date_format || "YYYY-MM-DD"}
                  onChange={(e) => updateConfig({ date_format: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  {["YYYY-MM-DD","MM/DD/YYYY","DD/MM/YYYY","MMMM D YYYY"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </EditorField>
              {isDatetime && (
                <>
                  <EditorField label="Time Format">
                    <select value={config.time_format || "HH:mm"}
                      onChange={(e) => updateConfig({ time_format: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                      <option value="HH:mm">24h (HH:mm)</option>
                      <option value="hh:mm a">12h (hh:mm a)</option>
                    </select>
                  </EditorField>
                  <Toggle label="Store as UTC" value={config.store_utc !== false}
                    onChange={(v) => updateConfig({ store_utc: v })} />
                </>
              )}
            </div>
          )}
          {tab === "binding" && (
            <div className="space-y-4">
              <EditorField label="Target Custom Field">
                <CustomFieldPicker value={draft.custom_field_assignments?.[0]?.custom_field_id || ""}
                  onChange={(v) => updateDraft({ custom_field_assignments: v ? [{ custom_field_id: v, value_source: "user_input", transform: "date_iso" }] : [] })} />
              </EditorField>
            </div>
          )}
          {tab === "bucketing" && (
            <div className="space-y-3">
              <Toggle label="Bucket into time ranges" value={config.bucketing_enabled || false}
                onChange={(v) => updateConfig({ bucketing_enabled: v })} />
              {config.bucketing_enabled && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    A derived field <span className="font-mono">{config.derived_bucket_field_key || "{field_key}_bucket"}</span> will be calculated at runtime relative to today.
                  </p>
                  <Field label="Derived field key" value={config.derived_bucket_field_key || ""}
                    onChange={(v) => updateConfig({ derived_bucket_field_key: v })} placeholder="accident_date_bucket" className="font-mono" />
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Buckets (evaluated in order):</p>
                    <div className="space-y-1">
                      {DATE_BUCKETS.map((b) => (
                        <div key={b} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-300 flex-shrink-0" />
                          <span className="font-mono text-slate-600">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "validation" && (
            <div className="space-y-3">
              <Toggle label="No future dates" value={config.no_future || false}
                onChange={(v) => updateConfig({ no_future: v })} />
              <Toggle label="No past dates" value={config.no_past || false}
                onChange={(v) => updateConfig({ no_past: v })} />
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