import React, { useState } from "react";
import { Lock, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

const TYPE_COLORS = {
  string: "bg-blue-100 text-blue-700",
  text: "bg-blue-100 text-blue-700",
  number: "bg-purple-100 text-purple-700",
  boolean: "bg-green-100 text-green-700",
  enum: "bg-amber-100 text-amber-700",
  email: "bg-pink-100 text-pink-700",
  phone: "bg-pink-100 text-pink-700",
  date: "bg-orange-100 text-orange-700",
  datetime: "bg-orange-100 text-orange-700",
  url: "bg-indigo-100 text-indigo-700",
  json: "bg-gray-100 text-gray-700",
  array_string: "bg-teal-100 text-teal-700",
};

export default function CustomFieldsTable({ fields, isLoading, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [filterPii, setFilterPii] = useState("all");
  const [filterSystem, setFilterSystem] = useState("all");

  const categories = [...new Set(fields.map((f) => f.category).filter(Boolean))];

  const filtered = fields.filter((f) => {
    if (filterCat !== "all" && f.category !== filterCat) return false;
    if (filterScope !== "all" && f.scope !== filterScope) return false;
    if (filterPii === "yes" && !f.is_pii) return false;
    if (filterPii === "no" && f.is_pii) return false;
    if (filterSystem === "yes" && !f.is_system) return false;
    if (filterSystem === "no" && f.is_system) return false;
    if (search && !f.field_key?.toLowerCase().includes(search.toLowerCase()) && !f.display_label?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search field_key or label..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] h-9 px-3 rounded-md border border-input bg-background text-sm" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterScope} onChange={(e) => setFilterScope(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Scopes</option>
          <option value="global">Global</option>
          <option value="quiz">Quiz-scoped</option>
        </select>
        <select value={filterPii} onChange={(e) => setFilterPii(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">PII: All</option>
          <option value="yes">PII: Yes</option>
          <option value="no">PII: No</option>
        </select>
        <select value={filterSystem} onChange={(e) => setFilterSystem(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">System: All</option>
          <option value="yes">System Only</option>
          <option value="no">Custom Only</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">field_key</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Display Label</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scope</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">PII</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">System</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Uses</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">No fields found.</td></tr>
            )}
            {filtered.map((f) => (
              <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{f.field_key}</code>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{f.display_label}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLORS[f.field_type] || "bg-gray-100 text-gray-700"}`}>
                    {f.field_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{f.category}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${f.scope === "global" ? "bg-secondary text-secondary-foreground" : "bg-purple-100 text-purple-700"}`}>
                    {f.scope}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {f.is_pii ? <Eye className="w-4 h-4 text-amber-500 mx-auto" /> : <EyeOff className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                </td>
                <td className="px-4 py-3 text-center">
                  {f.is_system ? <Lock className="w-4 h-4 text-muted-foreground mx-auto" /> : null}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                  {f.is_used_count || 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onEdit(f)} className="p-1.5 rounded hover:bg-muted transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {!f.is_system && (
                      <button onClick={() => onDelete(f)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}