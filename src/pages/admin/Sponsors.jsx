import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Search, Pencil, Check, X } from "lucide-react";

export default function Sponsors() {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newForm, setNewForm] = useState({ name: "", office_location: "" });
  const [showNew, setShowNew] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [showCSV, setShowCSV] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef();
  const qc = useQueryClient();

  const { data: sponsors = [] } = useQuery({
    queryKey: ["admin-sponsors"],
    queryFn: () => base44.entities.Sponsor.list("name", 1000),
  });

  const filtered = sponsors.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-sponsors"] });
  };

  const handleCreate = async () => {
    if (!newForm.name || !newForm.office_location) return;
    await base44.entities.Sponsor.create({ ...newForm, status: "active", display_order: 0 });
    setNewForm({ name: "", office_location: "" });
    setShowNew(false);
    save();
  };

  const handleUpdate = async (id) => {
    await base44.entities.Sponsor.update(id, editForm);
    setEditingId(null);
    save();
  };

  const handleDelete = async (id) => {
    await base44.entities.Sponsor.update(id, { status: "inactive" });
    save();
  };

  const parseCSV = (text) => {
    return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const commaIdx = line.indexOf(",");
      if (commaIdx === -1) return null;
      return { name: line.slice(0, commaIdx).trim(), office_location: line.slice(commaIdx + 1).trim() };
    }).filter(Boolean);
  };

  const handleCSVImport = async () => {
    const rows = parseCSV(csvText);
    if (!rows.length) return;
    setImporting(true);
    await base44.entities.Sponsor.bulkCreate(rows.map((r) => ({ ...r, status: "active", display_order: 0 })));
    setImportResult({ count: rows.length });
    setImporting(false);
    setCsvText("");
    save();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-foreground">Sponsors</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowCSV(!showCSV)}>
            <Upload className="w-4 h-4" /> CSV Import
          </Button>
          <Button className="rounded-xl gap-2" onClick={() => setShowNew(!showNew)}>
            <Plus className="w-4 h-4" /> Add Sponsor
          </Button>
        </div>
      </div>

      {/* CSV Import Panel */}
      {showCSV && (
        <Card className="rounded-xl">
          <CardHeader><CardTitle className="text-base">Bulk CSV Import</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Format: one entry per line — <code className="bg-muted px-1 rounded">Name, Office Location</code>
            </p>
            <div className="flex gap-2">
              <input type="file" ref={fileRef} accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload .csv file
              </Button>
            </div>
            <textarea
              rows={8}
              placeholder={"Aaron Boudaie, California\nAdam Baron, Coral Springs, Florida\n..."}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full border border-border rounded-xl p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {importResult && (
              <p className="text-sm text-green-600 font-medium">✓ Imported {importResult.count} sponsors successfully.</p>
            )}
            <Button disabled={importing || !csvText.trim()} className="rounded-xl" onClick={handleCSVImport}>
              {importing ? "Importing..." : `Import ${parseCSV(csvText).length} rows`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add new inline */}
      {showNew && (
        <Card className="rounded-xl">
          <CardContent className="pt-5 flex flex-wrap gap-3 items-end">
            <Input placeholder="Name" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} className="rounded-xl flex-1 min-w-[200px]" />
            <Input placeholder="Office Location" value={newForm.office_location} onChange={(e) => setNewForm({ ...newForm, office_location: e.target.value })} className="rounded-xl flex-1 min-w-[200px]" />
            <Button className="rounded-xl" onClick={handleCreate}>Save</Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowNew(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search sponsors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>
      <p className="text-sm text-muted-foreground">{filtered.length} sponsors</p>

      {/* Table */}
      <Card className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Office Location</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-4">
                    {editingId === s.id ? (
                      <Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-lg h-8 text-sm" />
                    ) : (
                      <span className="font-medium">{s.name}</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {editingId === s.id ? (
                      <Input value={editForm.office_location || ""} onChange={(e) => setEditForm({ ...editForm, office_location: e.target.value })} className="rounded-lg h-8 text-sm" />
                    ) : (
                      s.office_location
                    )}
                  </td>
                  <td className="p-4">
                    <Badge className={s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {editingId === s.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleUpdate(s.id)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingId(s.id); setEditForm({ name: s.name, office_location: s.office_location }); }} className="text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No sponsors yet. Use CSV Import to add them in bulk.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}