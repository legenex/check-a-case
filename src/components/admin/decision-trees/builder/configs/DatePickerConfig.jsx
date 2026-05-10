import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const BUCKET_LABELS = [
  "within_7_days", "within_14_days", "within_30_days",
  "within_3_months", "within_6_months", "within_12_months",
  "within_18_months", "within_24_months", "more_than_2_years"
];

export default function DatePickerConfig({ config, nodeId, onChange }) {
  const c = config || {};
  const queryClient = useQueryClient();

  const handleBucketToggle = async (enabled) => {
    onChange({ bucket_into_ranges: enabled });
    if (enabled && nodeId) {
      // Create derived bucket CustomField
      const key = `${nodeId}_bucket`.slice(0, 24).replace(/-/g, "_");
      const existing = await base44.entities.CustomField.filter({ field_key: key });
      if (existing.length === 0) {
        await base44.entities.CustomField.create({
          field_key: key,
          display_label: `Date Bucket (${nodeId})`,
          field_type: "enum",
          category: "qualification",
          allowed_values: BUCKET_LABELS,
          is_system: false,
          scope: "global",
        });
        queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
      }
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="text-sm font-semibold">Date Picker Settings</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Min Date</Label>
          <Input type="date" className="mt-1 h-8 text-sm" value={c.min_date || ""} onChange={(e) => onChange({ min_date: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Max Date</Label>
          <Input type="date" className="mt-1 h-8 text-sm" value={c.max_date || ""} onChange={(e) => onChange({ max_date: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="bucket" checked={!!c.bucket_into_ranges} onCheckedChange={handleBucketToggle} />
        <Label htmlFor="bucket" className="text-sm">Bucket into ranges</Label>
      </div>
      {c.bucket_into_ranges && (
        <div className="bg-muted/40 rounded-lg p-3">
          <div className="text-xs font-medium mb-2">Range buckets (auto-created as CustomField)</div>
          <div className="grid grid-cols-2 gap-1">
            {BUCKET_LABELS.map((b) => (
              <div key={b} className="text-xs font-mono text-muted-foreground">{b}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}