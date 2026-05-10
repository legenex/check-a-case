import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StartPageConfig({ config, onChange }) {
  const c = config || {};
  const handlers = c.url_param_handlers || [];

  const { data: fields = [] } = useQuery({
    queryKey: ["custom-fields"],
    queryFn: () => base44.entities.CustomField.list("-created_date", 500),
  });

  const updateHandler = (index, field, value) => {
    const updated = handlers.map((h, i) => i === index ? { ...h, [field]: value } : h);
    onChange({ url_param_handlers: updated });
  };

  const addHandler = () => onChange({ url_param_handlers: [...handlers, { param_name: "", custom_field_id: "" }] });
  const removeHandler = (index) => onChange({ url_param_handlers: handlers.filter((_, i) => i !== index) });

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="text-sm font-semibold">Start Page - URL Param Handlers</div>
      <div className="space-y-2">
        {handlers.map((h, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={h.param_name || ""} onChange={(e) => updateHandler(i, "param_name", e.target.value)} placeholder="param_name" className="h-8 text-sm font-mono flex-1" />
            <span className="text-muted-foreground text-sm">{"→"}</span>
            <Select value={h.custom_field_id || ""} onValueChange={(v) => updateHandler(i, "custom_field_id", v)}>
              <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue placeholder="Custom field..." /></SelectTrigger>
              <SelectContent>
                {fields.map((f) => <SelectItem key={f.id} value={f.field_key}>{f.field_key}</SelectItem>)}
              </SelectContent>
            </Select>
            <button onClick={() => removeHandler(i)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addHandler} className="gap-1 text-xs">
        <Plus className="w-3 h-3" /> Add URL Param
      </Button>
    </div>
  );
}