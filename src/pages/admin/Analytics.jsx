import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { Users2, TrendingUp, Target, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { subDays, format, startOfDay, eachDayOfInterval, eachWeekOfInterval, startOfWeek } from "date-fns";

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

const DATE_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function KpiCard({ label, value, sub, delta, loading }) {
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <Card className="rounded-xl">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded animate-pulse w-20" />
            <div className="h-8 bg-muted rounded animate-pulse w-16" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            {delta !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${dir === "up" ? "text-green-600" : dir === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                {dir === "up" ? <ArrowUpRight className="w-3 h-3" /> : dir === "down" ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {Math.abs(delta).toFixed(1)}% vs prior period
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [rangeDays, setRangeDays] = useState(30);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["analytics-leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 2000),
  });

  const { data: claimEstimates = [] } = useQuery({
    queryKey: ["analytics-claims"],
    queryFn: () => base44.entities.ClaimEstimate.list("-created_date", 2000),
  });

  const now = new Date();
  const rangeStart = startOfDay(subDays(now, rangeDays));
  const prevStart = startOfDay(subDays(now, rangeDays * 2));

  const currentLeads = useMemo(() =>
    leads.filter((l) => new Date(l.created_date) >= rangeStart), [leads, rangeStart]);
  const prevLeads = useMemo(() =>
    leads.filter((l) => new Date(l.created_date) >= prevStart && new Date(l.created_date) < rangeStart),
    [leads, prevStart, rangeStart]);

  const delta = prevLeads.length > 0
    ? ((currentLeads.length - prevLeads.length) / prevLeads.length) * 100
    : currentLeads.length > 0 ? 100 : 0;

  const qualRate = currentLeads.length > 0
    ? ((currentLeads.filter((l) => l.qualification === "qualified").length / currentLeads.length) * 100).toFixed(1)
    : 0;

  // Daily lead chart
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: rangeStart, end: now });
    return days.map((d) => {
      const key = format(d, "MM/dd");
      const count = currentLeads.filter((l) => format(new Date(l.created_date), "MM/dd") === key).length;
      return { date: key, leads: count };
    });
  }, [currentLeads, rangeStart]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const map = {};
    currentLeads.forEach((l) => {
      const src = l.attribution?.utm_source || l.source || "direct";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [currentLeads]);

  // Campaign breakdown
  const campaignData = useMemo(() => {
    const map = {};
    currentLeads.forEach((l) => {
      const c = l.attribution?.utm_campaign || l.campaign || "—";
      if (!map[c]) map[c] = { campaign: c, leads: 0, qualified: 0 };
      map[c].leads++;
      if (l.qualification === "qualified") map[c].qualified++;
    });
    return Object.values(map).sort((a, b) => b.leads - a.leads).slice(0, 10).map((r) => ({
      ...r,
      qual_rate: r.leads > 0 ? ((r.qualified / r.leads) * 100).toFixed(0) + "%" : "—",
    }));
  }, [currentLeads]);

  // Qualification split
  const qualSplit = useMemo(() => [
    { name: "Qualified", value: currentLeads.filter((l) => l.qualification === "qualified").length },
    { name: "Soft DQ", value: currentLeads.filter((l) => l.qualification === "soft_dq").length },
    { name: "Hard DQ", value: currentLeads.filter((l) => l.qualification === "hard_dq").length },
  ], [currentLeads]);

  // Tool funnel
  const toolData = useMemo(() => {
    const tools = ["claim-estimator", "adjuster-simulator", "crash-clock", "lifestyle-cost", "demand-letter"];
    return tools.map((tool) => {
      const toolLeads = currentLeads.filter((l) => l.source === tool || l.attribution?.utm_content === tool).length;
      const estimates = claimEstimates.filter((e) => e.tool_source === tool);
      const avgEst = estimates.length > 0
        ? Math.round(estimates.reduce((s, e) => s + ((e.estimate_low + e.estimate_high) / 2), 0) / estimates.length)
        : null;
      return { tool: tool.replace(/-/g, " "), leads: toolLeads, starts: estimates.length, avg_estimate: avgEst };
    });
  }, [currentLeads, claimEstimates]);

  // Qualification funnel (horizontal bar)
  const funnelData = [
    { step: "Leads Submitted", count: currentLeads.length },
    { step: "Not Hard-DQ'd", count: currentLeads.filter((l) => l.qualification !== "hard_dq").length },
    { step: "Qualified", count: currentLeads.filter((l) => l.qualification === "qualified").length },
    { step: "Contacted", count: currentLeads.filter((l) => ["contacted", "in_progress", "converted"].includes(l.status)).length },
    { step: "Converted", count: currentLeads.filter((l) => l.status === "converted").length },
  ];

  // Status breakdown
  const statusData = useMemo(() => {
    const map = {};
    currentLeads.forEach((l) => { map[l.status] = (map[l.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [currentLeads]);

  const maxFunnel = funnelData[0].count || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Lead volume, sources, qualification, and tool performance.</p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {DATE_RANGES.map((r) => (
            <button key={r.label} onClick={() => setRangeDays(r.days)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${rangeDays === r.days ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={currentLeads.length} delta={delta} loading={isLoading} />
        <KpiCard label="Qualified" value={currentLeads.filter((l) => l.qualification === "qualified").length}
          sub={`${qualRate}% qual rate`} loading={isLoading} />
        <KpiCard label="Sources" value={sourceData.length} sub="unique traffic sources" loading={isLoading} />
        <KpiCard label="Converted" value={currentLeads.filter((l) => l.status === "converted").length}
          sub="status = converted" loading={isLoading} />
      </div>

      {/* Daily trend */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Daily Leads — Last {rangeDays} Days</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="h-48 bg-muted rounded animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(dailyData.length / 6)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Source + Qual split */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-xl">
          <CardHeader><CardTitle className="text-base">Lead Sources</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="h-48 bg-muted rounded animate-pulse" /> :
              sourceData.length === 0 ? <p className="text-muted-foreground text-sm">No source data yet.</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sourceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="value" name="Leads" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader><CardTitle className="text-base">Qualification Split</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="h-48 bg-muted rounded animate-pulse" /> :
              currentLeads.length === 0 ? <p className="text-muted-foreground text-sm">No leads in range.</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={qualSplit} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {qualSplit.map((_, i) => <Cell key={i} fill={["#22c55e", "#f59e0b", "#ef4444"][i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">Lead Qualification Funnel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {funnelData.map((step) => (
            <div key={step.step} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{step.step}</span>
                <span className="font-bold">{step.count}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(step.count / maxFunnel) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tool funnel */}
      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">Tool Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Tool</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Starts</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Leads</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Avg Estimate</th>
                </tr>
              </thead>
              <tbody>
                {toolData.map((t) => (
                  <tr key={t.tool} className="border-b border-border last:border-0">
                    <td className="py-2 capitalize font-medium">{t.tool}</td>
                    <td className="py-2 text-right text-muted-foreground">{t.starts}</td>
                    <td className="py-2 text-right font-semibold">{t.leads}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {t.avg_estimate ? `$${t.avg_estimate.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign table */}
      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">By Campaign</CardTitle></CardHeader>
        <CardContent>
          {campaignData.length === 0 ? (
            <p className="text-muted-foreground text-sm">No campaign data. Tag traffic with <code className="bg-muted px-1 rounded">utm_campaign</code> to populate this table.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Campaign</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Leads</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Qualified</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Qual Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignData.map((c) => (
                    <tr key={c.campaign} className="border-b border-border last:border-0">
                      <td className="py-2 font-medium max-w-[140px] truncate">{c.campaign}</td>
                      <td className="py-2 text-right">{c.leads}</td>
                      <td className="py-2 text-right text-green-600 font-semibold">{c.qualified}</td>
                      <td className="py-2 text-right">
                        <Badge className="text-xs bg-muted text-muted-foreground">{c.qual_rate}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}