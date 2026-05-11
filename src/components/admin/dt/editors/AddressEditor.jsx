import React from "react";
import EditorShell from "./_EditorShell";
import { Field, Toggle, CustomFieldPicker, EditorField, ScriptsEditor } from "./_primitives";

const TABS = [
  { id: "general", label: "General" },
  { id: "fields", label: "Address Fields" },
  { id: "binding", label: "Field Binding" },
  { id: "scripts", label: "Scripts" },
];

const SUB_FIELDS = [
  { key: "street", label: "Street (Line 1)" },
  { key: "street2", label: "Street 2 (Apt/Suite)" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip Code" },
  { key: "country", label: "Country" },
];

export default function AddressEditor({ draft, updateDraft, updateConfig }) {
  const config = draft.config || {};
  const subConfig = config.sub_fields || {};
  const bindings = config.field_bindings || {};

  const updateSubField = (key, patch) => {
    updateConfig({ sub_fields: { ...subConfig, [key]: { ...(subConfig[key] || {}), ...patch } } });
  };

  return (
    <EditorShell tabs={TABS}>
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
          {tab === "fields" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Toggle which sub-fields to render and customize each.</p>
              {SUB_FIELDS.map((sf) => {
                const sfConf = subConfig[sf.key] || {};
                return (
                  <div key={sf.key} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <Toggle label={sf.label} value={sfConf.enabled !== false}
                      onChange={(v) => updateSubField(sf.key, { enabled: v })} />
                    {sfConf.enabled !== false && (
                      <div className="pl-4 grid grid-cols-2 gap-3">
                        <Field label="Label Override" value={sfConf.label_override || ""}
                          onChange={(v) => updateSubField(sf.key, { label_override: v })} />
                        <Field label="Placeholder" value={sfConf.placeholder || ""}
                          onChange={(v) => updateSubField(sf.key, { placeholder: v })} />
                        <Toggle label="Required" value={sfConf.required !== false}
                          onChange={(v) => updateSubField(sf.key, { required: v })} />
                      </div>
                    )}
                  </div>
                );
              })}
              <EditorField label="Autocomplete Provider">
                <select value={config.autocomplete_provider || "none"}
                  onChange={(e) => updateConfig({ autocomplete_provider: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="none">None</option>
                  <option value="google_places">Google Places</option>
                  <option value="mapbox">Mapbox</option>
                </select>
              </EditorField>
            </div>
          )}
          {tab === "binding" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Map each sub-field to a custom field for storage.</p>
              {SUB_FIELDS.map((sf) => (
                <EditorField key={sf.key} label={`${sf.label} field`}>
                  <CustomFieldPicker value={bindings[sf.key] || ""}
                    onChange={(v) => updateConfig({ field_bindings: { ...bindings, [sf.key]: v } })} />
                </EditorField>
              ))}
            </div>
          )}
          {tab === "scripts" && (
            <ScriptsEditor value={draft.scripts || []} onChange={(v) => updateDraft({ scripts: v })} triggers={["on_enter","on_exit"]} />
          )}
        </>
      )}
    </EditorShell>
  );
}