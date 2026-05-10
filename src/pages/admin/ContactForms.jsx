import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Copy, Archive, Trash2, ShieldCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import ContactFormNewModal from "@/components/admin/cf/ContactFormNewModal";
import ContactFormEditor from "@/components/admin/cf/ContactFormEditor";

export default function ContactForms() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['contact-forms'],
    queryFn: () => base44.entities.ContactForm.list('-updated_date', 200),
  });

  const { data: nodes = [] } = useQuery({
    queryKey: ['questions-all'],
    queryFn: () => base44.entities.Question.filter({ node_type: 'form' }),
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes-all'],
    queryFn: () => base44.entities.Quiz.list(),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.ContactForm.delete(id),
    onSuccess: () => { qc.invalidateQueries(['contact-forms']); setConfirmDelete(null); },
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ContactForm.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries(['contact-forms']),
  });

  const duplicateMut = useMutation({
    mutationFn: async (form) => {
      const { id, created_date, updated_date, created_by, ...rest } = form;
      return base44.entities.ContactForm.create({ ...rest, title: rest.title + ' (Copy)', is_active: false });
    },
    onSuccess: () => qc.invalidateQueries(['contact-forms']),
  });

  // Build usage map
  const usageMap = {};
  for (const node of nodes) {
    if (node.contact_form_id) {
      if (!usageMap[node.contact_form_id]) usageMap[node.contact_form_id] = [];
      const quiz = quizzes.find((q) => q.id === node.quiz_id);
      usageMap[node.contact_form_id].push({ nodeId: node.id, quizId: node.quiz_id, quizTitle: quiz?.title || 'Unknown Tree' });
    }
  }

  const filtered = forms.filter((f) => {
    if (search && !f.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'all' && f.form_type !== filterType) return false;
    if (filterActive === 'active' && !f.is_active) return false;
    if (filterActive === 'inactive' && f.is_active) return false;
    return true;
  });

  if (editingForm) {
    return (
      <ContactFormEditor
        form={editingForm}
        onBack={() => { setEditingForm(null); qc.invalidateQueries(['contact-forms']); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Forms</h1>
          <p className="text-muted-foreground mt-1">Manage reusable lead capture forms for decision trees.</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Form
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search forms..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] h-9 px-3 rounded-md border border-input bg-background text-sm" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Types</option>
          <option value="qualified">Qualified</option>
          <option value="disqualified">Disqualified</option>
          <option value="newsletter">Newsletter</option>
          <option value="callback">Callback</option>
          <option value="custom">Custom</option>
        </select>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[25%]">Title</th>
              <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[10%]">Type</th>
              <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[7%]">Fields</th>
              <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[7%]">TCPA</th>
              <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[9%]">TrustedForm</th>
              <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[7%]">Used In</th>
              <th className="text-left px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[8%]">Status</th>
              <th className="text-left px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[10%]">Updated</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-[12%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">No forms found.</td></tr>
            )}
            {filtered.map((form) => {
              const usage = usageMap[form.id] || [];
              return (
                <tr key={form.id} className="border-b last:border-0 hover:bg-slate-50 transition group">
                  <td className="px-4 py-3 truncate">
                    <button onClick={() => setEditingForm(form)}
                      className="font-medium text-slate-900 hover:text-blue-600 truncate block text-left w-full">
                      {form.title}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 capitalize">
                      {form.form_type || 'custom'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center text-sm text-slate-600">{(form.fields || []).length}</td>
                  <td className="px-2 py-3 text-center">
                    {form.tcpa_enabled ? (
                      <ShieldCheck className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-slate-300 text-lg mx-auto block text-center">-</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {form.trustedform_enabled ? (
                      <ShieldCheck className="w-4 h-4 text-blue-500 mx-auto" />
                    ) : (
                      <span className="text-slate-300 text-lg mx-auto block text-center">-</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center text-sm text-slate-600 font-medium">
                    {usage.length > 0 ? (
                      <span className="text-blue-600">{usage.length}</span>
                    ) : '0'}
                  </td>
                  <td className="px-2 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-400">
                    {form.updated_date ? format(new Date(form.updated_date), 'MMM d') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <ActionBtn icon={Pencil} tooltip="Edit" onClick={() => setEditingForm(form)} primary />
                      <ActionBtn icon={Copy} tooltip="Duplicate" onClick={() => duplicateMut.mutate(form)} />
                      <ActionBtn icon={form.is_active ? Archive : ExternalLink} tooltip={form.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleActiveMut.mutate({ id: form.id, is_active: !form.is_active })} />
                      <ActionBtn icon={Trash2} tooltip="Delete" danger
                        onClick={() => {
                          if (usage.length > 0) {
                            setConfirmDelete({ form, usage });
                          } else {
                            if (confirm(`Delete "${form.title}"?`)) deleteMut.mutate(form.id);
                          }
                        }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <ContactFormNewModal
          onClose={() => setShowNew(false)}
          onCreated={(form) => { setShowNew(false); setEditingForm(form); qc.invalidateQueries(['contact-forms']); }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">Form is in use</h2>
            <p className="text-sm text-muted-foreground">
              "{confirmDelete.form.title}" is used in {confirmDelete.usage.length} decision {confirmDelete.usage.length === 1 ? 'tree' : 'trees'}. Remove references first.
            </p>
            <ul className="space-y-1 text-sm">
              {confirmDelete.usage.map((u, i) => (
                <li key={i} className="flex items-center gap-2 text-blue-600">
                  <a href={`/admin/decision-trees/${u.quizId}/edit`} target="_blank" rel="noreferrer" className="hover:underline">
                    {u.quizTitle}
                  </a>
                </li>
              ))}
            </ul>
            <button onClick={() => setConfirmDelete(null)}
              className="w-full py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, tooltip, onClick, primary, danger }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} title={tooltip}
      className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors
        ${primary ? 'hover:bg-blue-100 hover:text-blue-600' : danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-slate-200 text-slate-500'}`}>
      <Icon size={14} />
    </button>
  );
}