import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

const VALUE_SOURCES = [
  { value: "answer_value", label: "Answer Value" },
  { value: "answer_label", label: "Answer Label" },
  { value: "static", label: "Static Value" },
  { value: "url_param:name", label: "URL Param" },
  { value: "session:key", label: "Session Key" },
];

const TRANSFORMS = [
  { value: "none", label: "None" },
  { value: "lowercase", label: "Lowercase" },
  { value: "uppercase", label: "Uppercase" },
  { value: "trim", label: "Trim" },
  { value: "phone_format", label: "Phone Format" },
  { value: "state_2letter", label: "State 2-Letter" },
  { value: "date_iso", label: "Date ISO" },
];

export default function CustomFieldAssignmentRow({ assignment, onChange, onRemove }) {
  const { data: fields = [] } = useQuery({
    queryKey: ["custom-fields"],
    queryFn: () => base44.entities.CustomField.list("-created_date", 500),
  });

  return (
    <div className="bg-muted/40 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Select value={assignment.custom_field_id || ""} onValueChange={(v) => onChange({ ...assignment, custom_field_id: v })}>
          <SelectTrigger className="flex-1 h-7 text-xs"><SelectValue placeholder="Select field..." /></SelectTrigger>
          <SelectContent>
            {fields.map((f) => <SelectItem key={f.id} value={f.field_key}>{f.display_label} ({f.field_key})</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={onRemove}><Trash2 className="w-3 h-3 text-muted-foreground" /></button>
      </div>
      <div className="flex gap-2">
        <Select value={assignment.value_source || "answer_value"} onValueChange={(v) => onChange({ ...assignment, value_source: v })}>
          <SelectTrigger className="flex-1 h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {VALUE_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {assignment.value_source === "static" && (
          <Input value={assignment.value || ""} onChange={(e) => onChange({ ...assignment, value: e.target.value })} className="flex-1 h-7 text-xs" placeholder="Static value" />
        )}
        <Select value={assignment.transform || "none"} onValueChange={(v) => onChange({ ...assignment, transform: v })}>
          <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TRANSFORMS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}