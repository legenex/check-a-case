import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, formatDistanceToNow } from "date-fns";
import { X, Download, Tag, Archive, Eye } from "lucide-react";
import RunDetailPanel from "./RunDetailPanel";

const STATUS_COLORS = {
  complete: "bg-green-100 text-green-700",
  incomplete: "bg-amber-100 text-amber-700",
  abandoned: "bg-slate-100 text-slate-500",
};

const TIER_COLORS = {
  T1: "bg-blue-100 text-blue-700",
  T2: "bg-purple-100 text-purple-700",
  T3: "bg-slate-100 text-slate-600",
  DQ: "bg-red-100 text-red-600",
};

export default function LeadsView({ quizId, nodes, brands, dateFrom, dateTo }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [selected, setSelected] = useState([]);
  const [detailRun, setDetailRun] = useState(null);
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [showBulkTag, setShowBulkTag] = useState(false);

  const fromStr = dateFrom.toISOString();
  const toStr = dateTo.toISOString();

  const { data: allRuns = [], isLoading, refetch } = useQuery({
    queryKey: ["dt-runs-leads", quizId],
    queryFn: () => base44.entities.DecisionTreeRun.filter({ quiz_id: quizId }, "-started_at", 2000),
  });

  const runs = allRuns.filter(r => r.started_at >= fromStr && r.started_at <= toStr);

  const filtered = runs.filter(r => {
    if (filterStatus !== "all") {
      if (filterStatus === "complete" && !r.is_complete) return false;
      if (filterStatus === "incomplete" && (r.is_complete || r.abandoned_at_node_id)) return false;
      if (filterStatus === "abandoned" && !r.abandoned_at_node_id) return false;
    }
    if (filterTier !== "all" && r.qualification_tier !== filterTier) return false;
    if (filterBrand !== "all" && r.brand_id !== filterBrand) return false;
    if (search) {
      const fv = r.field_values || {};
      const searchStr = [fv.first_name, fv.last_name, fv.email, fv.phone, r.session_id].join(" ").toLowerCase();
      if (!searchStr.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map(r => r.id));
  };

  const exportCSV = () => {
    const rows = filtered.filter(r => selected.length === 0 || selected.includes(r.id));
    const headers = ["session_id","started_at","is_complete","is_qualified","qualification_tier","utm_source","utm_medium","brand_id","device_type"];
    const csv = [
      headers.join(","),
      ...rows.map(r => headers.map(h => JSON.stringify(r[h] || "")).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `runs-${quizId}.csv`; a.click();
  };

  const bulkArchive = async () => {
    const ids = selected.length > 0 ? selected : filtered.map(r => r.id);
    for (const id of ids) {
      await base44.entities.DecisionTreeRun.update(id, { abandoned_at_node_id: "archived" });
    }
    setSelected([]);
    refetch();
  };

  const bulkAddTag = async () => {
    if (!bulkTagInput.trim()) return;
    const tag = bulkTagInput.trim();
    const ids = selected.length > 0 ? selected : filtered.map(r => r.id);
    for (const id of ids) {
      const run = allRuns.find(r => r.id === id);
      if (!run) continue;
      const tags = [...new Set([...(run.tags || []), tag])];
      await base44.entities.DecisionTreeRun.update(id, { tags });
    }
    setSelected([]);
    setBulkTagInput("");
    setShowBulkTag(false);
    refetch();
  };

  const getStatus = (run) => {
    if (run.is_complete) return "complete";
    if (run.abandoned_at_node_id) return "abandoned";
    return "incomplete";
  };

  const brandName = (brandId) => brands.find(b => b.id === brandId)?.brand_name || brandId || "-";

  return (
    <div className="space-y-4 relative">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone..."
          className="flex-1 min-w-[200px] h-9 px-3 rounded-md border border-input bg-background text-sm" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Status</option>
          <option value="complete">Complete</option>
          <option value="incomplete">Incomplete</option>
          <option value="abandoned">Abandoned</option>
        </select>
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Tiers</option>
          <option value="T1">T1</option>
          <option value="T2">T2</option>
          <option value="T3">T3</option>
          <option value="DQ">DQ</option>
        </select>
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Brands</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
        </select>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{filtered.length} runs{selected.length > 0 ? ` (${selected.length} selected)` : ""}</span>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors">
          <Download className="w-3 h-3" /> Export CSV
        </button>
        <button onClick={() => setShowBulkTag(!showBulkTag)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors">
          <Tag className="w-3 h-3" /> Add Tag
        </button>
        <button onClick={bulkArchive} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors">
          <Archive className="w-3 h-3" /> Archive
        </button>
        {showBulkTag && (
          <div className="flex items-center gap-2">
            <input value={bulkTagInput} onChange={e => setBulkTagInput(e.target.value)}
              placeholder="tag name..."
              className="h-7 px-2 rounded border border-input text-xs" />
            <button onClick={bulkAddTag} className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs">Apply</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="w-8 px-3 py-2">
                <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="w-4 h-4 accent-blue-600" />
              </th>
              <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground w-[14%]">Started</th>
              <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground w-[10%]">Status</th>
              <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground w-[8%]">Tier</th>
              <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground w-[12%]">Brand</th>
              <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground w-[12%]">Source</th>
              <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground w-[28%]">Key Fields</th>
              <th className="text-center px-2 py-2 text-xs font-semibold text-muted-foreground w-[8%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No runs found for this filter combination.</td></tr>
            )}
            {filtered.map(run => {
              const status = getStatus(run);
              const fv = run.field_values || {};
              const keyFields = [fv.first_name, fv.last_name, fv.state, fv.injury_severity].filter(Boolean);
              return (
                <tr key={run.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer group"
                  onClick={() => setDetailRun(run)}>
                  <td className="px-3 py-2" onClick={e => { e.stopPropagation(); toggleSelect(run.id); }}>
                    <input type="checkbox" checked={selected.includes(run.id)} onChange={() => toggleSelect(run.id)} className="w-4 h-4 accent-blue-600" />
                  </td>
                  <td className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {run.started_at ? formatDistanceToNow(new Date(run.started_at), { addSuffix: true }) : "-"}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${STATUS_COLORS[status] || "bg-muted text-muted-foreground"}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {run.qualification_tier && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${TIER_COLORS[run.qualification_tier] || "bg-muted text-muted-foreground"}`}>
                        {run.qualification_tier}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs text-foreground truncate">{brandName(run.brand_id)}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground truncate">{run.utm_source || "(direct)"}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {keyFields.slice(0, 4).map((v, i) => (
                        <span key={i} className="text-xs bg-muted px-1 py-0.5 rounded">{v}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button onClick={e => { e.stopPropagation(); setDetailRun(run); }}
                      className="p-1.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Run detail slide-over */}
      {detailRun && (
        <RunDetailPanel
          run={detailRun}
          nodes={nodes}
          onClose={() => setDetailRun(null)}
        />
      )}
    </div>
  );
}