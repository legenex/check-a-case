import React, { useState } from "react";
import { Settings, Palette, Globe, Layers, Code2, Clock, BarChart2, RotateCcw, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const TABS = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "brand", label: "Brand", icon: Globe },
  { id: "pixels", label: "Pixels", icon: Layers },
  { id: "scripts", label: "Scripts", icon: Code2 },
  { id: "versioning", label: "Versions", icon: Clock },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
];

export default function TreeInspectorPanel({ quiz, quizId, brands, onUpdateQuiz }) {
  const [activeTab, setActiveTab] = useState("settings");
  const [rollbackConfirm, setRollbackConfirm] = useState(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const settings = quiz?.settings || {};
  const branding = quiz?.branding_overrides || {};
  const pixels = quiz?.global_pixels || {};
  const scripts = quiz?.global_scripts || [];

  const updateSettings = (patch) => onUpdateQuiz({ settings: { ...settings, ...patch } });
  const updateBranding = (patch) => onUpdateQuiz({ branding_overrides: { ...branding, ...patch } });
  const updatePixels = (patch) => onUpdateQuiz({ global_pixels: { ...pixels, ...patch } });

  const brand = brands.find((b) => b.id === quiz?.brand_id);

  return (
    <div className="w-[360px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <p className="font-semibold text-sm text-slate-900">Tree Settings</p>
        <p className="text-[10px] text-slate-400">No node selected</p>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            title={t.label}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] border-b-2 transition-colors
              ${activeTab === t.id ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <t.icon size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "settings" && (
          <div className="space-y-4">
            {[
              { key: "progress_bar", label: "Progress Bar", type: "bool", def: true },
              { key: "show_back_button", label: "Show Back Button", type: "bool", def: true },
              { key: "score_enabled", label: "Score Enabled", type: "bool", def: false },
              { key: "tcpa_enabled", label: "TCPA Consent", type: "bool", def: true },
              { key: "trustedform_enabled", label: "TrustedForm", type: "bool", def: true },
              { key: "save_partial_leads", label: "Save Partial Leads", type: "bool", def: true },
            ].map(({ key, label, def }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-700">{label}</span>
                <input type="checkbox" checked={settings[key] ?? def}
                  onChange={(e) => updateSettings({ [key]: e.target.checked })}
                  className="w-4 h-4 accent-blue-600" />
              </label>
            ))}
            {[
              { key: "auto_advance_ms", label: "Auto-advance delay (ms)", def: 120 },
              { key: "session_timeout_minutes", label: "Session timeout (min)", def: 60 },
              { key: "lead_capture_step_index", label: "Lead capture step index", def: 6 },
            ].map(({ key, label, def }) => (
              <div key={key}>
                <label className="text-xs text-slate-500">{label}</label>
                <input type="number" value={settings[key] ?? def}
                  onChange={(e) => updateSettings({ [key]: Number(e.target.value) })}
                  className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5" />
              </div>
            ))}
            {[
              { key: "dq_redirect_hard", label: "Hard DQ redirect", def: "/Sorry" },
              { key: "dq_redirect_soft", label: "Soft DQ redirect", def: "/Thanks" },
              { key: "success_redirect", label: "Success redirect", def: "/Submitted" },
            ].map(({ key, label, def }) => (
              <div key={key}>
                <label className="text-xs text-slate-500">{label}</label>
                <input value={settings[key] || def}
                  onChange={(e) => updateSettings({ [key]: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm font-mono mt-0.5" />
              </div>
            ))}
            {settings.tcpa_enabled && (
              <div>
                <label className="text-xs text-slate-500">TCPA Text</label>
                <textarea value={settings.tcpa_text || ""} rows={4}
                  onChange={(e) => updateSettings({ tcpa_text: e.target.value })}
                  className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs resize-y mt-0.5" />
              </div>
            )}
          </div>
        )}

        {activeTab === "branding" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Leave blank to inherit from the assigned brand.</p>
            {[
              { key: "logo_url", label: "Logo URL" },
              { key: "primary_color", label: "Primary Color" },
              { key: "accent_color", label: "Accent Color" },
              { key: "background_color", label: "Background Color" },
              { key: "text_color", label: "Text Color" },
              { key: "phone_number", label: "Phone Number" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-slate-500">{label}</label>
                <input value={branding[key] || ""}
                  onChange={(e) => updateBranding({ [key]: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5" />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500">Custom CSS</label>
              <textarea value={branding.custom_css || ""} rows={5}
                onChange={(e) => updateBranding({ custom_css: e.target.value })}
                className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs font-mono resize-y mt-0.5" />
            </div>
          </div>
        )}

        {activeTab === "brand" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">Assigned Brand</label>
              <select value={quiz?.brand_id || ""}
                onChange={(e) => onUpdateQuiz({ brand_id: e.target.value || null })}
                className="w-full h-9 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5">
                <option value="">None (use site default)</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.brand_name} ({b.brand_key})</option>)}
              </select>
            </div>
            {brand && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                {brand.logo_url && <img src={brand.logo_url} alt={brand.brand_name} className="h-8 object-contain" />}
                <p className="text-sm font-semibold text-slate-800">{brand.brand_name}</p>
                <p className="text-xs text-slate-500 font-mono">{brand.primary_domain}</p>
                {brand.primary_color && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-4 h-4 rounded" style={{ background: brand.primary_color }} />
                    {brand.primary_color}
                  </div>
                )}
                {brand.phone_number && <p className="text-xs text-slate-600">{brand.phone_number}</p>}
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500">Campaign Type</label>
              <select value={quiz?.campaign_type || "mva"}
                onChange={(e) => onUpdateQuiz({ campaign_type: e.target.value })}
                className="w-full h-9 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5">
                {["mva","mass_tort","workers_comp","slip_and_fall","med_mal","custom"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === "pixels" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Pixel IDs</h3>
            {[
              { key: "meta_pixel_id", label: "Meta Pixel ID" },
              { key: "ga4_id", label: "GA4 Measurement ID" },
              { key: "google_ads_id", label: "Google Ads Conversion ID" },
              { key: "tiktok_pixel_id", label: "TikTok Pixel ID" },
              { key: "taboola_pixel_id", label: "Taboola Pixel ID" },
              { key: "snapchat_pixel_id", label: "Snapchat Pixel ID" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-slate-500">{label}</label>
                <input value={pixels[key] || ""}
                  onChange={(e) => updatePixels({ [key]: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm font-mono mt-0.5" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "scripts" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Global Scripts</h3>
            <p className="text-xs text-slate-500">Run at tree level. Triggers: on_load, on_start, on_complete, on_disqualify, on_partial_save.</p>
            {scripts.map((script, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input value={script.name || ""} placeholder="Script name"
                    onChange={(e) => {
                      const updated = scripts.map((s, i) => i === idx ? { ...s, name: e.target.value } : s);
                      onUpdateQuiz({ global_scripts: updated });
                    }}
                    className="flex-1 h-7 px-2 rounded border border-slate-200 bg-white text-xs" />
                  <select value={script.trigger || "on_load"}
                    onChange={(e) => {
                      const updated = scripts.map((s, i) => i === idx ? { ...s, trigger: e.target.value } : s);
                      onUpdateQuiz({ global_scripts: updated });
                    }}
                    className="h-7 px-1 rounded border border-slate-200 bg-white text-xs">
                    {["on_load","on_start","on_complete","on_disqualify","on_partial_save"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => onUpdateQuiz({ global_scripts: scripts.filter((_, i) => i !== idx) })}
                    className="text-red-400 hover:text-red-600 transition-colors text-xs">x</button>
                </div>
                <textarea value={script.code || ""} rows={4} placeholder="// JavaScript"
                  onChange={(e) => {
                    const updated = scripts.map((s, i) => i === idx ? { ...s, code: e.target.value } : s);
                    onUpdateQuiz({ global_scripts: updated });
                  }}
                  className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs font-mono resize-y" />
              </div>
            ))}
            <button onClick={() => onUpdateQuiz({ global_scripts: [...scripts, { name: "", trigger: "on_load", language: "javascript", code: "", is_enabled: true }] })}
              className="w-full flex items-center justify-center gap-1 py-2 rounded border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
              + Add Script
            </button>
          </div>
        )}

        {activeTab === "versioning" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Version History</h3>
            <p className="text-xs text-slate-500">Current version: v{quiz?.version || 1}</p>
            {(quiz?.version_history || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No published versions yet. Publish the tree to create a snapshot.</p>
            ) : (
              <div className="space-y-2">
                {[...(quiz?.version_history || [])].reverse().map((v) => (
                  <div key={v.version} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">v{v.version}</span>
                      <span className="text-xs text-slate-400">{v.published_at ? new Date(v.published_at).toLocaleDateString() : ""}</span>
                    </div>
                    {v.published_by && <p className="text-xs text-slate-500 mt-0.5">by {v.published_by}</p>}
                    {v.tag && <p className="text-xs text-amber-600 mt-0.5 font-mono">{v.tag}</p>}
                    {v.nodes_snapshot && (
                      <button
                        onClick={() => setRollbackConfirm(v)}
                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                        <RotateCcw className="w-3 h-3" /> Rollback to v{v.version}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {rollbackConfirm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRollbackConfirm(null)}>
                <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
                  <h2 className="text-lg font-bold text-slate-800">Rollback to v{rollbackConfirm.version}?</h2>
                  <p className="text-sm text-slate-600">
                    Current state will be backed up as a new version entry. The tree will revert to its v{rollbackConfirm.version} state and be set to draft.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setRollbackConfirm(null)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">Cancel</button>
                    <button
                      onClick={async () => {
                        const snapshot = rollbackConfirm;
                        const currentVersion = quiz?.version || 1;
                        // Backup current state into version_history
                        const dbQuestions = await base44.entities.Question.filter({ quiz_id: quizId });
                        const dbEdges = await base44.entities.Edge.filter({ quiz_id: quizId });
                        const backupEntry = {
                          version: currentVersion,
                          published_at: new Date().toISOString(),
                          published_by: "system",
                          tag: `pre_rollback_v${snapshot.version + 1}`,
                          nodes_snapshot: dbQuestions,
                          edges_snapshot: dbEdges,
                        };
                        const existingHistory = quiz?.version_history || [];
                        const newHistory = [...existingHistory, backupEntry];

                        // Delete current nodes + edges
                        for (const q of dbQuestions) await base44.entities.Question.delete(q.id);
                        for (const e of dbEdges) await base44.entities.Edge.delete(e.id);

                        // Recreate from snapshot
                        for (const n of snapshot.nodes_snapshot) {
                          await base44.entities.Question.create({ ...n, id: undefined, quiz_id: quizId });
                        }
                        for (const e of (snapshot.edges_snapshot || [])) {
                          await base44.entities.Edge.create({ ...e, id: undefined, quiz_id: quizId });
                        }

                        // Update quiz
                        await base44.entities.Quiz.update(quizId, {
                          version: currentVersion + 1,
                          status: "draft",
                          version_history: newHistory,
                        });

                        qc.invalidateQueries(["quiz", quizId]);
                        qc.invalidateQueries(["questions", quizId]);
                        qc.invalidateQueries(["edges", quizId]);
                        setRollbackConfirm(null);
                        alert(`Rolled back to v${snapshot.version}. Tree is now draft. Publish when ready.`);
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                      Confirm Rollback
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Analytics</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Starts", val: quiz?.total_starts || 0 },
                { label: "Completes", val: quiz?.total_completes || 0 },
                { label: "Qualified", val: quiz?.total_qualified || 0 },
                { label: "DQ", val: quiz?.total_disqualified || 0 },
              ].map(({ label, val }) => (
                <div key={label} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
                  <p className="text-xl font-bold text-slate-700">{val}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate(`/admin/decision-trees/${quizId}/analytics`)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Open Full Analytics
            </button>
          </div>
        )}
      </div>
    </div>
  );
}