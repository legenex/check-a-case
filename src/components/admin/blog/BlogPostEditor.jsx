import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Globe, Loader2, Upload, Wand2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function calcReadTime(text) {
  const words = (text || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const CATEGORIES = ["Auto Accident", "Work Accident", "Slip & Fall", "Medical Malpractice", "Legal Tips", "Settlement Guide", "Other"];

export default function BlogPostEditor({ post, onBack, onSaved }) {
  const qc = useQueryClient();
  const isNew = !post?.id;

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", body: "", category: "", tags: [],
    hero_image_url: "", author: "Check A Case Editorial", status: "draft",
    scheduled_at: "", seo_title: "", seo_description: "", og_image_url: "",
    ...(post || {}),
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [slugManuallySet, setSlugManuallySet] = useState(!isNew);

  useEffect(() => {
    if (!slugManuallySet && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title, slugManuallySet]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const save = async (statusOverride) => {
    setSaving(true);
    const data = {
      ...form,
      status: statusOverride || form.status,
      read_time_minutes: calcReadTime(form.body),
      word_count: (form.body || "").split(/\s+/).filter(Boolean).length,
      published_date: (statusOverride === "published" || form.status === "published") && !form.published_date
        ? new Date().toISOString() : form.published_date,
    };
    // Handle slug redirect if slug changed on existing post
    if (!isNew && post.slug && post.slug !== data.slug && post.status === "published") {
      data.slug_redirects = [...(form.slug_redirects || []), post.slug];
    }
    let saved;
    if (isNew) {
      saved = await base44.entities.BlogPost.create(data);
    } else {
      saved = await base44.entities.BlogPost.update(post.id, data);
    }
    qc.invalidateQueries({ queryKey: ["blog-posts"] });
    setSaving(false);
    onSaved(saved);
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("hero_image_url", file_url);
    setUploading(false);
  };

  const handleAiGenerate = async () => {
    if (!form.title) return;
    setAiGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a comprehensive blog post for a personal injury law website.
Title: "${form.title}"
Category: ${form.category || "General"}
Word count target: ~1200 words

Write in clean markdown with:
- An engaging intro paragraph
- 3-4 H2 sections with practical information
- A conclusion with a clear call-to-action to get a free case review at checkacase.com

Tone: professional, empathetic, informative. Do NOT use legal jargon. Write for accident victims, not attorneys.
Do NOT fabricate statistics or cases. Do NOT use AI clichés like "delve into", "navigate", "leverage", "robust".`,
    });
    set("body", result);
    setAiGenerating(false);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Posts
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => save("draft")} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </Button>
          <Button size="sm" onClick={() => save("published")} disabled={saving}>
            <Globe className="w-4 h-4" /> Publish
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <Input
            placeholder="Post title…"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="text-xl font-bold h-12"
          />

          {/* Body editor */}
          <Tabs defaultValue="write">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" onClick={handleAiGenerate} disabled={aiGenerating || !form.title}>
                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                AI Draft
              </Button>
            </div>
            <TabsContent value="write">
              <Textarea
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder="Write your post in Markdown…"
                className="min-h-[500px] font-mono text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(form.body || "").split(/\s+/).filter(Boolean).length} words · ~{calcReadTime(form.body)} min read
              </p>
            </TabsContent>
            <TabsContent value="preview">
              <div className="min-h-[500px] border rounded-lg p-6 prose prose-sm max-w-none overflow-auto">
                <ReactMarkdown>{form.body || "*Nothing to preview yet.*"}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>

          {/* Excerpt */}
          <div>
            <label className="text-sm font-medium text-foreground">Excerpt</label>
            <Textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="Short description shown in listings and SEO…"
              className="mt-1 h-20 resize-none"
            />
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">
          {/* Status & Publish */}
          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <p className="font-semibold text-sm">Publish Settings</p>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {form.status === "scheduled" && (
              <div>
                <label className="text-xs text-muted-foreground">Publish At</label>
                <Input type="datetime-local" value={form.scheduled_at?.slice(0, 16) || ""}
                  onChange={(e) => set("scheduled_at", new Date(e.target.value).toISOString())}
                  className="mt-1 h-9" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">Author</label>
              <Input value={form.author} onChange={(e) => set("author", e.target.value)} className="mt-1 h-9" />
            </div>
          </div>

          {/* Slug */}
          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <p className="font-semibold text-sm">URL Slug</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">/blog/</span>
              <Input
                value={form.slug}
                onChange={(e) => { setSlugManuallySet(true); set("slug", slugify(e.target.value)); }}
                className="h-8 text-sm"
              />
            </div>
            {!isNew && post.slug !== form.slug && (
              <p className="text-xs text-amber-600">Old slug will be added to redirects automatically.</p>
            )}
          </div>

          {/* Hero Image */}
          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <p className="font-semibold text-sm">Hero Image</p>
            {form.hero_image_url ? (
              <div className="relative">
                <img src={form.hero_image_url} alt="" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={() => set("hero_image_url", "")}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (
                  <><Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload image</span></>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={handleHeroUpload} />
              </label>
            )}
            <Input placeholder="or paste URL…" value={form.hero_image_url}
              onChange={(e) => set("hero_image_url", e.target.value)} className="h-8 text-sm" />
          </div>

          {/* Category & Tags */}
          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <p className="font-semibold text-sm">Categorization</p>
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-transparent text-sm">
                <option value="">— Select —</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tags</label>
              <div className="flex gap-1 mt-1">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag…" className="h-8 text-sm flex-1" />
                <Button size="sm" variant="outline" onClick={addTag} className="h-8 px-2">+</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs">
                      {t}
                      <button onClick={() => set("tags", form.tags.filter((x) => x !== t))}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <p className="font-semibold text-sm">SEO</p>
            <div>
              <label className="text-xs text-muted-foreground">Meta Title <span className={form.seo_title.length > 60 ? "text-red-400" : "text-muted-foreground"}>({form.seo_title.length}/60)</span></label>
              <Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} className="mt-1 h-8 text-sm" placeholder={form.title} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Meta Description <span className={form.seo_description.length > 155 ? "text-red-400" : "text-muted-foreground"}>({form.seo_description.length}/155)</span></label>
              <Textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)}
                className="mt-1 h-16 text-sm resize-none" placeholder={form.excerpt} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">OG Image URL</label>
              <Input value={form.og_image_url} onChange={(e) => set("og_image_url", e.target.value)}
                className="mt-1 h-8 text-sm" placeholder={form.hero_image_url} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}