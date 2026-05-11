import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Plus } from "lucide-react";

/** Labelled text/number/date input */
export function Field({ label, value, onChange, type = "text", placeholder = "", helper, required, rows, className = "" }) {
  if (rows) {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          value={value || ""}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-y ${className}`}
        />
        {helper && <p className="text-[10px] text-slate-400 mt-0.5">{helper}</p>}
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full h-9 px-3 rounded-md border border-input bg-background text-sm ${className}`}
      />
      {helper && <p className="text-[10px] text-slate-400 mt-0.5">{helper}</p>}
    </div>
  );
}

/** Boolean toggle */
export function Toggle({ label, value, onChange, helper }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <div>
        <span className="text-sm text-slate-700">{label}</span>
        {helper && <p className="text-[10px] text-slate-400">{helper}</p>}
      </div>
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 accent-blue-600 flex-shrink-0"
      />
    </label>
  );
}

/** Wrapper with label */
export function EditorField({ label, required, helper, className = "", children }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {helper && <p className="text-[10px] text-slate-400 mt-0.5">{helper}</p>}
    </div>
  );
}

/** Collapsible section */
export function EditorSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
      >
        {title}
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

/** Node picker dropdown */
export function NodePicker({ value, onChange, allNodes = [] }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value || null)}
      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
    >
      <option value="">-- None --</option>
      {allNodes.map((n) => (
        <option key={n.node_id || n.id || n._flowId} value={n.node_id || n.id || n._flowId}>
          {n.label || n.node_type}
        </option>
      ))}
    </select>
  );
}

/** Custom field key picker (loads from DB) */
export function CustomFieldPicker({ value, onChange, quizId }) {
  const { data: fields = [] } = useQuery({
    queryKey: ["custom-fields-picker", quizId],
    queryFn: async () => {
      const global = await base44.entities.CustomField.filter({ scope: "global" }, "display_label", 200);
      const quizScoped = quizId
        ? await base44.entities.CustomField.filter({ scope: "quiz", quiz_id: quizId }, "display_label", 50)
        : [];
      return [...global, ...quizScoped];
    },
    staleTime: 60000,
  });

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value || "")}
      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
    >
      <option value="">-- Select field --</option>
      {fields.map((f) => (
        <option key={f.id} value={f.field_key}>
          {f.display_label} ({f.field_key})
        </option>
      ))}
    </select>
  );
}

/** Chip/tag input */
export function ChipInput({ value = [], onChange, placeholder = "Add tag..." }) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim().toLowerCase().replace(/[^a-z0-9_:]/g, "_");
    if (v && !value.includes(v)) onChange?.([...value, v]);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full">
            {tag}
            <button type="button" onClick={() => onChange?.(value.filter((t) => t !== tag))} className="hover:text-red-500">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 h-8 px-2 rounded border border-slate-200 bg-white text-xs"
        />
        <button type="button" onClick={add} className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs hover:bg-blue-100">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

const OPERATORS = [
  { value: "eq",           label: "equals" },
  { value: "ne",           label: "does not equal" },
  { value: "gt",           label: "greater than" },
  { value: "lt",           label: "less than" },
  { value: "gte",          label: ">= (gte)" },
  { value: "lte",          label: "<= (lte)" },
  { value: "in",           label: "is one of" },
  { value: "not_in",       label: "is not one of" },
  { value: "contains",     label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with",  label: "starts with" },
  { value: "ends_with",    label: "ends with" },
  { value: "is_empty",     label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
  { value: "has_tag",      label: "has tag" },
  { value: "not_has_tag",  label: "does not have tag" },
  { value: "matches_regex",label: "matches regex" },
];

const NO_VALUE_OPS = new Set(["is_empty", "is_not_empty"]);
const CHIP_OPS     = new Set(["in", "not_in", "has_tag", "not_has_tag"]);
const TAG_OPS      = new Set(["has_tag", "not_has_tag"]);

/** Condition builder for a single condition */
export function ConditionRow({ condition, onChange, onDelete, quizId }) {
  const { data: fields = [] } = useQuery({
    queryKey: ["custom-fields-picker", quizId],
    queryFn: async () => {
      const global = await base44.entities.CustomField.filter({ scope: "global" }, "display_label", 200);
      const quizScoped = quizId
        ? await base44.entities.CustomField.filter({ scope: "quiz", quiz_id: quizId }, "display_label", 50)
        : [];
      return [...global, ...quizScoped];
    },
    staleTime: 60000,
  });

  const op = condition.operator || "eq";
  const isTagField = condition.field === "__tags" || TAG_OPS.has(op);

  const handleFieldChange = (val) => {
    const updates = { ...condition, field: val };
    if (val === "__tags" && !TAG_OPS.has(op)) updates.operator = "has_tag";
    onChange(updates);
  };

  const handleOpChange = (val) => {
    const updates = { ...condition, operator: val };
    if (TAG_OPS.has(val)) updates.field = "__tags";
    onChange(updates);
  };

  // chip value is stored as comma-separated string for in/not_in, single string for tag ops
  const chipValues = CHIP_OPS.has(op)
    ? (Array.isArray(condition.value) ? condition.value : (condition.value ? String(condition.value).split(",").map(s => s.trim()).filter(Boolean) : []))
    : [];

  const handleChipChange = (arr) => {
    onChange({ ...condition, value: TAG_OPS.has(op) ? (arr[0] || "") : arr });
  };

  return (
    <div className="flex items-start gap-2 flex-wrap">
      {/* Field selector */}
      <select
        value={isTagField ? "__tags" : (condition.field || "")}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="w-36 h-8 px-2 rounded border border-slate-200 bg-white text-xs"
      >
        <option value="">-- field --</option>
        <option value="__tags">Tags</option>
        {fields.map((f) => (
          <option key={f.id} value={f.field_key}>{f.display_label}</option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={op}
        onChange={(e) => handleOpChange(e.target.value)}
        className="h-8 px-2 rounded border border-slate-200 bg-white text-xs"
      >
        {OPERATORS
          .filter((o) => isTagField ? TAG_OPS.has(o.value) : true)
          .map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Value input */}
      {!NO_VALUE_OPS.has(op) && (
        CHIP_OPS.has(op) ? (
          <div className="flex-1 min-w-[120px]">
            <ChipInput
              value={chipValues}
              onChange={handleChipChange}
              placeholder={TAG_OPS.has(op) ? "tag name..." : "add value..."}
            />
          </div>
        ) : (
          <div className="flex-1 min-w-[80px]">
            <input
              value={typeof condition.value === 'string' ? condition.value : (condition.value ?? "")}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              placeholder={op === "matches_regex" ? "regex pattern" : "value"}
              className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs"
            />
            {op === "matches_regex" && (
              <p className="text-[10px] text-slate-400 mt-0.5">JavaScript regex (without slashes)</p>
            )}
          </div>
        )
      )}

      <button type="button" onClick={onDelete} className="text-red-400 hover:text-red-600 flex-shrink-0 mt-1">
        <X size={13} />
      </button>
    </div>
  );
}

/** Condition group with AND/OR logic */
export function ConditionGroup({ value, onChange, quizId }) {
  const group = value || { logic: "AND", conditions: [] };
  const conditions = group.conditions || [];

  const updateCondition = (idx, updated) => {
    onChange({ ...group, conditions: conditions.map((c, i) => i === idx ? updated : c) });
  };
  const deleteCondition = (idx) => {
    onChange({ ...group, conditions: conditions.filter((_, i) => i !== idx) });
  };
  const addCondition = () => {
    onChange({ ...group, conditions: [...conditions, { field: "", operator: "eq", value: "" }] });
  };
  const toggleLogic = () => {
    onChange({ ...group, logic: group.logic === "AND" ? "OR" : "AND" });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggleLogic}
          className={`px-2 py-0.5 text-xs font-bold rounded border transition-colors ${
            group.logic === "AND"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
          {group.logic}
        </button>
        <span className="text-[10px] text-slate-400">Click to toggle AND / OR</span>
      </div>
      {conditions.map((c, idx) => (
        <ConditionRow key={idx} condition={c} quizId={quizId}
          onChange={(updated) => updateCondition(idx, updated)}
          onDelete={() => deleteCondition(idx)} />
      ))}
      <button type="button" onClick={addCondition}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
        <Plus size={11} /> Add Condition
      </button>
    </div>
  );
}

/** Scripts editor */
export function ScriptsEditor({ value = [], onChange, triggers = ["on_enter", "on_exit"] }) {
  const addScript = () => {
    onChange([...value, { name: "", trigger: triggers[0], language: "javascript", code: "", is_enabled: true }]);
  };
  const updateScript = (idx, patch) => {
    onChange(value.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };
  const removeScript = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {value.map((script, idx) => (
        <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <input value={script.name || ""} placeholder="Script name"
              onChange={(e) => updateScript(idx, { name: e.target.value })}
              className="flex-1 h-7 px-2 rounded border border-slate-200 bg-white text-xs" />
            <select value={script.trigger || triggers[0]}
              onChange={(e) => updateScript(idx, { trigger: e.target.value })}
              className="h-7 px-1 rounded border border-slate-200 bg-white text-xs">
              {triggers.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
              <input type="checkbox" checked={script.is_enabled !== false}
                onChange={(e) => updateScript(idx, { is_enabled: e.target.checked })} />
              On
            </label>
            <button type="button" onClick={() => removeScript(idx)} className="text-red-400 hover:text-red-600 text-xs">x</button>
          </div>
          <textarea value={script.code || ""} rows={5} placeholder="// JavaScript"
            onChange={(e) => updateScript(idx, { code: e.target.value })}
            className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs font-mono resize-y" />
        </div>
      ))}
      <button type="button" onClick={addScript}
        className="w-full flex items-center justify-center gap-1 py-2 rounded border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
        <Plus size={12} /> Add Script
      </button>
    </div>
  );
}