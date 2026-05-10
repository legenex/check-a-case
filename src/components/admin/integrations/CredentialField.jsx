import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CredentialField({
  label,
  fieldKey,
  value,
  onChange,
  type = "text",
  placeholder = "",
  hint,
  secret = false,
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label} {secret && <span className="text-amber-600 font-normal">(encrypted)</span>}
      </Label>
      <Input
        type={secret ? "password" : type}
        placeholder={placeholder || (secret ? "••••••••" : "")}
        value={value || ""}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className="font-mono text-sm"
        autoComplete="off"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}