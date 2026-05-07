import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users2, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function Overview() {
  const { data: leads = [] } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 100),
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: () => base44.entities.IntegrationConfig.filter({ type: "trusted_form" }),
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const todayLeads = leads.filter((l) => new Date(l.created_date) >= today).length;
  const weekLeads = leads.filter((l) => new Date(l.created_date) >= weekAgo).length;
  const monthLeads = leads.filter((l) => new Date(l.created_date) >= monthAgo).length;

  const tfConfigured = integrations.some((i) => i.enabled);

  const qualifiedCount = leads.filter((l) => l.qualification === "qualified").length;
  const softDqCount = leads.filter((l) => l.qualification === "soft_dq").length;
  const hardDqCount = leads.filter((l) => l.qualification === "hard_dq").length;

  const recentLeads = leads.slice(0, 20);

  const statusColors = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-purple-100 text-purple-700",
    converted: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
    archived: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back to Check A Case admin.</p>
      </div>

      {/* Compliance banner */}
      {!tfConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800">TrustedForm not configured</p>
            <p className="text-sm text-yellow-700">
              Go to Integrations → TrustedForm to enable cert claiming for TCPA compliance.
            </p>
          </div>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today", value: todayLeads, icon: TrendingUp },
          { label: "This Week", value: weekLeads, icon: TrendingUp },
          { label: "This Month", value: monthLeads, icon: TrendingUp },
          { label: "All Time", value: leads.length, icon: Users2 },
        ].map((kpi) => (
          <Card key={kpi.label} className="rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">Leads</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Qualification Split + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Qualification donut simplified as stats */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Qualification Split</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Qualified</span>
              </div>
              <span className="font-bold">{qualifiedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Soft DQ</span>
              </div>
              <span className="font-bold">{softDqCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Hard DQ</span>
              </div>
              <span className="font-bold">{hardDqCount}</span>
            </div>
            {leads.length > 0 && (
              <div className="pt-4 border-t border-border">
                <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: `${(qualifiedCount / leads.length) * 100}%` }}
                  />
                  <div
                    className="bg-yellow-400 transition-all"
                    style={{ width: `${(softDqCount / leads.length) * 100}%` }}
                  />
                  <div
                    className="bg-red-400 transition-all"
                    style={{ width: `${(hardDqCount / leads.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-muted-foreground text-sm">No leads yet. Once leads come in from the Survey, they'll appear here.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.phone} · {lead.state}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs ${statusColors[lead.status] || "bg-muted text-muted-foreground"}`}
                    >
                      {lead.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}