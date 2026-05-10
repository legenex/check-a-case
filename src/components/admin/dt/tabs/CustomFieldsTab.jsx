import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, Plus } from "lucide-react";
import CustomFieldModal from "../CustomFieldModal";

const VALUE_SOURCES = ["static", "answer_value", "answer_label"];
const TRANSFORMS = ["none", "lowercase", "uppercase", "trim", "phone_format", "state_2letter", "date_iso"];

export default function CustomFieldsTab({ node, quizId, onUpdate }) {
  const [showCreate, setShowCreate] = useState(false);
  const [pendingRowIndex, setPendingRowIndex] = useState(null);
  const qc = useQueryClient();

  const { data: fields = [] } = useQuery({
    queryKey: ["custom-fields"],
    queryFn: () => base44.entities.CustomField.list("-created_date", 200),
  });

  const assignments = node.custom_field_assignments || [];

  const handleUpdateRow = (idx, patch) => {
    const updated = assignments.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    onUpdate({ custom_field_assignments: updated });
  };

  const handleDelete = (idx) => {
    onUpdate({ custom_field_assignments: assignments.filter((_, i) => i !== idx) });
  };

  const handleAdd = () => {
    onUpdate({ custom_field_assignments: [...assignments, { custom_field_id: "", value_source: "answer_value", value: "", transform: "none" }] });
  };

  const handleFieldCreated = () => {
    qc.invalidateQueries(["custom-fields"]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Map this node's answer to custom fields that get stored on the lead.</p>

      {assignments.map((a, idx) => (
        <div key={idx} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="flex-1 space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">Custom Field</label>
              <select
                value={a.custom_field_id}
                onChange={(e) => handleUpdateRow(idx, { custom_field_id: e.target.value })}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5"
              >
                <option value="">-- select field --</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.field_key}>{f.display_label} ({f.field_key})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Value Source</label>
                <select
                  value={a.value_source}
                  onChange={(e) => handleUpdateRow(idx, { value_source: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5"
                >
                  {VALUE_SOURCES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Transform</label>
                <select
                  value={a.transform || "none"}
                  onChange={(e) => handleUpdateRow(idx, { transform: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5"
                >
                  {TRANSFORMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {a.value_source === "static" && (
              <div>
                <label className="text-xs text-muted-foreground">Static Value</label>
                <input
                  value={a.value || ""}
                  onChange={(e) => handleUpdateRow(idx, { value: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5"
                />
              </div>
            )}
          </div>
          <button onClick={() => handleDelete(idx)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors mt-1 flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="w-4 h-4" /> Add Assignment
        </button>
        <button onClick={() => setShowCreate(true)}
          className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          + Create Field
        </button>
      </div>

      {showCreate && (
        <CustomFieldModal
          field={null}
          defaultQuizId={quizId}
          onClose={() => setShowCreate(false)}
          onSaved={handleFieldCreated}
        />
      )}
    </div>
  );
}