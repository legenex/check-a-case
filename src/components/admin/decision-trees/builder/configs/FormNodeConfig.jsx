import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function FormNodeConfig({ node, onChange }) {
  const { data: forms = [] } = useQuery({
    queryKey: ["contact-forms"],
    queryFn: () => base44.entities.ContactForm.filter({ is_active: true }),
  });

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="text-sm font-semibold">Form Node Settings</div>
      <div>
        <Label className="text-xs">Contact Form Template</Label>
        <Select value={node.contact_form_id || ""} onValueChange={(v) => onChange({ contact_form_id: v })}>
          <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select a form..." /></SelectTrigger>
          <SelectContent>
            {forms.map((f) => <SelectItem key={f.id} value={f.id}>{f.title} ({f.form_type})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Submit Button Label Override</Label>
        <Input className="mt-1 h-8" value={node.config?.submit_label || ""} onChange={(e) => onChange({ config: { ...(node.config || {}), submit_label: e.target.value } })} placeholder="Inherits from form template" />
      </div>
      <div>
        <Label className="text-xs">Redirect After Submit Override</Label>
        <Input className="mt-1 h-8" value={node.config?.redirect_after || ""} onChange={(e) => onChange({ config: { ...(node.config || {}), redirect_after: e.target.value } })} placeholder="/Submitted" />
      </div>
    </div>
  );
}