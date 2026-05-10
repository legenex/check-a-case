import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16"];

function HBarChart({ title, data }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="Starts" fill="#3b82f6" radius={[0, 3, 3, 0]} />
            <Bar dataKey="Qualified" fill="#10b981" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function DonutChart({ title, data }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v} (${data.find(d=>d.name===n)?.pct}%)`, n]} />
            <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function BreakdownCharts({ runs, brands }) {
  // By utm_source
  const sourceMap = {};
  for (const r of runs) {
    const src = r.utm_source || "(direct)";
    if (!sourceMap[src]) sourceMap[src] = { Starts: 0, Qualified: 0 };
    sourceMap[src].Starts++;
    if (r.is_qualified) sourceMap[src].Qualified++;
  }
  const sourceData = Object.entries(sourceMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.Starts - a.Starts)
    .slice(0, 10);

  // By brand
  const brandMap = {};
  for (const r of runs) {
    const brand = brands.find(b => b.id === r.brand_id);
    const key = brand?.brand_name || r.brand_id || "(none)";
    if (!brandMap[key]) brandMap[key] = 0;
    brandMap[key]++;
  }
  const total = runs.length || 1;
  const brandData = Object.entries(brandMap)
    .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
    .sort((a, b) => b.value - a.value);

  // By tier
  const tierMap = { T1: 0, T2: 0, T3: 0, DQ: 0, Incomplete: 0 };
  for (const r of runs) {
    if (r.qualification_tier && tierMap[r.qualification_tier] !== undefined) tierMap[r.qualification_tier]++;
    else if (r.is_disqualified) tierMap.DQ++;
    else if (!r.is_complete) tierMap.Incomplete++;
  }
  const tierData = Object.entries(tierMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }));

  // By device
  const deviceMap = {};
  for (const r of runs) {
    const d = r.device_type || "unknown";
    if (!deviceMap[d]) deviceMap[d] = { Starts: 0, Qualified: 0 };
    deviceMap[d].Starts++;
    if (r.is_qualified) deviceMap[d].Qualified++;
  }
  const deviceData = Object.entries(deviceMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.Starts - a.Starts);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <HBarChart title="By UTM Source" data={sourceData} />
      <DonutChart title="By Brand" data={brandData} />
      <DonutChart title="By Qualification Tier" data={tierData} />
      <HBarChart title="By Device" data={deviceData} />
    </div>
  );
}