import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wrench, Settings, ExternalLink, Copy, Eye, EyeOff, Archive, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}>
      {status || "draft"}
    </span>
  );
}

function IconButton({ icon: Icon, tooltip, onClick, primary, danger }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors
              ${primary ? "hover:bg-blue-100 hover:text-blue-600" : danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-slate-200 text-slate-500"}`}
          >
            <Icon size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function DecisionTreesList({ onOpenBuilder }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
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
        ...quiz, id: undefined, title: quiz.title + " (Copy)", slug: newSlug, status: "draft",
        total_starts: 0, total_completes: 0, total_qualified: 0, total_disqualified: 0, published_at: null,
      });
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
        <input type="text" placeholder="Search by title or slug..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] h-9 px-3 rounded-md border border-input bg-background text-sm" />
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
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[22%]">Title</th>
              <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[12%]">Slug</th>
              <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[9%]">Campaign</th>
              <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[9%]">Brand</th>
              <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[8%]">Status</th>
              <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[5%]">Ver</th>
              <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[5%]">Nodes</th>
              <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[8%]">Subs</th>
              <th className="text-right px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[6%]">Q%</th>
              <th className="text-right px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[6%]">CR%</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={11} className="text-center py-10 text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={11} className="text-center py-10 text-muted-foreground">No decision trees found.</td></tr>
            )}
            {filtered.map((q) => {
              const brand = brandMap[q.brand_id];
              return (
                <tr key={q.id} className="border-b last:border-0 hover:bg-slate-50 transition group">
                  <td className="px-4 py-3 truncate">
                    <button onClick={() => onOpenBuilder(q.id)} className="font-medium text-slate-900 hover:text-blue-600 truncate block text-left w-full">
                      {q.title}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-slate-500 truncate">{q.slug}</td>
                  <td className="px-3 py-3 truncate">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 uppercase truncate">
                      {CAMPAIGN_LABELS[q.campaign_type] || q.campaign_type}
                    </span>
                  </td>
                  <td className="px-3 py-3 truncate text-sm text-slate-700">
                    {brand ? brand.brand_name : <span className="text-slate-400 text-xs">None</span>}
                  </td>
                  <td className="px-3 py-3"><StatusPill status={q.status} /></td>
                  <td className="px-2 py-3 text-center text-sm text-slate-600">v{q.version || 1}</td>
                  <td className="px-2 py-3 text-center text-sm text-slate-600">{q.total_nodes || 0}</td>
                  <td className="px-2 py-3 text-center text-sm text-slate-600">{q.total_starts || 0}/{q.total_completes || 0}</td>
                  <td className="px-2 py-3 text-right text-sm text-slate-600">{pct(q.total_qualified, q.total_completes)}</td>
                  <td className="px-2 py-3 text-right text-sm text-slate-600">{pct(q.total_completes, q.total_starts)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <IconButton icon={Wrench} tooltip="Open Builder" onClick={() => onOpenBuilder(q.id)} primary />
                      <IconButton icon={ExternalLink} tooltip="View Public Link" onClick={() => window.open(`/q/${q.slug}?preview=1`, "_blank")} />
                      <IconButton icon={Copy} tooltip="Duplicate" onClick={() => copyMut.mutate(q)} />
                      <IconButton
                        icon={q.status === "published" ? EyeOff : Eye}
                        tooltip={q.status === "published" ? "Unpublish" : "Publish"}
                        onClick={() => updateMut.mutate({ id: q.id, data: { status: q.status === "published" ? "draft" : "published" } })}
                      />
                      <IconButton icon={Archive} tooltip="Archive" onClick={() => updateMut.mutate({ id: q.id, data: { status: "archived" } })} />
                      <IconButton icon={Trash2} tooltip="Delete" onClick={() => { setConfirmDelete(q); setConfirmDeleteSlug(""); }} danger />
                    </div>
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
            <input value={confirmDeleteSlug}
              onChange={(e) => setConfirmDeleteSlug(e.target.value)}
              placeholder={confirmDelete.slug}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
              <button disabled={confirmDeleteSlug !== confirmDelete.slug}
                onClick={() => deleteMut.mutate(confirmDelete.id)}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-40">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}