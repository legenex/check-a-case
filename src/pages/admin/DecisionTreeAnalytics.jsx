import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { aggregateDecisionTreeAnalytics } from "@/functions/aggregateDecisionTreeAnalytics";
import { subDays, format, startOfDay, eachDayOfInterval } from "date-fns";
import { ArrowLeft, RefreshCw, BarChart2, Users, TrendingUp } from "lucide-react";
import KpiTiles from "@/components/admin/dt/analytics/KpiTiles";
import FunnelSection from "@/components/admin/dt/analytics/FunnelSection";
import TimeSeriesChart from "@/components/admin/dt/analytics/TimeSeriesChart";
import BreakdownCharts from "@/components/admin/dt/analytics/BreakdownCharts";
import FieldValueExplorer from "@/components/admin/dt/analytics/FieldValueExplorer";
import PathExplorer from "@/components/admin/dt/analytics/PathExplorer";
import LeadsView from "@/components/admin/dt/analytics/LeadsView";

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1, offset: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "All Time", days: 3650 },
];

export default function DecisionTreeAnalytics() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get("tab") || "overview");
  const [datePreset, setDatePreset] = useState("Last 30 Days");
  const [dateFrom, setDateFrom] = useState(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState(new Date());
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeMsg, setRecomputeMsg] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const handlePreset = (preset) => {
    setDatePreset(preset.label);
    const now = new Date();
    if (preset.label === "Today") {
      setDateFrom(startOfDay(now));
      setDateTo(now);
    } else if (preset.label === "Yesterday") {
      setDateFrom(startOfDay(subDays(now, 1)));
      setDateTo(startOfDay(now));
    } else {
      setDateFrom(subDays(now, preset.days));
      setDateTo(now);
    }
  };

  const { data: quiz } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => base44.entities.Quiz.filter({ id: quizId }).then(r => r[0]),
  });

  const fromStr = dateFrom.toISOString();
  const toStr = dateTo.toISOString();

  const { data: runs = [], refetch: refetchRuns, isLoading: loadingRuns } = useQuery({
    queryKey: ["dt-runs", quizId, fromStr, toStr],
    queryFn: () => base44.entities.DecisionTreeRun.filter({ quiz_id: quizId }, "-started_at", 5000),
    select: (data) => data.filter(r => r.started_at >= fromStr && r.started_at <= toStr),
  });

  const { data: nodeAnalytics = [], refetch: refetchAnalytics } = useQuery({
    queryKey: ["dt-node-analytics", quizId],
    queryFn: () => base44.entities.DecisionTreeNodeAnalytics.filter({ quiz_id: quizId }, "-date", 2000),
  });

  const { data: nodes = [] } = useQuery({
    queryKey: ["questions", quizId],
    queryFn: () => base44.entities.Question.filter({ quiz_id: quizId }, "order_index"),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["dt-brands"],
    queryFn: () => base44.entities.DecisionTreeBrand.list(),
  });

  const { data: customFields = [] } = useQuery({
    queryKey: ["custom-fields"],
    queryFn: () => base44.entities.CustomField.list("-created_date", 200),
  });

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchRuns();
      refetchAnalytics();
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetchRuns, refetchAnalytics]);

  const handleRecompute = async () => {
    setRecomputing(true);
    setRecomputeMsg("");
    try {
      const res = await aggregateDecisionTreeAnalytics({ quiz_id: quizId, backfill: true });
      const d = res.data;
      setRecomputeMsg(`Done: ${d.processed} runs, ${d.analytics_rows_created} created, ${d.analytics_rows_updated} updated.`);
      refetchAnalytics();
    } catch (err) {
      setRecomputeMsg("Error: " + err.message);
    } finally {
      setRecomputing(false);
    }
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "funnel", label: "Funnel" },
    { id: "paths", label: "Paths" },
    { id: "fields", label: "Field Explorer" },
    { id: "leads", label: "Leads" },
  ];

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button onClick={() => navigate(`/admin/decision-trees`)} className="p-1.5 rounded hover:bg-muted transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Decision Trees /</span>
              <Link to={`/admin/decision-trees/${quizId}/edit`} className="text-xs text-muted-foreground hover:text-primary truncate">
                {quiz?.title || "..."}
              </Link>
              <span className="text-xs text-muted-foreground">/ Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground truncate">{quiz?.title} - Analytics</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date presets */}
          <div className="flex gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
            {PRESETS.map(p => (
              <button key={p.label}
                onClick={() => handlePreset(p)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${datePreset === p.label ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${autoRefresh ? "bg-green-100 text-green-700 border-green-300" : "border-border text-muted-foreground hover:bg-muted"}`}>
            <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto" : "Manual"}
          </button>

          <button
            onClick={handleRecompute}
            disabled={recomputing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors">
            <BarChart2 className="w-3 h-3" />
            {recomputing ? "Recomputing..." : "Recompute Now"}
          </button>
        </div>
      </div>

      {recomputeMsg && (
        <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{recomputeMsg}</div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <KpiTiles runs={runs} loading={loadingRuns} dateFrom={dateFrom} dateTo={dateTo} />
          <TimeSeriesChart runs={runs} dateFrom={dateFrom} dateTo={dateTo} />
          <BreakdownCharts runs={runs} brands={brands} />
        </div>
      )}

      {/* Funnel tab */}
      {activeTab === "funnel" && (
        <FunnelSection
          quizId={quizId}
          nodes={nodes}
          nodeAnalytics={nodeAnalytics}
          runs={runs}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}

      {/* Paths tab */}
      {activeTab === "paths" && (
        <PathExplorer runs={runs} nodes={nodes} />
      )}

      {/* Field Explorer tab */}
      {activeTab === "fields" && (
        <FieldValueExplorer runs={runs} customFields={customFields} />
      )}

      {/* Leads tab */}
      {activeTab === "leads" && (
        <LeadsView
          quizId={quizId}
          nodes={nodes}
          brands={brands}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}
    </div>
  );
}