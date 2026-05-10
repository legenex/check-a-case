import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SliderConfig({ config, onChange }) {
  const c = config || {};
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="text-sm font-semibold">Slider Settings</div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Min</Label>
          <Input type="number" className="mt-1 h-8" value={c.min ?? 0} onChange={(e) => onChange({ min: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs">Max</Label>
          <Input type="number" className="mt-1 h-8" value={c.max ?? 100} onChange={(e) => onChange({ max: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs">Step</Label>
          <Input type="number" className="mt-1 h-8" value={c.step ?? 1} onChange={(e) => onChange({ step: Number(e.target.value) })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Default</Label>
          <Input type="number" className="mt-1 h-8" value={c.default ?? 50} onChange={(e) => onChange({ default: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs">Prefix</Label>
          <Input className="mt-1 h-8" value={c.prefix || ""} onChange={(e) => onChange({ prefix: e.target.value })} placeholder="$" />
        </div>
        <div>
          <Label className="text-xs">Suffix</Label>
          <Input className="mt-1 h-8" value={c.suffix || ""} onChange={(e) => onChange({ suffix: e.target.value })} placeholder="days" />
        </div>
      </div>
    </div>
  );
}