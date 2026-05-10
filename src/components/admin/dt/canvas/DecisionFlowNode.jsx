import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { AlertCircle, Database, Tag, Code, Edit, Copy, Trash2, Circle } from "lucide-react";
import { getCategoryForType, getBorderClass } from "./nodeCategories";

const ANSWER_TYPES = new Set(["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"]);
const OUTCOME_TYPES = ["results_page"];

export const DecisionFlowNode = memo(function DecisionFlowNode({ data, selected }) {
  const { typeDef, cat } = getCategoryForType(data.node_type);
  const Icon = typeDef.Icon;
  const isOutcome = OUTCOME_TYPES.includes(data.node_type);
  const isAnswerType = ANSWER_TYPES.has(data.node_type);
  const borderClass = getBorderClass(data.node_type);
  const rules = data.config?.rules || [];
  const cfCount = (data.custom_field_assignments || []).length;
  const tagCount = (data.tags_to_add || []).length + (data.tags_to_remove || []).length;
  const scriptCount = (data.scripts || []).length;
  const hasError = data.__error;
  const answerOptions = data.answer_options || [];

  // Check which option_ids have a connected edge
  const connectedHandles = new Set((data._connectedHandles || []));

  const isConnected = (optionId) => connectedHandles.has(optionId);

  const cardWidth = isAnswerType ? "w-[280px]" : "w-[260px]";

  return (
    <div
      className={`relative rounded-xl border-2 shadow-sm transition-all ${cardWidth} cursor-pointer group
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
      {!isAnswerType && (
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
      )}

      {/* Answer rows for answer-type nodes */}
      {isAnswerType && (
        <div className="bg-white rounded-b-xl border-t border-slate-100 overflow-hidden">
          {(cfCount > 0 || tagCount > 0 || scriptCount > 0) && (
            <div className="px-3 py-1 border-b border-slate-100 flex items-center gap-2 text-[9px] text-slate-400">
              {cfCount > 0 && <span className="inline-flex items-center gap-0.5"><Database size={8} />{cfCount}</span>}
              {tagCount > 0 && <span className="inline-flex items-center gap-0.5"><Tag size={8} />{tagCount}</span>}
              {scriptCount > 0 && <span className="inline-flex items-center gap-0.5"><Code size={8} />{scriptCount}</span>}
            </div>
          )}

          {answerOptions.length === 0 ? (
            <div className="py-3 text-center text-xs text-slate-400 italic">Add answers in the inspector</div>
          ) : (
            answerOptions.map((option) => {
              const connected = isConnected(option.option_id);
              return (
                <div
                  key={option.option_id}
                  className={`relative flex items-center gap-2 px-3 py-1.5 border-t border-slate-100 hover:bg-slate-50 transition-colors ${connected ? "bg-blue-50/30" : ""}`}
                  style={{ minHeight: 32 }}
                >
                  <Circle size={10} className="flex-shrink-0 text-slate-400" />
                  <span className="text-xs text-slate-700 truncate flex-1">{option.label || "Untitled option"}</span>
                  {option.is_dq && (
                    <span className="text-[9px] font-semibold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex-shrink-0">DQ</span>
                  )}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={option.option_id}
                    className={`!w-3 !h-3 !border-2 ${connected ? "!bg-blue-500 !border-blue-600" : "!bg-white !border-slate-400"}`}
                    style={{ right: "-6px", top: "50%", transform: "translateY(-50%)", position: "absolute" }}
                  />
                </div>
              );
            })
          )}

          {/* Default fallback handle row */}
          <div className="relative flex items-center justify-end px-3 py-1 border-t border-slate-100 bg-slate-50/50" style={{ minHeight: 28 }}>
            <span className="text-[9px] text-slate-400 italic mr-3">default</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="default"
              className="!w-3 !h-3 !border-2 !bg-slate-300 !border-slate-400"
              style={{ bottom: "-6px", left: "50%", transform: "translateX(-50%)", position: "absolute" }}
            />
          </div>
        </div>
      )}

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

      {/* Default source handle for non-answer, non-outcome, non-decision nodes */}
      {!isAnswerType && data.node_type !== "results_page" && rules.length === 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
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