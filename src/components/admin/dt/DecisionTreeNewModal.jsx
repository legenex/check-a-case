import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Copy } from "lucide-react";
import AIWizard from "./AIWizard";

const TABS = ["Start from Blank", "Start from Template", "Generate with AI"];

export default function DecisionTreeNewModal({ onClose, onCreated }) {
  const [tab, setTab] = useState(0);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [campaignType, setCampaignType] = useState("mva");

  const { data: templates = [] } = useQuery({
    queryKey: ["quiz-templates"],
    queryFn: () => base44.entities.Quiz.filter({ is_template: true }, "-updated_date", 50),
  });

  const cloneTemplateMut = useMutation({
    mutationFn: async (template) => {
      const newSlug = template.slug.replace(/-template$/, "") + "-" + Date.now().toString(36);
      const newQuiz = await base44.entities.Quiz.create({
        ...template,
        id: undefined,
        title: template.title.replace(" Template", "") + " (Copy)",
        slug: newSlug,
        status: "draft",
        is_template: false,
        total_starts: 0, total_completes: 0, total_qualified: 0, total_disqualified: 0,
        published_at: null,
      });
      const questions = await base44.entities.Question.filter({ quiz_id: template.id });
      const edges = await base44.entities.Edge.filter({ quiz_id: template.id });
      for (const q of questions) {
        await base44.entities.Question.create({ ...q, id: undefined, quiz_id: newQuiz.id, node_id: crypto.randomUUID() });
      }
      for (const e of edges) {
        await base44.entities.Edge.create({ ...e, id: undefined, quiz_id: newQuiz.id, edge_id: crypto.randomUUID() });
      }
      return newQuiz;
    },
    onSuccess: (quiz) => onCreated(quiz.id),
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const quiz = await base44.entities.Quiz.create({
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
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
              {i === 2 && <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">AI</span>}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div className="space-y-4">
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
          <div className="py-2 max-h-[60vh] overflow-y-auto">
            {templates.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-4xl mb-4">📋</p>
                <p className="font-medium">No templates yet</p>
                <p className="text-sm mt-1">Click the bookmark icon on any tree to save it as a template.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.campaign_type} - {t.total_nodes || 0} nodes</p>
                    </div>
                    <button
                      onClick={() => cloneTemplateMut.mutate(t)}
                      disabled={cloneTemplateMut.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0">
                      <Copy className="w-3 h-3" />
                      {cloneTemplateMut.isPending ? "Cloning..." : "Use Template"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 2 && (
          <AIWizard onCreated={(quizId) => { onCreated(quizId); }} />
        )}
      </div>
    </div>
  );
}