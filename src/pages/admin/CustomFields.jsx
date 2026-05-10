import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lock, Eye, EyeOff, Trash2, Pencil, Search } from "lucide-react";
import CustomFieldModal from "@/components/admin/decision-trees/CustomFieldModal";

export default function CustomFields() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [filterPii, setFilterPii] = useState("all");
  const [filterSystem, setFilterSystem] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: fields = [] } = useQuery({
    queryKey: ["custom-fields"],
    queryFn: () => base44.entities.CustomField.list("-created_date", 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomField.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-fields"] }),
  });

  const categories = [...new Set(fields.map((f) => f.category).filter(Boolean))];

  const filtered = fields.filter((f) => {
    if (search && !f.field_key?.includes(search.toLowerCase()) && !f.display_label?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    if (filterScope !== "all" && f.scope !== filterScope) return false;
    if (filterPii === "yes" && !f.is_pii) return false;
    if (filterPii === "no" && f.is_pii) return false;
    if (filterSystem === "yes" && !f.is_system) return false;
    if (filterSystem === "no" && f.is_system) return false;
    return true;
  });

  const typeColors = {
    string: "bg-blue-100 text-blue-700",
    email: "bg-purple-100 text-purple-700",
    phone: "bg-green-100 text-green-700",
    enum: "bg-orange-100 text-orange-700",
    boolean: "bg-pink-100 text-pink-700",
    number: "bg-yellow-100 text-yellow-700",
    url: "bg-cyan-100 text-cyan-700",
    date: "bg-rose-100 text-rose-700",
    default: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custom Fields</h1>
          <p className="text-muted-foreground mt-1">Manage reusable lead data fields across all decision trees.</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Field
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search fields..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-60" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterScope} onValueChange={setFilterScope}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Scope" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="quiz">Quiz-scoped</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPii} onValueChange={setFilterPii}>
          <SelectTrigger className="w-32"><SelectValue placeholder="PII" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All PII</SelectItem>
            <SelectItem value="yes">PII only</SelectItem>
            <SelectItem value="no">Non-PII</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSystem} onValueChange={setFilterSystem}>
          <SelectTrigger className="w-36"><SelectValue placeholder="System" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">System only</SelectItem>
            <SelectItem value="no">Custom only</SelectItem>
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Field Key</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Display Label</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scope</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">PII</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">System</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((field) => (
                  <tr key={field.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-foreground bg-muted/10">{field.field_key}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{field.display_label}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[field.field_type] || typeColors.default}`}>
                        {field.field_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{field.category || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={field.scope === "global" ? "default" : "secondary"} className="text-xs">
                        {field.scope || "global"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {field.is_pii ? <Eye className="w-4 h-4 text-amber-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground/40" />}
                    </td>
                    <td className="px-4 py-3">
                      {field.is_system && <Lock className="w-4 h-4 text-muted-foreground" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(field); setModalOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {!field.is_system && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => {
                            if (confirm(`Delete field "${field.field_key}"?`)) deleteMutation.mutate(field.id);
                          }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No fields found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CustomFieldModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        field={editing}
        onSaved={() => { queryClient.invalidateQueries({ queryKey: ["custom-fields"] }); setModalOpen(false); setEditing(null); }}
      />
    </div>
  );
}