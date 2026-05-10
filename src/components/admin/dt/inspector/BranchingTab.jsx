import React from "react";
import { Plus, Trash2 } from "lucide-react";

const OPERATORS = [
  "equals", "not_equals", "contains", "starts_with", "ends_with",
  "in", "not_in", "greater_than", "less_than", "is_empty", "is_not_empty",
  "has_tag", "not_has_tag",
];

function newRule() {
  return {
    id: crypto.randomUUID(),
    label: "",
    condition_expression: "",
    field: "",
    operator: "equals",
    value: "",
    target_node_id: "",
  };
}

export default function BranchingTab({ node, allNodes, onUpdate }) {
  const config = node.config || {};
  const rules = config.rules || [];
  const elseTarget = config.else_target_node_id || "";

  const updateRules = (updated) => onUpdate({ config: { ...config, rules: updated } });
  const updateElse = (v) => onUpdate({ config: { ...config, else_target_node_id: v } });

  const nodeOptions = (allNodes || []).filter((n) => n.id !== node.id);

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-2">
        Each rule creates a labeled edge from this node. Else is the fallback path.
      </div>

      {rules.map((rule, idx) => (
        <div key={rule.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <input value={rule.label || ""}
              onChange={(e) => updateRules(rules.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
              placeholder={`Rule ${idx + 1} label`}
              className="flex-1 h-7 px-2 rounded border border-slate-200 bg-white text-xs" />
            <button onClick={() => updateRules(rules.filter((_, i) => i !== idx))}
              className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <input value={rule.field || ""}
              onChange={(e) => updateRules(rules.map((r, i) => i === idx ? { ...r, field: e.target.value } : r))}
              placeholder="field_key"
              className="h-7 px-2 rounded border border-slate-200 bg-white text-xs font-mono" />
            <select value={rule.operator || "equals"}
              onChange={(e) => updateRules(rules.map((r, i) => i === idx ? { ...r, operator: e.target.value } : r))}
              className="h-7 px-1 rounded border border-slate-200 bg-white text-xs">
              {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            <input value={rule.value || ""}
              onChange={(e) => updateRules(rules.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
              placeholder="value"
              className="h-7 px-2 rounded border border-slate-200 bg-white text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Target Node</label>
            <select value={rule.target_node_id || ""}
              onChange={(e) => updateRules(rules.map((r, i) => i === idx ? { ...r, target_node_id: e.target.value } : r))}
              className="w-full h-7 px-2 rounded border border-slate-200 bg-white text-xs mt-0.5">
              <option value="">-- pick target --</option>
              {nodeOptions.map((n) => <option key={n.id} value={n.node_id || n.id}>{n.label || n.node_type}</option>)}
            </select>
          </div>
        </div>
      ))}

      <button onClick={() => updateRules([...rules, newRule()])}
        className="w-full py-2 rounded border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
        <Plus size={12} /> Add Rule
      </button>

      <div className="pt-2 border-t border-slate-200">
        <label className="text-xs text-slate-500 font-medium">Else (fallback) Target</label>
        <select value={elseTarget}
          onChange={(e) => updateElse(e.target.value)}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-1">
          <option value="">-- required --</option>
          {nodeOptions.map((n) => <option key={n.id} value={n.node_id || n.id}>{n.label || n.node_type}</option>)}
        </select>
      </div>
    </div>
  );
}