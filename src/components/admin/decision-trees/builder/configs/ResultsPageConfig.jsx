import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIERS = [
  { value: "", label: "None (no tier)" },
  { value: "T1", label: "T1 - Fully Qualified" },
  { value: "T2", label: "T2 - Qualified (lower value)" },
  { value: "T3", label: "T3 - Marginal" },
  { value: "DQ", label: "DQ - Disqualified" },
];

export default function ResultsPageConfig({ config, onChange }) {
  const c = config || {};
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="text-sm font-semibold">Results Page Settings</div>
      <div>
        <Label className="text-xs">Qualification Tier</Label>
        <Select value={c.qualification_tier || ""} onValueChange={(v) => onChange({ qualification_tier: v || null })}>
          <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Redirect URL</Label>
        <Input className="mt-1 h-8" value={c.redirect_url || ""} onChange={(e) => onChange({ redirect_url: e.target.value })} placeholder="/Submitted" />
      </div>
      <div>
        <Label className="text-xs">Result Template (use {"{field_key}"} for interpolation)</Label>
        <Textarea className="mt-1 text-sm" rows={5} value={c.result_template || ""} onChange={(e) => onChange({ result_template: e.target.value })} placeholder="Thank you, {first_name}! Your case has been reviewed..." />
        <div className="text-xs text-muted-foreground mt-1">Available tokens: {"{first_name}"}, {"{last_name}"}, {"{email}"}, {"{state}"}, etc.</div>
      </div>
    </div>
  );
}