import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { AlertCircle, Database, Tag, Code, Edit, Copy, Trash2 } from "lucide-react";
import { getCategoryForType, getBorderClass } from "./nodeCategories";

const OUTCOME_TYPES = ["results_page"];

export const DecisionFlowNode = memo(function DecisionFlowNode({ data, selected }) {
  const { typeDef, cat } = getCategoryForType(data.node_type);
  const Icon = typeDef.Icon;
  const isOutcome = OUTCOME_TYPES.includes(data.node_type);
  const borderClass = getBorderClass(data.node_type);
  const rules = data.config?.rules || [];
  const cfCount = (data.custom_field_assignments || []).length;
  const tagCount = (data.tags_to_add || []).length + (data.tags_to_remove || []).length;
  const scriptCount = (data.scripts || []).length;
  const hasError = data.__error;

  return (
    <div
      className={`relative rounded-xl border-2 shadow-sm transition-all w-[260px] cursor-pointer group
        ${borderClass}
        ${selected ? "ring-2 ring-blue-400 ring-offset-1 shadow-lg" : "hover:shadow-md"}
        ${isOutcome ? "text-white" : ""}
      `}
    >
      {/* Target handle (top) */}
      {data.node_type !== "start_page" && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !border-2 !border-white !bg-slate-400"
        />
      )}

      {/* Header */}
      <div className={`px-3 py-2 border-b flex items-center gap-2 rounded-t-xl ${isOutcome ? "border-blue-500 bg-blue-600" : "border-inherit bg-white/60"}`}>
        <Icon size={14} className={isOutcome ? "text-blue-100" : cat.iconColor} />
        <span className={`text-[10px] font-semibold uppercase tracking-wide flex-1 truncate ${isOutcome ? "text-blue-100" : "text-slate-500"}`}>
          {typeDef.label}
        </span>
        {hasError && <AlertCircle size={13} className="text-red-500 flex-shrink-0" />}
      </div>

      {/* Body */}
      <div className={`px-3 py-3 ${isOutcome ? "bg-blue-600" : "bg-white/80"}`}>
        <div className={`text-sm font-medium line-clamp-2 ${isOutcome ? "text-white" : "text-slate-900"}`}>
          {data.label || data.node_type}
        </div>
        {data.title_display && (
          <div className={`text-xs mt-1 line-clamp-2 ${isOutcome ? "text-blue-200" : "text-slate-500"}`}>
            {data.title_display}
          </div>
        )}
      </div>

      {/* Footer badges */}
      <div className={`px-3 py-1.5 border-t flex items-center gap-2 text-[10px] rounded-b-xl ${isOutcome ? "border-blue-500 bg-blue-700 text-blue-200" : "border-inherit bg-slate-50/80 text-slate-500"}`}>
        {cfCount > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <Database size={9} />{cfCount}
          </span>
        )}
        {tagCount > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <Tag size={9} />{tagCount}
          </span>
        )}
        {scriptCount > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <Code size={9} />{scriptCount}
          </span>
        )}
        {data.required && <span className="ml-auto text-red-400 font-bold">*</span>}
      </div>

      {/* Hover actions */}
      <div className="absolute -top-6 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 z-10">
        <button
          onMouseDown={(e) => { e.stopPropagation(); data.onEdit?.(); }}
          className="bg-white border border-slate-200 rounded p-1 shadow-sm hover:bg-slate-100"
          title="Edit"
        >
          <Edit size={11} className="text-slate-600" />
        </button>
        <button
          onMouseDown={(e) => { e.stopPropagation(); data.onDuplicate?.(); }}
          className="bg-white border border-slate-200 rounded p-1 shadow-sm hover:bg-slate-100"
          title="Duplicate"
        >
          <Copy size={11} className="text-slate-600" />
        </button>
        <button
          onMouseDown={(e) => { e.stopPropagation(); data.onDelete?.(); }}
          className="bg-white border border-slate-200 rounded p-1 shadow-sm hover:bg-red-50"
          title="Delete"
        >
          <Trash2 size={11} className="text-red-500" />
        </button>
      </div>

      {/* Default source handle (bottom) */}
      {data.node_type !== "results_page" && rules.length === 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !border-2 !border-white !bg-slate-400"
        />
      )}

      {/* Decision node: multiple source handles */}
      {data.node_type === "decision_node" && rules.length > 0 && (
        <>
          {rules.map((rule, idx) => (
            <Handle
              key={rule.id || idx}
              type="source"
              position={Position.Bottom}
              id={rule.id || `rule-${idx}`}
              style={{ left: `${((idx + 1) * 100) / (rules.length + 1)}%` }}
              className="!w-3 !h-3 !border-2 !border-white !bg-amber-400"
              title={rule.label || `Rule ${idx + 1}`}
            />
          ))}
          <Handle
            type="source"
            position={Position.Bottom}
            id="else"
            style={{ left: `${((rules.length + 1) * 100) / (rules.length + 2)}%` }}
            className="!w-3 !h-3 !border-2 !border-white !bg-slate-400"
            title="Else"
          />
        </>
      )}
    </div>
  );
});