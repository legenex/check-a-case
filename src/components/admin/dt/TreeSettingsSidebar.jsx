import React, { useState } from "react";
import { Settings, Code2, Palette, Globe, Layers } from "lucide-react";

const TABS = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "scripts", label: "Scripts", icon: Code2 },
  { id: "pixels", label: "Pixels", icon: Layers },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "brand", label: "Brand", icon: Globe },
];

export default function TreeSettingsSidebar({ quiz, selectedNode, quizId, brands, onUpdateQuiz, onUpdateNode }) {
  const [activeTab, setActiveTab] = useState("settings");
  const settings = quiz?.settings || {};
  const branding = quiz?.branding_overrides || {};
  const pixels = quiz?.global_pixels || {};
  const scripts = quiz?.global_scripts || [];

  const updateSettings = (patch) => onUpdateQuiz({ settings: { ...settings, ...patch } });
  const updateBranding = (patch) => onUpdateQuiz({ branding_overrides: { ...branding, ...patch } });
  const updatePixels = (patch) => onUpdateQuiz({ global_pixels: { ...pixels, ...patch } });

  return (
    <div className="w-80 flex-shrink-0 bg-card border-l border-border flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            title={t.label}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 text-xs border-b-2 transition-colors ${
              activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === "settings" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Quiz Settings</h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Progress Bar</span>
              <input type="checkbox" checked={settings.progress_bar ?? true} onChange={(e) => updateSettings({ progress_bar: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Show Back Button</span>
              <input type="checkbox" checked={settings.show_back_button ?? true} onChange={(e) => updateSettings({ show_back_button: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Score Enabled</span>
              <input type="checkbox" checked={settings.score_enabled ?? false} onChange={(e) => updateSettings({ score_enabled: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">TCPA Consent</span>
              <input type="checkbox" checked={settings.tcpa_enabled ?? true} onChange={(e) => updateSettings({ tcpa_enabled: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">TrustedForm</span>
              <input type="checkbox" checked={settings.trustedform_enabled ?? true} onChange={(e) => updateSettings({ trustedform_enabled: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Save Partial Leads</span>
              <input type="checkbox" checked={settings.save_partial_leads ?? true} onChange={(e) => updateSettings({ save_partial_leads: e.target.checked })} />
            </label>
            <div>
              <label className="text-xs text-muted-foreground">Auto-advance delay (ms)</label>
              <input type="number" value={settings.auto_advance_ms ?? 120}
                onChange={(e) => updateSettings({ auto_advance_ms: Number(e.target.value) })}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Session timeout (minutes)</label>
              <input type="number" value={settings.session_timeout_minutes ?? 60}
                onChange={(e) => updateSettings({ session_timeout_minutes: Number(e.target.value) })}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Hard DQ redirect</label>
              <input value={settings.dq_redirect_hard || "/Sorry"}
                onChange={(e) => updateSettings({ dq_redirect_hard: e.target.value })}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm font-mono mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Soft DQ redirect</label>
              <input value={settings.dq_redirect_soft || "/Thanks"}
                onChange={(e) => updateSettings({ dq_redirect_soft: e.target.value })}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm font-mono mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Success redirect</label>
              <input value={settings.success_redirect || "/Submitted"}
                onChange={(e) => updateSettings({ success_redirect: e.target.value })}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm font-mono mt-0.5" />
            </div>
            {settings.tcpa_enabled && (
              <div>
                <label className="text-xs text-muted-foreground">TCPA Text</label>
                <textarea value={settings.tcpa_text || ""}
                  onChange={(e) => updateSettings({ tcpa_text: e.target.value })}
                  rows={5}
                  className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs resize-y mt-0.5" />
              </div>
            )}
          </div>
        )}

        {activeTab === "scripts" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Global Scripts</h3>
            <p className="text-xs text-muted-foreground">Run at the tree level, not per-node.</p>
            {scripts.map((script, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <input value={script.name} onChange={(e) => {
                    const updated = scripts.map((s, i) => i === idx ? { ...s, name: e.target.value } : s);
                    onUpdateQuiz({ global_scripts: updated });
                  }} placeholder="Name" className="flex-1 h-7 px-2 rounded border border-input bg-background text-xs" />
                  <select value={script.trigger} onChange={(e) => {
                    const updated = scripts.map((s, i) => i === idx ? { ...s, trigger: e.target.value } : s);
                    onUpdateQuiz({ global_scripts: updated });
                  }} className="h-7 px-1 rounded border border-input bg-background text-xs">
                    {["on_load","on_start","on_complete","on_disqualify","on_partial_save"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <textarea value={script.code} onChange={(e) => {
                  const updated = scripts.map((s, i) => i === idx ? { ...s, code: e.target.value } : s);
                  onUpdateQuiz({ global_scripts: updated });
                }} rows={4} className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs font-mono resize-y" />
              </div>
            ))}
            <button onClick={() => onUpdateQuiz({ global_scripts: [...scripts, { name: "", trigger: "on_load", language: "javascript", code: "", is_enabled: true }] })}
              className="w-full flex items-center justify-center gap-1 py-2 rounded border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              + Add Script
            </button>
          </div>
        )}

        {activeTab === "pixels" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Pixel IDs</h3>
            {[
              { key: "meta_pixel_id", label: "Meta Pixel ID" },
              { key: "ga4_id", label: "GA4 Measurement ID" },
              { key: "google_ads_id", label: "Google Ads Conversion ID" },
              { key: "tiktok_pixel_id", label: "TikTok Pixel ID" },
              { key: "taboola_pixel_id", label: "Taboola Pixel ID" },
              { key: "snapchat_pixel_id", label: "Snapchat Pixel ID" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <input value={pixels[key] || ""}
                  onChange={(e) => updatePixels({ [key]: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-input bg-background text-sm font-mono mt-0.5" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "branding" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Branding Overrides</h3>
            <p className="text-xs text-muted-foreground">Leave blank to inherit from the assigned brand.</p>
            {[
              { key: "logo_url", label: "Logo URL", type: "text" },
              { key: "primary_color", label: "Primary Color", type: "text" },
              { key: "accent_color", label: "Accent Color", type: "text" },
              { key: "background_color", label: "Background Color", type: "text" },
              { key: "text_color", label: "Text Color", type: "text" },
              { key: "phone_number", label: "Phone Number", type: "text" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <input type={type} value={branding[key] || ""}
                  onChange={(e) => updateBranding({ [key]: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5" />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground">Custom CSS</label>
              <textarea value={branding.custom_css || ""}
                onChange={(e) => updateBranding({ custom_css: e.target.value })}
                rows={4}
                className="w-full px-2 py-1.5 rounded border border-input bg-background text-sm font-mono resize-y mt-0.5" />
            </div>
          </div>
        )}

        {activeTab === "brand" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Brand Assignment</h3>
            <div>
              <label className="text-xs text-muted-foreground">Assigned Brand</label>
              <select value={quiz?.brand_id || ""}
                onChange={(e) => onUpdateQuiz({ brand_id: e.target.value || null })}
                className="w-full h-9 px-2 rounded border border-input bg-background text-sm mt-0.5">
                <option value="">None (use site default)</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.brand_name} ({b.brand_key})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Campaign Type</label>
              <select value={quiz?.campaign_type || "mva"}
                onChange={(e) => onUpdateQuiz({ campaign_type: e.target.value })}
                className="w-full h-9 px-2 rounded border border-input bg-background text-sm mt-0.5">
                {["mva","mass_tort","workers_comp","slip_and_fall","med_mal","custom"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tags (comma separated)</label>
              <input value={(quiz?.tags || []).join(", ")}
                onChange={(e) => onUpdateQuiz({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                placeholder="mva, cac, v2"
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input type="checkbox" checked={quiz?.is_template || false}
                onChange={(e) => onUpdateQuiz({ is_template: e.target.checked })} />
              <span className="text-sm">Mark as template</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}