import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, CheckSquare, Square, Cpu, AlertTriangle } from "lucide-react";

const HUMANIZER_PROMPT = `You are editing a draft to remove signs of AI-generated writing while preserving meaning, accuracy, and tone. Do not introduce new factual claims. Do not change quoted material.

REMOVE / REPLACE:
- Inflated symbolism: "stands as a testament to", "underscores the importance of", "speaks to" → cut or rewrite plainly.
- Promotional language: "rich cultural heritage", "breathtaking", "must-see", "world-class", "stunning", "vibrant", "bustling", "iconic" → cut or replace with concrete detail.
- Vague attributions: "experts say", "many believe", "studies show" without source → either cite a real source or cut.
- Em dash overuse: convert most em dashes to commas, periods, or parentheses.
- AI vocabulary: "delve", "navigate", "leverage", "robust", "seamless", "moreover", "furthermore", "in conclusion", "it's important to note that", "ultimately", "crucial", "vital", "essential" → use plainer alternatives.
- Passive voice when active is clearer.
- Filler phrases: "It's worth noting that", "It goes without saying", "At the end of the day" → delete.

PRESERVE: Factual claims, numbers, citations, quoted material, tone, headings, code, tables, lists.

OUTPUT: only the revised text. No commentary.`;

export default function BlogSeoWizard({ onPostsCreated }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(1); // 1=seeds, 2=plan, 3=drafting, 4=humanizing, 5=done
  const [seeds, setSeeds] = useState("");
  const [category, setCategory] = useState("Auto Accident");
  const [wordCount, setWordCount] = useState(1200);
  const [angles, setAngles] = useState([]); // [{seed, angle, selected}]
  const [drafts, setDrafts] = useState([]); // [{angle, postId, title, status}]
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const seedList = seeds.split("\n").map((s) => s.trim()).filter(Boolean);
  const tooMany = seedList.length * 4 > 50;

  const generatePlan = async () => {
    if (!seedList.length) return;
    setLoading(true);
    setProgress("Generating article angles from your seeds…");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a content strategist for a personal injury law website (checkacase.com). 
Given these topic seeds, generate 3-5 distinct article angle ideas for EACH seed. 
Return ONLY a JSON object in this format: { "angles": [ { "seed": "...", "angle": "...", "suggested_title": "...", "target_intent": "informational|commercial" } ] }

Seeds:
${seedList.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Focus on: accident victims, settlement questions, legal rights, insurance tactics. Avoid fabricated statistics.`,
      response_json_schema: {
        type: "object",
        properties: {
          angles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                seed: { type: "string" },
                angle: { type: "string" },
                suggested_title: { type: "string" },
                target_intent: { type: "string" },
              },
            },
          },
        },
      },
    });
    setAngles((result.angles || []).map((a) => ({ ...a, selected: true })));
    setLoading(false);
    setStep(2);
  };

  const generateDrafts = async () => {
    const selected = angles.filter((a) => a.selected);
    if (!selected.length) return;
    setLoading(true);
    setStep(3);
    const newDrafts = [];

    for (let i = 0; i < selected.length; i++) {
      const a = selected[i];
      setProgress(`Drafting "${a.suggested_title}" (${i + 1}/${selected.length})…`);
      const slug = a.suggested_title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const body = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a ${wordCount}-word blog post for a personal injury law website.
Title: "${a.suggested_title}"
Angle: ${a.angle}
Category: ${category}

Write clean markdown with H2/H3 sections. Tone: professional, empathetic, for accident victims.
Do NOT fabricate statistics, cases, or quotes. No AI clichés.`,
      });
      const words = (body || "").split(/\s+/).filter(Boolean).length;
      const post = await base44.entities.BlogPost.create({
        title: a.suggested_title,
        slug,
        body,
        category,
        status: "draft",
        generated_by_ai: true,
        humanizer_pass_count: 0,
        read_time_minutes: Math.max(1, Math.ceil(words / 200)),
        word_count: words,
      });
      newDrafts.push({ angle: a.angle, postId: post.id, title: a.suggested_title, humanized: false });
    }

    setDrafts(newDrafts);
    setLoading(false);
    setStep(4);
    setProgress("");
  };

  const humanizeDrafts = async () => {
    setLoading(true);
    setStep(4);
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      setProgress(`Humanizing "${d.title}" (${i + 1}/${drafts.length})…`);
      const post = await base44.entities.BlogPost.filter({ id: d.postId });
      const current = post[0];
      if (!current) continue;
      const humanized = await base44.integrations.Core.InvokeLLM({
        prompt: `${HUMANIZER_PROMPT}\n\n---\n\n${current.body}`,
      });
      await base44.entities.BlogPost.update(d.postId, {
        body: humanized,
        humanizer_pass_count: (current.humanizer_pass_count || 0) + 1,
      });
    }
    setDrafts((prev) => prev.map((d) => ({ ...d, humanized: true })));
    qc.invalidateQueries({ queryKey: ["blog-posts"] });
    setLoading(false);
    setStep(5);
    setProgress("");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Cpu className="w-6 h-6 text-purple-500" />
        <div>
          <h2 className="font-bold text-lg">Programmatic SEO Wizard</h2>
          <p className="text-sm text-muted-foreground">Turn topic seeds into humanized draft posts in minutes.</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 flex-wrap">
        {["Seeds", "Plan", "Draft", "Humanize", "Done"].map((s, i) => (
          <div key={s} className={`flex items-center gap-1 text-sm ${step > i + 1 ? "text-green-600" : step === i + 1 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? "bg-green-100" : step === i + 1 ? "bg-primary/10" : "bg-muted"}`}>{i + 1}</span>
            {s}
            {i < 4 && <span className="mx-1 text-muted-foreground">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Seeds */}
      {step === 1 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium">Topic Seeds <span className="text-muted-foreground">(one per line)</span></label>
              <Textarea value={seeds} onChange={(e) => setSeeds(e.target.value)}
                placeholder={"how long after car accident can you file a claim\nwhat to do after a rear end collision\nhow much is my whiplash claim worth"}
                className="mt-1 min-h-[140px] font-mono text-sm" />
              <p className="text-xs text-muted-foreground mt-1">{seedList.length} seeds entered · ~{Math.min(seedList.length * 4, 50)} articles estimated</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 h-9" />
              </div>
              <div>
                <label className="text-sm font-medium">Target Word Count</label>
                <Input type="number" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} className="mt-1 h-9" min={600} max={3000} />
              </div>
            </div>
            {tooMany && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                This batch may generate 50+ drafts. Consider reducing seeds or approving fewer angles in the next step.
              </div>
            )}
            <Button onClick={generatePlan} disabled={loading || !seedList.length}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Generate Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Approve angles */}
      {step === 2 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Approve Article Angles</p>
              <p className="text-sm text-muted-foreground">{angles.filter((a) => a.selected).length} selected</p>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {angles.map((a, i) => (
                <button key={i} onClick={() => setAngles((prev) => prev.map((x, j) => j === i ? { ...x, selected: !x.selected } : x))}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${a.selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className="flex items-start gap-2">
                    {a.selected ? <CheckSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> : <Square className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className="font-medium text-sm">{a.suggested_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.angle}</p>
                      <Badge className="mt-1 text-xs bg-muted text-muted-foreground">{a.target_intent}</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={generateDrafts} disabled={loading || !angles.filter((a) => a.selected).length}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate {angles.filter((a) => a.selected).length} Drafts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3/4: Progress */}
      {(step === 3 || (step === 4 && loading)) && (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="font-semibold text-foreground">{step === 3 ? "Generating Drafts…" : "Humanizing…"}</p>
            <p className="text-sm text-muted-foreground">{progress}</p>
            <p className="text-xs text-muted-foreground">This may take a few minutes. Please keep this tab open.</p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Humanize */}
      {step === 4 && !loading && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="font-semibold">{drafts.length} drafts created. Run humanizer pass?</p>
            <p className="text-sm text-muted-foreground">The humanizer removes AI writing patterns (filler phrases, passive voice, em-dash overuse) without changing facts.</p>
            <div className="space-y-2">
              {drafts.map((d) => (
                <div key={d.postId} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="truncate">{d.title}</span>
                  <Badge className="text-xs bg-muted text-muted-foreground ml-auto flex-shrink-0">draft</Badge>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { qc.invalidateQueries({ queryKey: ["blog-posts"] }); onPostsCreated(); }}>
                Skip — Go to Drafts
              </Button>
              <Button onClick={humanizeDrafts}>
                <Wand2 className="w-4 h-4 mr-2" />Run Humanizer Pass
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Done */}
      {step === 5 && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-5xl">✅</p>
            <p className="font-bold text-xl">{drafts.length} posts ready for review</p>
            <p className="text-muted-foreground text-sm">All posts have been saved as drafts. Review them in the All Posts tab, edit as needed, then publish.</p>
            <Button onClick={onPostsCreated}>View All Posts</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}