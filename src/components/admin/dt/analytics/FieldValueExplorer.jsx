import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16","#f97316","#a855f7"];

export default function FieldValueExplorer({ runs, customFields }) {
  const [fieldId, setFieldId] = useState("");
  const [qualifiedOnly, setQualifiedOnly] = useState(false);

  const selectedField = customFields.find(f => f.id === fieldId);

  const filteredRuns = qualifiedOnly ? runs.filter(r => r.is_qualified) : runs;

  const valueCounts = {};
  for (const run of filteredRuns) {
    const fv = run.field_values || {};
    const val = selectedField ? fv[selectedField.field_key] : null;
    if (val === undefined || val === null || val === "") continue;
    const key = String(val);
    valueCounts[key] = (valueCounts[key] || 0) + 1;
  }

  const total = Object.values(valueCounts).reduce((s, v) => s + v, 0);
  const sorted = Object.entries(valueCounts)
    .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Fields actually captured in these runs
  const capturedKeys = new Set();
  for (const run of runs) {
    for (const key of Object.keys(run.field_values || {})) capturedKeys.add(key);
  }
  const availableFields = customFields.filter(f => capturedKeys.has(f.field_key));

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Field Value Explorer</h3>

      <div className="flex flex-wrap gap-3 items-center">
        <select value={fieldId} onChange={e => setFieldId(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm min-w-[220px]">
          <option value="">Select a custom field...</option>
          {availableFields.map(f => (
            <option key={f.id} value={f.id}>{f.display_label} ({f.field_key})</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={qualifiedOnly} onChange={e => setQualifiedOnly(e.target.checked)} className="w-4 h-4 accent-blue-600" />
          Qualified only
        </label>
      </div>

      {!fieldId && (
        <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
          Select a field above to explore value distributions.
        </div>
      )}

      {fieldId && sorted.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
          No values captured for this field in the selected date range.
        </div>
      )}

      {fieldId && sorted.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              {selectedField?.display_label} distribution
            </h4>
            <span className="text-xs text-muted-foreground">{total} values across {filteredRuns.length} runs</span>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(sorted.length * 30 + 40, 160)}>
            <BarChart data={sorted} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v, n, p) => [`${v} (${p.payload.pct}%)`, "Count"]} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {sorted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}