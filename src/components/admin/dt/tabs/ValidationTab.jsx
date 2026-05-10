import React from "react";
import { Trash2, Plus } from "lucide-react";

const RULE_TYPES = ["regex", "min_length", "max_length", "allowed_values", "blocklist", "valid_email", "valid_phone", "valid_zip", "spam_filter"];

export default function ValidationTab({ node, onUpdate }) {
  const rules = node.validation_rules || [];

  const handleUpdate = (idx, patch) => {
    onUpdate({ validation_rules: rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });
  };

  const handleAdd = () => {
    onUpdate({ validation_rules: [...rules, { rule_type: "regex", params: {}, error_message: "" }] });
  };

  const handleDelete = (idx) => {
    onUpdate({ validation_rules: rules.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Validation rules are checked at runtime before advancing.</p>
      {rules.map((rule, idx) => (
        <div key={idx} className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <select
              value={rule.rule_type}
              onChange={(e) => handleUpdate(idx, { rule_type: e.target.value })}
              className="h-8 px-2 rounded border border-input bg-background text-sm flex-1"
            >
              {RULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => handleDelete(idx)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {(rule.rule_type === "regex" || rule.rule_type === "min_length" || rule.rule_type === "max_length") && (
            <div>
              <label className="text-xs text-muted-foreground">{rule.rule_type === "regex" ? "Pattern" : "Value"}</label>
              <input
                value={rule.params?.value || ""}
                onChange={(e) => handleUpdate(idx, { params: { value: e.target.value } })}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm font-mono mt-0.5"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">Error Message</label>
            <input
              value={rule.error_message || ""}
              onChange={(e) => handleUpdate(idx, { error_message: e.target.value })}
              placeholder="Message shown when validation fails"
              className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5"
            />
          </div>
        </div>
      ))}
      <button onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        <Plus className="w-4 h-4" /> Add Rule
      </button>
    </div>
  );
}