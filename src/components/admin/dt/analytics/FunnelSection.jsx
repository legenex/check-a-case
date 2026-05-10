import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const DQ_COLORS = [
  { max: 10, bg: "bg-green-50", border: "border-green-500", text: "text-green-700", label: "Low" },
  { max: 25, bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", label: "Medium" },
  { max: 50, bg: "bg-orange-50", border: "border-orange-500", text: "text-orange-700", label: "High" },
  { max: 200, bg: "bg-red-50", border: "border-red-500", text: "text-red-700", label: "Critical" },
];

function getDropColor(pct) {
  return DQ_COLORS.find(c => pct <= c.max) || DQ_COLORS[DQ_COLORS.length - 1];
}

function formatDwell(sec) {
  if (!sec) return "-";
  return sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`;
}

export default function FunnelSection({ quizId, nodes, nodeAnalytics, runs, dateFrom, dateTo }) {
  const [sort, setSort] = useState("drop_off_rate");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(null);

  // Aggregate analytics per node (sum across dates in range)
  const fromStr = dateFrom.toISOString().slice(0, 10);
  const toStr = dateTo.toISOString().slice(0, 10);

  const nodeStats = {};
  for (const row of nodeAnalytics) {
    if (!row.node_id) continue;
    if (row.date < fromStr || row.date > toStr) continue;
    if (!nodeStats[row.node_id]) nodeStats[row.node_id] = { starts: 0, exits: 0, completes: 0, dwell_sum: 0, dwell_count: 0 };
    const s = nodeStats[row.node_id];
    s.starts += row.starts || 0;
    s.exits += row.exits || 0;
    s.completes += row.completes || 0;
    if (row.avg_dwell_seconds) { s.dwell_sum += row.avg_dwell_seconds; s.dwell_count++; }
  }

  const sorted = [...nodes]
    .map(n => {
      const stats = nodeStats[n.node_id || n.id] || { starts: 0, exits: 0, completes: 0, dwell_sum: 0, dwell_count: 0 };
      const dropOff = stats.starts > 0 ? Math.round((stats.exits / stats.starts) * 100) : 0;
      const avgDwell = stats.dwell_count > 0 ? Math.round(stats.dwell_sum / stats.dwell_count) : 0;
      return { ...n, ...stats, drop_off_rate: dropOff, avg_dwell: avgDwell };
    })
    .sort((a, b) => {
      const av = a[sort] || 0;
      const bv = b[sort] || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });

  const toggleSort = (col) => {
    if (sort === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSort(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }) => {
    if (sort !== col) return null;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />;
  };

  const selectedNode = selected ? sorted.find(n => (n.node_id || n.id) === selected) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Node Funnel</h3>
        <p className="text-xs text-muted-foreground">{nodes.length} nodes. Sorted by {sort}.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Funnel table */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground w-[30%]">Node</th>
                <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground w-[15%]">Type</th>
                <th className="text-right px-2 py-2 text-xs font-semibold text-muted-foreground cursor-pointer w-[12%]" onClick={() => toggleSort("starts")}>Starts <SortIcon col="starts" /></th>
                <th className="text-right px-2 py-2 text-xs font-semibold text-muted-foreground cursor-pointer w-[12%]" onClick={() => toggleSort("exits")}>Exits <SortIcon col="exits" /></th>
                <th className="text-right px-2 py-2 text-xs font-semibold text-muted-foreground cursor-pointer w-[14%]" onClick={() => toggleSort("drop_off_rate")}>Drop-off <SortIcon col="drop_off_rate" /></th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground w-[12%]">Dwell</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(n => {
                const nid = n.node_id || n.id;
                const color = getDropColor(n.drop_off_rate);
                return (
                  <tr key={nid}
                    onClick={() => setSelected(selected === nid ? null : nid)}
                    className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${selected === nid ? "bg-muted/40" : ""}`}>
                    <td className="px-3 py-2 truncate">
                      <span className="text-sm font-medium text-foreground">{n.label || n.title_display || nid}</span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{n.node_type}</span>
                    </td>
                    <td className="px-2 py-2 text-right text-sm text-foreground">{n.starts}</td>
                    <td className="px-2 py-2 text-right text-sm text-foreground">{n.exits}</td>
                    <td className="px-2 py-2 text-right">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${color.bg} ${color.text}`}>
                        {n.drop_off_rate}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-muted-foreground">{formatDwell(n.avg_dwell)}</td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No node data yet. Click "Recompute Now" to generate analytics.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Node detail panel */}
        <div className="rounded-xl border border-border bg-card p-4">
          {selectedNode ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">{selectedNode.label || selectedNode.node_id}</h4>
              <p className="text-xs text-muted-foreground font-mono">{selectedNode.node_type}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Starts", val: selectedNode.starts },
                  { label: "Exits", val: selectedNode.exits },
                  { label: "Completes", val: selectedNode.completes },
                  { label: "Drop-off", val: `${selectedNode.drop_off_rate}%` },
                  { label: "Avg Dwell", val: formatDwell(selectedNode.avg_dwell) },
                ].map(({ label, val }) => (
                  <div key={label} className="p-2 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-foreground">{val}</p>
                  </div>
                ))}
              </div>
              {selectedNode.answer_options?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Options</p>
                  <div className="space-y-1">
                    {selectedNode.answer_options.map(opt => (
                      <div key={opt.option_id} className="text-xs px-2 py-1 rounded bg-muted flex items-center justify-between">
                        <span>{opt.label}</span>
                        {opt.is_dq && <span className="text-red-500 font-semibold">DQ</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Click a node in the table to see its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}