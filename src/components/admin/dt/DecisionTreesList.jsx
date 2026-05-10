import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, ExternalLink, Copy, Archive, Trash2, Settings, Eye } from "lucide-react";

const CAMPAIGN_LABELS = {
  mva: "MVA", mass_tort: "Mass Tort", workers_comp: "Workers Comp",
  slip_and_fall: "Slip & Fall", med_mal: "Med Mal", custom: "Custom",
};

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
  archived: "bg-gray-100 text-gray-500",
};

function pct(num, den) {
  if (!den) return "-%";
  return Math.round((num / den) * 100) + "%";
}

export default function DecisionTreesList({ onOpenBuilder }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState("");

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["quizzes-list"],
    queryFn: () => base44.entities.Quiz.list("-updated_date", 100),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["dt-brands"],
    queryFn: () => base44.entities.DecisionTreeBrand.list(),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quiz.update(id, data),
    onSuccess: () => qc.invalidateQueries(["quizzes-list"]),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Quiz.delete(id),
    onSuccess: () => { qc.invalidateQueries(["quizzes-list"]); setConfirmDelete(null); },
  });

  const copyMut = useMutation({
    mutationFn: async (quiz) => {
      const newSlug = quiz.slug + "-copy-" + Date.now().toString(36);
      const newQuiz = await base44.entities.Quiz.create({
        ...quiz,
        id: undefined,
        title: quiz.title + " (Copy)",
        slug: newSlug,
        status: "draft",
        total_starts: 0,
        total_completes: 0,
        total_qualified: 0,
        total_disqualified: 0,
        published_at: null,
      });
      // Clone questions
      const questions = await base44.entities.Question.filter({ quiz_id: quiz.id });
      for (const q of questions) {
        await base44.entities.Question.create({ ...q, id: undefined, quiz_id: newQuiz.id, node_id: crypto.randomUUID() });
      }
      return newQuiz;
    },
    onSuccess: () => qc.invalidateQueries(["quizzes-list"]),
  });

  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b]));

  const filtered = quizzes.filter((q) => {
    if (filterStatus !== "all" && q.status !== filterStatus) return false;
    if (filterCampaign !== "all" && q.campaign_type !== filterCampaign) return false;
    if (filterBrand !== "all" && q.brand_id !== filterBrand) return false;
    if (search && !q.title?.toLowerCase().includes(search.toLowerCase()) && !q.slug?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by title or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] h-9 px-3 rounded-md border border-input bg-background text-sm"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Campaign Types</option>
          {Object.entries(CAMPAIGN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Campaign</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brand</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ver</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nodes</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Starts / Completes</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qual%</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">DQ%</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">CR%</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Edited</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={12} className="text-center py-10 text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={12} className="text-center py-10 text-muted-foreground">No decision trees found.</td></tr>
            )}
            {filtered.map((q) => {
              const brand = brandMap[q.brand_id];
              return (
                <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => onOpenBuilder(q.id)} className="text-left">
                      <p className="font-medium text-foreground hover:text-primary transition-colors">{q.title}</p>
                      <p className="text-xs font-mono text-muted-foreground">{q.slug}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground font-medium">
                      {CAMPAIGN_LABELS[q.campaign_type] || q.campaign_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {brand ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        {brand.brand_name}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">None</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">v{q.version || 1}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.total_nodes || 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.total_starts || 0} / {q.total_completes || 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pct(q.total_qualified, q.total_completes)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pct(q.total_disqualified, q.total_completes)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pct(q.total_completes, q.total_starts)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {q.updated_date ? formatDistanceToNow(new Date(q.updated_date), { addSuffix: true }) : "-"}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === q.id ? null : q.id)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {openMenuId === q.id && (
                      <div className="absolute right-4 top-10 z-50 w-48 bg-popover border border-border rounded-lg shadow-lg py-1" onClick={() => setOpenMenuId(null)}>
                        <button onClick={() => onOpenBuilder(q.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                          <Settings className="w-4 h-4" /> Open Builder
                        </button>
                        <button onClick={() => window.open(`/q/${q.slug}?preview=1`, "_blank")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                          <ExternalLink className="w-4 h-4" /> View Public Link
                        </button>
                        <button
                          onClick={() => copyMut.mutate(q)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <Copy className="w-4 h-4" /> Copy
                        </button>
                        <button
                          onClick={() => updateMut.mutate({ id: q.id, data: { status: q.status === "published" ? "draft" : "published" } })}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <Eye className="w-4 h-4" /> {q.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => updateMut.mutate({ id: q.id, data: { status: "archived" } })}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <Archive className="w-4 h-4" /> Archive
                        </button>
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => { setConfirmDelete(q); setConfirmDeleteSlug(""); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-foreground">Delete "{confirmDelete.title}"?</h2>
            <p className="text-sm text-muted-foreground">This is permanent. Type the slug <span className="font-mono font-bold">{confirmDelete.slug}</span> to confirm.</p>
            <input
              value={confirmDeleteSlug}
              onChange={(e) => setConfirmDeleteSlug(e.target.value)}
              placeholder={confirmDelete.slug}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
              <button
                disabled={confirmDeleteSlug !== confirmDelete.slug}
                onClick={() => deleteMut.mutate(confirmDelete.id)}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-40 hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}