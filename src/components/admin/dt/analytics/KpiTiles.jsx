import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatSeconds(sec) {
  if (!sec || isNaN(sec)) return "0s";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function TrendChip({ delta }) {
  if (delta === null || delta === undefined) return null;
  if (Math.abs(delta) < 0.5) return (
    <span className="flex items-center gap-0.5 text-xs text-slate-500"><Minus className="w-3 h-3" /> 0%</span>
  );
  const up = delta > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(Math.round(delta))}%
    </span>
  );
}

function KpiCard({ label, value, sub, loading }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-black text-foreground">{value}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function KpiTiles({ runs, loading }) {
  const starts = runs.length;
  const completes = runs.filter(r => r.is_complete).length;
  const qualified = runs.filter(r => r.is_qualified).length;
  const disqualified = runs.filter(r => r.is_disqualified).length;
  const completionRate = starts > 0 ? Math.round((completes / starts) * 100) : 0;
  const qualRate = completes > 0 ? Math.round((qualified / completes) * 100) : 0;
  const dqRate = completes > 0 ? Math.round((disqualified / completes) * 100) : 0;

  const dwells = runs
    .filter(r => r.is_complete && r.path_taken)
    .map(r => {
      const total = (r.path_taken || []).reduce((sum, s) => sum + (s.dwell_seconds || 0), 0);
      return total;
    })
    .filter(d => d > 0);
  const medDwell = median(dwells);

  const tiles = [
    { label: "Starts", value: starts.toLocaleString() },
    { label: "Completes", value: completes.toLocaleString(), sub: `${completionRate}% completion rate` },
    { label: "Completion Rate", value: `${completionRate}%` },
    { label: "Qualified", value: qualified.toLocaleString(), sub: `${qualRate}% of completes` },
    { label: "Disqualified", value: disqualified.toLocaleString(), sub: `${dqRate}% of completes` },
    { label: "Avg Time to Complete", value: formatSeconds(medDwell), sub: "median across completed runs" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {tiles.map(t => (
        <KpiCard key={t.label} {...t} loading={loading} />
      ))}
    </div>
  );
}