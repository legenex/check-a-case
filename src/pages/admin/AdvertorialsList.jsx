import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ExternalLink, Pencil, Copy, Archive, Wand2, X } from "lucide-react";
import { format } from "date-fns";
import { bulkSimplifyAdvertorials } from "@/functions/bulkSimplifyAdvertorials";

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-500",
};

const TEMPLATE_LABELS = {
  personal_story: "Personal Story",
  news_authority: "News Authority",
  doctor_expert_warning: "Doctor Warning",
  whistleblower: "Whistleblower",
};

export default function AdvertorialsList({ onEdit, onCreate }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [simplifyModal, setSimplifyModal] = useState(false);
  const [simplifyProgress, setSimplifyProgress] = useState(null); // { current, total, done, error }
  const qc = useQueryClient();

  const { data: advertorials = [], isLoading } = useQuery({
    queryKey: ["admin-advertorials"],
    queryFn: () => base44.entities.Advertorial.list("-updated_date", 200),
  });

  const filtered = advertorials.filter((a) => {
    const matchSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.slug?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchTemplate = templateFilter === "all" || a.template === templateFilter;
    return matchSearch && matchStatus && matchTemplate;
  });

  const handleArchive = async (e, id) => {
    e.stopPropagation();
    await base44.entities.Advertorial.update(id, { status: "archived" });
    qc.invalidateQueries({ queryKey: ["admin-advertorials"] });
  };

  const eligible = advertorials.filter(a => a.status !== "archived" && a.body);

  const handleBulkSimplify = async () => {
    setSimplifyProgress({ current: 0, total: eligible.length, done: false, error: null });
    for (let i = 0; i < eligible.length; i++) {
      const adv = eligible[i];
      setSimplifyProgress({ current: i + 1, total: eligible.length, done: false, error: null });
      try {
        await bulkSimplifyAdvertorials({ advertorial_id: adv.id });
      } catch (err) {
        setSimplifyProgress(prev => ({ ...prev, error: `Error on "${adv.title}": ${err.message}` }));
      }
    }
    qc.invalidateQueries({ queryKey: ["admin-advertorials"] });
    setSimplifyProgress(prev => ({ ...prev, done: true }));
  };

  const handleDuplicate = async (e, advertorial) => {
    e.stopPropagation();
    const { id, created_date, updated_date, created_by, ...rest } = advertorial;
    const newSlug = `${rest.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newRecord = await base44.entities.Advertorial.create({
      ...rest,
      title: `${rest.title} (Copy)`,
      slug: newSlug,
      status: "draft",
    });
    qc.invalidateQueries({ queryKey: ["admin-advertorials"] });
    onEdit(newRecord);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-foreground">Advertorials</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setSimplifyModal(true)}>
            <Wand2 className="w-4 h-4" /> Bulk Simplify
          </Button>
          <Button className="rounded-xl gap-2" onClick={onCreate}>
            <Plus className="w-4 h-4" /> New Advertorial
          </Button>
        </div>
      </div>

      {/* Bulk Simplify Modal */}
      {simplifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Bulk Simplify All Advertorials</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This will rewrite all {eligible.length} advertorial bodies in plain English (6th-grade reading level). Original bodies will be preserved as a backup and can be restored per-article.
                </p>
              </div>
              {!simplifyProgress && (
                <button onClick={() => setSimplifyModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {!simplifyProgress && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSimplifyModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-xl gap-2" onClick={handleBulkSimplify}>
                  <Wand2 className="w-4 h-4" /> Rewrite All
                </Button>
              </div>
            )}

            {simplifyProgress && !simplifyProgress.done && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">Rewriting {simplifyProgress.current} of {simplifyProgress.total}...</span>
                  <span className="text-muted-foreground">{Math.round((simplifyProgress.current / simplifyProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(simplifyProgress.current / simplifyProgress.total) * 100}%` }}
                  />
                </div>
                {simplifyProgress.error && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{simplifyProgress.error}</p>
                )}
              </div>
            )}

            {simplifyProgress?.done && (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  Done. {eligible.length} articles rewritten. Original versions backed up per article.
                </div>
                {simplifyProgress.error && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{simplifyProgress.error}</p>
                )}
                <Button className="w-full rounded-xl" onClick={() => { setSimplifyModal(false); setSimplifyProgress(null); }}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={templateFilter} onValueChange={setTemplateFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            <SelectItem value="personal_story">Personal Story</SelectItem>
            <SelectItem value="news_authority">News Authority</SelectItem>
            <SelectItem value="doctor_expert_warning">Doctor Warning</SelectItem>
            <SelectItem value="whistleblower">Whistleblower</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} advertorials</p>

      <Card className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Slug</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Template</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Updated</th>
                <th className="text-left p-4 font-medium text-muted-foreground w-32"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              )}
              {!isLoading && filtered.map((adv) => (
                <tr
                  key={adv.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onEdit(adv)}
                >
                  <td className="p-4 font-medium max-w-[260px]">
                    <span className="truncate block" title={adv.title}>
                      {adv.title?.length > 60 ? adv.title.slice(0, 60) + "…" : adv.title}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell font-mono text-xs">
                    {adv.slug}
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">
                    {TEMPLATE_LABELS[adv.template] || adv.template || "—"}
                  </td>
                  <td className="p-4">
                    <Badge className={`text-xs ${STATUS_COLORS[adv.status] || "bg-muted text-muted-foreground"}`}>
                      {adv.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs hidden lg:table-cell">
                    {adv.updated_date ? format(new Date(adv.updated_date), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`/a/${adv.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        title="View live"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => onEdit(adv)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(e, adv)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleArchive(e, adv.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                        title="Archive"
                        disabled={adv.status === "archived"}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No advertorials found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}