import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const TABS = ["Start from Blank", "Start from Template", "Generate with AI"];

export default function DecisionTreeNewModal({ onClose, onCreated }) {
  const [tab, setTab] = useState(0);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [builderMode, setBuilderMode] = useState("basic");
  const [campaignType, setCampaignType] = useState("mva");

  const createMut = useMutation({
    mutationFn: async () => {
      const quiz = await base44.entities.Quiz.create({
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        builder_mode: builderMode,
        campaign_type: campaignType,
        status: "draft",
        version: 1,
        total_nodes: 1,
        settings: {
          progress_bar: true,
          show_back_button: true,
          auto_advance_ms: 120,
          score_enabled: false,
          tcpa_enabled: true,
          trustedform_enabled: true,
          session_timeout_minutes: 60,
          save_partial_leads: true,
        },
      });
      // Seed a start_page node
      await base44.entities.Question.create({
        node_id: crypto.randomUUID(),
        quiz_id: quiz.id,
        node_type: "start_page",
        order_index: 0,
        position_x: 0,
        position_y: 100,
        label: "Start Page",
        title_display: title,
        required: false,
        answer_options: [],
        config: {},
      });
      return quiz;
    },
    onSuccess: (quiz) => onCreated(quiz.id),
  });

  const handleTitleChange = (v) => {
    setTitle(v);
    if (!slug) setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-lg space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">New Decision Tree</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border">
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${tab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t}
              {i === 2 && <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Phase 3</span>}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Builder Mode</label>
              <div className="flex gap-3">
                {["basic", "advanced"].map((m) => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={builderMode === m} onChange={() => setBuilderMode(m)} disabled={m === "advanced"} />
                    <span className={`text-sm ${m === "advanced" ? "text-muted-foreground" : ""}`}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                      {m === "advanced" && <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded">Phase 2</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title <span className="text-destructive">*</span></label>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Auto Accident Qualifier"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="auto-accident-qualifier"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Type</label>
              <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                <option value="mva">MVA</option>
                <option value="mass_tort">Mass Tort</option>
                <option value="workers_comp">Workers Comp</option>
                <option value="slip_and_fall">Slip and Fall</option>
                <option value="med_mal">Med Mal</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={() => createMut.mutate()}
                disabled={!title || createMut.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                {createMut.isPending ? "Creating..." : "Create and Open Builder"}
              </button>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-medium">No templates yet</p>
            <p className="text-sm mt-1">Mark any decision tree as a template to find it here.</p>
          </div>
        )}

        {tab === 2 && (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-4xl mb-4">🤖</p>
            <p className="font-medium">AI Generation coming in Phase 3</p>
            <p className="text-sm mt-1">Describe your qualification flow and let AI build it for you.</p>
          </div>
        )}
      </div>
    </div>
  );
}