import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Wand2 } from "lucide-react";
import { uuidv4 } from "@/lib/uuid";

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function NewDecisionTreeModal({ open, onClose, onCreated }) {
  const [tab, setTab] = useState("blank");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [builderMode, setBuilderMode] = useState("basic");
  const [saving, setSaving] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["quiz-templates"],
    queryFn: () => base44.entities.Quiz.filter({ is_template: true }),
  });

  const handleTitleChange = (val) => {
    setTitle(val);
    setSlug(slugify(val));
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const quiz = await base44.entities.Quiz.create({
      title: title.trim(),
      slug: slug || slugify(title),
      builder_mode: builderMode,
      campaign_type: "mva",
      status: "draft",
      version: 1,
      total_nodes: 1,
      is_template: false,
      tags: [],
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
    // Create default start_page node
    await base44.entities.Question.create({
      node_id: uuidv4(),
      quiz_id: quiz.id,
      node_type: "start_page",
      order_index: 0,
      position_x: 0,
      position_y: 100,
      label: "Start Page",
      title_display: title.trim(),
      required: false,
      answer_options: [],
      custom_field_assignments: [],
      validation_rules: [],
      tags_to_add: [],
      tags_to_remove: [],
      scripts: [],
      config: { url_param_handlers: [] },
    });
    setSaving(false);
    setTitle("");
    setSlug("");
    onCreated(quiz.id);
  };

  const handleCloneTemplate = async (template) => {
    setSaving(true);
    const copy = await base44.entities.Quiz.create({
      ...template,
      id: undefined,
      title: `${template.title} (copy)`,
      slug: `${template.slug}-copy`,
      status: "draft",
      is_template: false,
      total_starts: 0,
      total_completes: 0,
      total_qualified: 0,
      total_disqualified: 0,
    });
    const questions = await base44.entities.Question.filter({ quiz_id: template.id });
    if (questions.length > 0) {
      await base44.entities.Question.bulkCreate(questions.map((q) => ({ ...q, id: undefined, quiz_id: copy.id })));
    }
    setSaving(false);
    onCreated(copy.id);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Decision Tree</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="blank" className="flex-1">Start from Blank</TabsTrigger>
            <TabsTrigger value="template" className="flex-1">From Template</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">
              Generate with AI
              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">Phase 3</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blank" className="space-y-4 mt-4">
            <div>
              <Label>Builder Mode</Label>
              <div className="flex gap-3 mt-2">
                {["basic", "advanced"].map((m) => (
                  <button
                    key={m}
                    onClick={() => m === "basic" && setBuilderMode(m)}
                    disabled={m === "advanced"}
                    className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      builderMode === m ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    {m === "basic" ? "Basic (linear list)" : "Advanced (visual canvas)"}
                    {m === "advanced" && <div className="text-xs text-muted-foreground mt-0.5">Coming in Phase 2</div>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Title *</Label>
              <Input className="mt-1" placeholder="e.g., MVA Qualification Quiz" value={title} onChange={(e) => handleTitleChange(e.target.value)} />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input className="mt-1 font-mono text-sm" placeholder="auto-generated" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={saving || !title.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create & Open Builder
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="template" className="mt-4">
            {templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="font-medium">No templates yet</p>
                <p className="text-sm mt-1">Mark a decision tree as a template to see it here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <button key={t.id} onClick={() => handleCloneTemplate(t)} className="w-full text-left p-4 rounded-xl border hover:border-primary transition-colors">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.total_nodes || 0} nodes</div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">AI Generation Coming in Phase 3</p>
              <p className="text-sm mt-1">Generate complete decision trees from a prompt using AI.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}