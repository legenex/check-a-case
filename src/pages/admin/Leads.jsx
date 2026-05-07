import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-purple-100 text-purple-700",
  converted: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
  archived: "bg-gray-100 text-gray-500",
};

const QUAL_COLORS = {
  qualified: "bg-green-100 text-green-700",
  soft_dq: "bg-yellow-100 text-yellow-700",
  hard_dq: "bg-red-100 text-red-700",
};

export default function Leads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [qualFilter, setQualFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data: leads = [] } = useQuery({
    queryKey: ["admin-leads-list"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200),
  });

  const filtered = leads.filter((l) => {
    const matchSearch =
      !search ||
      `${l.first_name} ${l.last_name} ${l.email} ${l.phone}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchQual = qualFilter === "all" || l.qualification === qualFilter;
    return matchSearch && matchStatus && matchQual;
  });

  if (selected) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back to Leads
        </button>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>{selected.first_name} {selected.last_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selected.email || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{selected.phone || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">State</p><p className="font-medium">{selected.state || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Zip</p><p className="font-medium">{selected.zip_code || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Accident Type</p><p className="font-medium">{selected.accident_type || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Injury Severity</p><p className="font-medium">{selected.injury_severity || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Qualification</p><Badge className={QUAL_COLORS[selected.qualification]}>{selected.qualification}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Source</p><p className="font-medium">{selected.source || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Campaign</p><p className="font-medium">{selected.campaign || "—"}</p></div>
            </div>
            {selected.attribution && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Attribution</p>
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">{JSON.stringify(selected.attribution, null, 2)}</pre>
              </div>
            )}
            {selected.quiz_answers && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quiz Answers</p>
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">{JSON.stringify(selected.quiz_answers, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Leads</h1>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => {
          const csv = ["First Name,Last Name,Email,Phone,State,Status,Qualification,Source,Created"]
            .concat(filtered.map(l => `${l.first_name},${l.last_name},${l.email},${l.phone},${l.state},${l.status},${l.qualification},${l.source},${l.created_date}`))
            .join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "leads.csv"; a.click();
        }}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={qualFilter} onValueChange={setQualFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Qualification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="soft_dq">Soft DQ</SelectItem>
            <SelectItem value="hard_dq">Hard DQ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">State</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Qual</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{lead.first_name} {lead.last_name}</td>
                  <td className="p-4 hidden sm:table-cell text-muted-foreground">{lead.phone}</td>
                  <td className="p-4 hidden md:table-cell text-muted-foreground">{lead.state}</td>
                  <td className="p-4"><Badge className={`text-xs ${STATUS_COLORS[lead.status] || ""}`}>{lead.status}</Badge></td>
                  <td className="p-4 hidden md:table-cell"><Badge className={`text-xs ${QUAL_COLORS[lead.qualification] || ""}`}>{lead.qualification}</Badge></td>
                  <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">{lead.created_date ? format(new Date(lead.created_date), "MMM d, yyyy") : ""}</td>
                  <td className="p-4">
                    <button onClick={() => setSelected(lead)} className="text-primary hover:text-primary/80">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No leads found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}