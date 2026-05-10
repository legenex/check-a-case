import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ADDRESS_FIELDS = [
  { key: "street", label: "Street" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip Code" },
  { key: "country", label: "Country" },
];

export default function AddressConfig({ config, onChange }) {
  const c = config || {};
  const enabled = c.fields_enabled || { street: true, city: true, state: true, zip: true, country: false };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="text-sm font-semibold">Address Settings</div>
      <div>
        <Label className="text-xs">Country Default</Label>
        <Input className="mt-1 h-8" value={c.country_default || "US"} onChange={(e) => onChange({ country_default: e.target.value })} placeholder="US" />
      </div>
      <div>
        <Label className="text-xs mb-2 block">Enabled Sub-fields</Label>
        <div className="space-y-2">
          {ADDRESS_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <Switch
                id={`addr-${f.key}`}
                checked={!!enabled[f.key]}
                onCheckedChange={(v) => onChange({ fields_enabled: { ...enabled, [f.key]: v } })}
              />
              <Label htmlFor={`addr-${f.key}`} className="text-sm">{f.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}