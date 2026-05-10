import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MoreHorizontal, ExternalLink, Copy, Archive, Trash2, Settings, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import NewDecisionTreeModal from "./NewDecisionTreeModal";

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
};

const CAMPAIGN_COLORS = {
  mva: "bg-blue-100 text-blue-700",
  mass_tort: "bg-purple-100 text-purple-700",
  workers_comp: "bg-orange-100 text-orange-700",
  slip_and_fall: "bg-rose-100 text-rose-700",
  med_mal: "bg-teal-100 text-teal-700",
  custom: "bg-slate-100 text-slate-600",
};

export default function DecisionTreesList({ onEdit }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [newModalOpen, setNewModalOpen] = useState(false);

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => base44.entities.Quiz.list("-updated_date", 200),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["dt-brands"],
    queryFn: () => base44.entities.DecisionTreeBrand.list("brand_name", 50),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quiz.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Quiz.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes"] }),
  });

  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b]));

  const filtered = quizzes.filter((q) => {
    if (filterStatus !== "all" && q.status !== filterStatus) return false;
    if (filterCampaign !== "all" && q.campaign_type !== filterCampaign) return false;
    if (filterBrand !== "all" && q.brand_id !== filterBrand) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!q.title?.toLowerCase().includes(s) && !q.slug?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const handleCopy = async (quiz) => {
    if (!confirm(`Copy "${quiz.title}" and all its nodes?`)) return;
    const copy = await base44.entities.Quiz.create({
      ...quiz,
      id: undefined,
      title: `${quiz.title} (copy)`,
      slug: `${quiz.slug}-copy`,
      status: "draft",
      total_starts: 0,
      total_completes: 0,
      total_qualified: 0,
      total_disqualified: 0,
    });
    const questions = await base44.entities.Question.filter({ quiz_id: quiz.id });
    if (questions.length > 0) {
      await base44.entities.Question.bulkCreate(questions.map((q) => ({ ...q, id: undefined, quiz_id: copy.id })));
    }
    const edges = await base44.entities.Edge.filter({ quiz_id: quiz.id });
    if (edges.length > 0) {
      await base44.entities.Edge.bulkCreate(edges.map((e) => ({ ...e, id: undefined, quiz_id: copy.id })));
    }
    queryClient.invalidateQueries({ queryKey: ["quizzes"] });
  };

  const handleDelete = async (quiz) => {
    const entered = prompt(`Type the slug "${quiz.slug}" to confirm deletion:`);
    if (entered !== quiz.slug) return;
    await deleteMutation.mutateAsync(quiz.id);
  };

  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Decision Trees</h1>
          <p className="text-muted-foreground mt-1">Build and manage multi-step qualification funnels.</p>
        </div>
        <Button onClick={() => setNewModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Decision Tree
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search trees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCampaign} onValueChange={setFilterCampaign}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Campaign Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="mva">MVA</SelectItem>
            <SelectItem value="mass_tort">Mass Tort</SelectItem>
            <SelectItem value="workers_comp">Workers Comp</SelectItem>
            <SelectItem value="slip_and_fall">Slip & Fall</SelectItem>
            <SelectItem value="med_mal">Med Mal</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.brand_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brand</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ver</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nodes</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Starts → Done</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qual%</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">DQ%</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">CR%</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Edited</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">Loading...</td></tr>
                )}
                {!isLoading && filtered.map((quiz) => {
                  const brand = brandMap[quiz.brand_id];
                  return (
                    <tr key={quiz.id} className="border-b hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3">
                        <button onClick={() => onEdit(quiz.id)} className="text-left">
                          <div className="font-medium text-foreground hover:text-primary transition-colors">{quiz.title}</div>
                          <div className="font-mono text-xs text-muted-foreground">{quiz.slug}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${CAMPAIGN_COLORS[quiz.campaign_type] || CAMPAIGN_COLORS.custom}`}>
                          {quiz.campaign_type?.replace(/_/g, " ").toUpperCase() || "CUSTOM"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {brand ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-sm text-foreground">{brand.brand_name}</span>
                          </div>
                        ) : <span className="text-muted-foreground text-xs">Default</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[quiz.status] || STATUS_COLORS.draft}`}>
                          {quiz.status || "draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">v{quiz.version || 1}</td>
                      <td className="px-4 py-3 text-muted-foreground">{quiz.total_nodes || 0}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {(quiz.total_starts || 0).toLocaleString()} → {(quiz.total_completes || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{pct(quiz.total_qualified, quiz.total_completes)}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{pct(quiz.total_disqualified, quiz.total_completes)}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{pct(quiz.total_completes, quiz.total_starts)}%</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {quiz.updated_date ? formatDistanceToNow(new Date(quiz.updated_date), { addSuffix: true }) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(quiz.id)}>
                              <Pencil className="w-4 h-4 mr-2" /> Open Builder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/q/${quiz.slug}?preview=1`, "_blank")}>
                              <ExternalLink className="w-4 h-4 mr-2" /> View Public Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleCopy(quiz)}>
                              <Copy className="w-4 h-4 mr-2" /> Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: quiz.id, data: { status: quiz.status === "published" ? "draft" : "published" } })}>
                              {quiz.status === "published" ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: quiz.id, data: { status: "archived" } })}>
                              <Archive className="w-4 h-4 mr-2" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(quiz)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={12} className="px-4 py-16 text-center text-muted-foreground">No decision trees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <NewDecisionTreeModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreated={(quizId) => { setNewModalOpen(false); onEdit(quizId); }}
      />
    </div>
  );
}