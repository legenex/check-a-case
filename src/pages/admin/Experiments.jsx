import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Users, TrendingUp, ToggleLeft, ToggleRight } from "lucide-react";
import { format, subDays } from "date-fns";

const TOOLS = [
  { name: "Claim Value Estimator", path: "/tools/claim-estimator", source: "tool-claim-estimator", description: "Multi-step claim calculator with high-end bias and lead gate." },
  { name: "Lifestyle Cost Calculator", path: "/tools/lifestyle-cost", source: "tool-lifestyle-cost", description: "Lifetime financial impact of injuries by age, income, and severity." },
  { name: "Adjuster Lowball Simulator", path: "/tools/adjuster-simulator", source: "tool-adjuster-simulator", description: "Shows the gap between adjuster offers and attorney-negotiated settlements." },
  { name: "Statute of Limitations Clock", path: "/tools/crash-clock", source: "tool-crash-clock", description: "Real-time countdown to the SOL deadline by state and accident date." },
  { name: "AI Demand Letter Generator", path: "/tools/demand-letter", source: "tool-demand-letter", description: "AI-drafted professional demand letter with pre-filled financial data." },
];

export default function Experiments() {
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data: leads = [] } = useQuery({
    queryKey: ["experiments-leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 5000),
  });

  const recentLeads = leads.filter(l => l.created_date > thirtyDaysAgo);

  const getToolStats = (source) => {
    const toolLeads = recentLeads.filter(l => l.source === source);
    return { leads: toolLeads.length };
  };

  const totalLeads30d = TOOLS.reduce((sum, t) => sum + getToolStats(t.source).leads, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-foreground">Lead-Gen Tools</h1>
      </div>

      {/* KPI tile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Tool Leads (30d)</p>
          <p className="text-3xl font-black text-foreground">{totalLeads30d}</p>
        </Card>
        <Card className="rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Active Tools</p>
          <p className="text-3xl font-black text-foreground">{TOOLS.length}</p>
        </Card>
        <Card className="rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Leads/Tool</p>
          <p className="text-3xl font-black text-foreground">{TOOLS.length ? Math.round(totalLeads30d / TOOLS.length) : 0}</p>
        </Card>
        <Card className="rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Top Tool</p>
          <p className="text-sm font-bold text-foreground truncate">
            {TOOLS.reduce((best, t) => getToolStats(t.source).leads > getToolStats(best.source).leads ? t : best, TOOLS[0])?.name || "—"}
          </p>
        </Card>
      </div>

      {/* Tool cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {TOOLS.map((tool) => {
          const stats = getToolStats(tool.source);
          return (
            <Card key={tool.path} className="rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-base">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{tool.path}</p>
                </div>
                <Badge className="bg-green-100 text-green-700 flex-shrink-0">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span><strong className="text-foreground">{stats.leads}</strong> leads (30d)</span>
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                <a
                  href={tool.path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Live
                </a>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Existing experiments */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-4">A/B Experiments</h2>
        <Card className="rounded-xl p-6 text-muted-foreground text-sm">
          Use the Experiment entity to define variants. Each experiment maps to a tool and overrides specific fields for split testing. Create records in the database and reference them by slug in the tool components.
        </Card>
      </div>
    </div>
  );
}