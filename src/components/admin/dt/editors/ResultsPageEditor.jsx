import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2 } from "lucide-react";
import EditorShell from "./_EditorShell";
import { Field, Toggle, CustomFieldPicker, EditorField, ScriptsEditor } from "./_primitives";

const TABS = [
  { id: "general", label: "General" },
  { id: "outcome", label: "Outcome" },
  { id: "template", label: "Result Template" },
  { id: "dynamic_fields", label: "Dynamic Fields" },
  { id: "redirect", label: "Redirect" },
  { id: "affiliate", label: "Affiliate Offers" },
  { id: "scripts", label: "Scripts" },
];

const RESULT_TEMPLATES = {
  qualified_high: `<h2>Great News!</h2><p>Based on your answers, you may have a strong case. An attorney will contact you at <strong>{phone}</strong> within 24 hours.</p>`,
  qualified_standard: `<h2>You May Qualify</h2><p>Thank you, {first_name}. Your case is under review. We'll reach out to {email} shortly.</p>`,
  soft_dq: `<h2>Thank You for Your Time</h2><p>Unfortunately, your situation may not meet our current criteria. However, there may still be options available to you.</p>`,
  hard_dq: `<h2>We're Sorry</h2><p>Based on your answers, we're unable to assist with your case at this time.</p>`,
};

export default function ResultsPageEditor({ draft, updateDraft, updateConfig }) {
  const config = draft.config || {};
  const dynamicFields = config.dynamic_fields || [];

  const { data: affiliateOffers = [] } = useQuery({
    queryKey: ["affiliate-offers"],
    queryFn: () => base44.entities.AffiliateOffer.list(),
    staleTime: 60000,
  });

  const addDynamicField = () => updateConfig({ dynamic_fields: [...dynamicFields, { field_key: "", display_label: "", format: "raw" }] });
  const updateDynamicField = (idx, patch) => updateConfig({ dynamic_fields: dynamicFields.map((f, i) => i === idx ? { ...f, ...patch } : f) });
  const removeDynamicField = (idx) => updateConfig({ dynamic_fields: dynamicFields.filter((_, i) => i !== idx) });

  return (
    <EditorShell tabs={TABS}>
      {(tab) => (
        <>
          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Admin Label" value={draft.label} onChange={(v) => updateDraft({ label: v })} required />
              <Field label="Internal Description" value={draft.help_text} onChange={(v) => updateDraft({ help_text: v })} rows={2} />
            </div>
          )}
          {tab === "outcome" && (
            <div className="space-y-4">
              <EditorField label="Qualification Tier">
                <select value={config.qualification_tier || ""}
                  onChange={(e) => updateConfig({ qualification_tier: e.target.value || null })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">None</option>
                  <option value="T1">T1 (Premium)</option>
                  <option value="T2">T2 (Standard)</option>
                  <option value="T3">T3 (Low Value)</option>
                  <option value="DQ">DQ (Disqualified)</option>
                </select>
              </EditorField>
              <Toggle label="Mark run as Complete" value={config.is_complete !== false}
                onChange={(v) => updateConfig({ is_complete: v })} />
              <Toggle label="Mark as Qualified" value={config.is_qualified || false}
                onChange={(v) => updateConfig({ is_qualified: v })} />
              <Toggle label="Mark as Disqualified" value={config.is_disqualified || false}
                onChange={(v) => updateConfig({ is_disqualified: v })} />
            </div>
          )}
          {tab === "template" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 flex-1">Use {"{field_key}"} for interpolation. HTML supported.</p>
                <select defaultValue="" onChange={(e) => { if (e.target.value) updateConfig({ result_template: RESULT_TEMPLATES[e.target.value] }); }}
                  className="h-8 px-2 rounded border border-slate-200 bg-white text-xs">
                  <option value="">Load template...</option>
                  <option value="qualified_high">Qualified (High Value)</option>
                  <option value="qualified_standard">Qualified (Standard)</option>
                  <option value="soft_dq">Soft DQ (Empathetic)</option>
                  <option value="hard_dq">Hard DQ (Brief)</option>
                </select>
              </div>
              <textarea value={config.result_template || ""} rows={16}
                onChange={(e) => updateConfig({ result_template: e.target.value })}
                placeholder="<h2>Thank You, {first_name}!</h2><p>Your case is under review...</p>"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-y" />
            </div>
          )}
          {tab === "dynamic_fields" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Define fields to expose in the result template with formatted display labels.</p>
              {dynamicFields.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap">
                  <div className="w-40">
                    <CustomFieldPicker value={f.field_key} onChange={(v) => updateDynamicField(idx, { field_key: v })} />
                  </div>
                  <input value={f.display_label || ""} onChange={(e) => updateDynamicField(idx, { display_label: e.target.value })}
                    placeholder="Display label" className="flex-1 h-9 px-2 rounded border border-slate-200 bg-white text-sm min-w-[100px]" />
                  <select value={f.format || "raw"} onChange={(e) => updateDynamicField(idx, { format: e.target.value })}
                    className="h-9 px-2 rounded border border-slate-200 bg-white text-sm">
                    {["raw","currency","percent","date"].map((fmt) => <option key={fmt} value={fmt}>{fmt}</option>)}
                  </select>
                  <button type="button" onClick={() => removeDynamicField(idx)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addDynamicField}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-200">
                <Plus size={12} /> Add Dynamic Field
              </button>
            </div>
          )}
          {tab === "redirect" && (
            <div className="space-y-4">
              <Field label="Redirect URL" value={config.redirect_url || ""}
                onChange={(v) => updateConfig({ redirect_url: v })}
                placeholder="https://example.com/thank-you?state={state}"
                helper="Use {field_key} for dynamic interpolation. Leave blank for no redirect." />
              {config.redirect_url && (
                <Field label="Redirect Delay (seconds)" type="number" value={config.redirect_delay_seconds ?? 5}
                  onChange={(v) => updateConfig({ redirect_delay_seconds: Number(v) })} />
              )}
            </div>
          )}
          {tab === "affiliate" && (
            <div className="space-y-4">
              <Toggle label="Show affiliate offers section" value={config.show_affiliate_offers || false}
                onChange={(v) => updateConfig({ show_affiliate_offers: v })} />
              {config.show_affiliate_offers && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Select affiliate offers to display on this results page.</p>
                  {affiliateOffers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No affiliate offers found. Create them in the Affiliate Offers section.</p>
                  ) : (
                    <div className="space-y-2">
                      {affiliateOffers.map((offer) => {
                        const selected = (config.affiliate_offer_ids || []).includes(offer.id);
                        return (
                          <label key={offer.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                            <input type="checkbox" checked={selected} onChange={(e) => {
                              const ids = config.affiliate_offer_ids || [];
                              updateConfig({ affiliate_offer_ids: e.target.checked ? [...ids, offer.id] : ids.filter((id) => id !== offer.id) });
                            }} />
                            <div>
                              <p className="text-sm font-medium text-slate-800">{offer.name || offer.title}</p>
                              <p className="text-xs text-slate-400">{offer.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {tab === "scripts" && (
            <ScriptsEditor value={draft.scripts || []} onChange={(v) => updateDraft({ scripts: v })} triggers={["on_enter"]} />
          )}
        </>
      )}
    </EditorShell>
  );
}