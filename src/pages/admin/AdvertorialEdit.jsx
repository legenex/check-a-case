import React, { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Save, ExternalLink, RefreshCw } from "lucide-react";

const SECTIONS = [
  { key: "basics", label: "Basics" },
  { key: "content", label: "Content" },
  { key: "images", label: "Images" },
  { key: "ctas", label: "CTAs" },
  { key: "seo", label: "SEO" },
];

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function AdvertorialEdit({ advertorial, onBack }) {
  const isNew = !advertorial?.id;
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: "", slug: "", template: "personal_story", status: "draft",
    cta_style: "gold_gradient", body: "", pull_quote: "",
    hero_image_url: "", inline_image_url: "", og_image_url: "",
    mid_cta_text: "", mid_cta_url: "", final_cta_text: "", final_cta_url: "",
    seo_title: "", seo_description: "", slug_redirects: [],
    ...(advertorial || {}),
  });

  const [originalSlug] = useState(advertorial?.slug || "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("basics");
  const [previewTs, setPreviewTs] = useState(Date.now());

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Auto-slug from title on new records
  useEffect(() => {
    if (isNew && form.title) {
      set("slug", slugify(form.title));
    }
  }, [form.title, isNew]);

  const handleSave = async () => {
    if (!form.title || !form.slug) { setError("Title and slug are required."); return; }
    const slugVal = slugify(form.slug);
    if (slugVal !== form.slug) { setError("Slug must be lowercase with hyphens only."); return; }
    setError("");
    setSaving(true);

    // Slug change → push old slug into redirects
    let redirects = form.slug_redirects || [];
    if (!isNew && originalSlug && originalSlug !== slugVal && !redirects.includes(originalSlug)) {
      redirects = [...redirects, originalSlug];
    }

    const payload = { ...form, slug: slugVal, slug_redirects: redirects };
    delete payload.id; delete payload.created_date; delete payload.updated_date; delete payload.created_by;

    if (isNew) {
      await base44.entities.Advertorial.create(payload);
    } else {
      await base44.entities.Advertorial.update(advertorial.id, payload);
    }

    qc.invalidateQueries({ queryKey: ["admin-advertorials"] });
    setSavedAt(new Date());
    setSaving(false);
    setPreviewTs(Date.now());
  };

  const previewUrl = form.slug ? `/a/${form.slug}?preview=1&ts=${previewTs}` : null;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm">
            <ChevronLeft className="w-4 h-4" /> Advertorials
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-foreground truncate max-w-[240px]">
            {form.title || "New Advertorial"}
          </span>
          {form.status && (
            <Badge className={
              form.status === "published" ? "bg-green-100 text-green-700" :
              form.status === "draft" ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-500"
            }>{form.status}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {form.slug && (
            <a href={`/a/${form.slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
              <ExternalLink className="w-4 h-4" /> View Live
            </a>
          )}
          {error && <span className="text-xs text-destructive">{error}</span>}
          {savedAt && <span className="text-xs text-muted-foreground">Saved {savedAt.toLocaleTimeString()}</span>}
          <Button className="rounded-xl gap-2" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Form */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-6 pb-10">
          {/* Section tabs */}
          <div className="flex gap-1 border-b border-border pb-0 -mb-2 overflow-x-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeSection === s.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {activeSection === "basics" && (
            <div className="space-y-4 pt-4">
              <Field label="Title">
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Article headline…" className="rounded-xl" />
              </Field>
              <Field label="Slug" hint="Lowercase, hyphens only. e.g. stranger-in-aisle-4">
                <Input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))}
                  placeholder="my-advertorial-slug" className="rounded-xl font-mono text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Template">
                  <Select value={form.template} onValueChange={(v) => set("template", v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal_story">Personal Story</SelectItem>
                      <SelectItem value="news_authority">News Authority</SelectItem>
                      <SelectItem value="doctor_expert_warning">Doctor Expert Warning</SelectItem>
                      <SelectItem value="whistleblower">Whistleblower</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="CTA Style">
                <Select value={form.cta_style} onValueChange={(v) => set("cta_style", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold_gradient">Gold Gradient</SelectItem>
                    <SelectItem value="cream">Cream</SelectItem>
                    <SelectItem value="dark_navy">Dark Navy</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {activeSection === "content" && (
            <div className="space-y-4 pt-4">
              <Field label="Body (Markdown)" hint="Use # headings, > blockquotes, **bold**, *italic*, etc.">
                <textarea
                  value={form.body || ""}
                  onChange={(e) => set("body", e.target.value)}
                  placeholder="Write your advertorial in Markdown…"
                  className="w-full border border-border rounded-xl p-4 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  style={{ minHeight: 600 }}
                />
              </Field>
              <Field label="Pull Quote" hint="Displayed as italic subhead below the headline.">
                <textarea
                  value={form.pull_quote || ""}
                  onChange={(e) => set("pull_quote", e.target.value)}
                  placeholder="A compelling pull quote or subheadline…"
                  className="w-full border border-border rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  rows={3}
                />
              </Field>
            </div>
          )}

          {activeSection === "images" && (
            <div className="space-y-4 pt-4">
              <Field label="Hero Image URL" hint="Displayed above the headline if present.">
                <Input value={form.hero_image_url || ""} onChange={(e) => set("hero_image_url", e.target.value)} placeholder="https://…" className="rounded-xl" />
              </Field>
              <Field label="Inline Image URL" hint="Placed mid-article after the second section.">
                <Input value={form.inline_image_url || ""} onChange={(e) => set("inline_image_url", e.target.value)} placeholder="https://…" className="rounded-xl" />
              </Field>
              <Field label="OG Image URL" hint="Used for social sharing. Falls back to hero image.">
                <Input value={form.og_image_url || ""} onChange={(e) => set("og_image_url", e.target.value)} placeholder="https://…" className="rounded-xl" />
              </Field>
            </div>
          )}

          {activeSection === "ctas" && (
            <div className="space-y-4 pt-4">
              <Field label="Mid CTA Text">
                <Input value={form.mid_cta_text || ""} onChange={(e) => set("mid_cta_text", e.target.value)} placeholder="Check If You Qualify →" className="rounded-xl" />
              </Field>
              <Field label="Mid CTA URL">
                <Input value={form.mid_cta_url || ""} onChange={(e) => set("mid_cta_url", e.target.value)} placeholder="https://quiz.checkacase.com/…" className="rounded-xl" />
              </Field>
              <Field label="Final CTA Text">
                <Input value={form.final_cta_text || ""} onChange={(e) => set("final_cta_text", e.target.value)} placeholder="Start My Free Case Review" className="rounded-xl" />
              </Field>
              <Field label="Final CTA URL">
                <Input value={form.final_cta_url || ""} onChange={(e) => set("final_cta_url", e.target.value)} placeholder="https://quiz.checkacase.com/…" className="rounded-xl" />
              </Field>
            </div>
          )}

          {activeSection === "seo" && (
            <div className="space-y-4 pt-4">
              <Field label="SEO Title" hint="Falls back to article title.">
                <Input value={form.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} placeholder="Override page <title>…" className="rounded-xl" />
              </Field>
              <Field label="SEO Description">
                <textarea
                  value={form.seo_description || ""}
                  onChange={(e) => set("seo_description", e.target.value)}
                  placeholder="Meta description for search engines…"
                  className="w-full border border-border rounded-xl p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  rows={3}
                />
              </Field>
              <Field label="Slug Redirects" hint="Old slugs that should redirect here. One per line.">
                <textarea
                  value={(form.slug_redirects || []).join("\n")}
                  onChange={(e) => set("slug_redirects", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                  placeholder="old-slug-1&#10;old-slug-2"
                  className="w-full border border-border rounded-xl p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  rows={4}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Right: Preview iframe */}
        <div className="hidden xl:flex flex-col w-[520px] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Preview</span>
            <button
              onClick={() => setPreviewTs(Date.now())}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="flex-1 rounded-2xl border border-border overflow-hidden bg-muted min-h-[600px]">
            {previewUrl ? (
              <iframe
                key={previewTs}
                src={previewUrl}
                className="w-full h-full"
                title="Advertorial Preview"
                style={{ minHeight: 700 }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Save the advertorial to see a preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}