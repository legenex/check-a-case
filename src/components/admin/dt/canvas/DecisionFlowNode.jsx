import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Database, Tag, Code, Copy, Trash2, Circle, Eye, Pencil, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { getCategoryForType } from "./nodeCategories";

const ANSWER_TYPES = new Set(["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"]);

const CARD_STYLES = {
  start_page:            "bg-blue-50 border-blue-300",
  custom_page:           "bg-blue-50 border-blue-300",
  single_select:         "bg-white border-slate-300",
  multiple_choice:       "bg-white border-slate-300",
  checkbox_multi_select: "bg-white border-slate-300",
  dropdown:              "bg-white border-slate-300",
  text_field:            "bg-white border-slate-300",
  text_block:            "bg-white border-slate-300",
  information:           "bg-white border-slate-300",
  slider:                "bg-white border-slate-300",
  address:               "bg-white border-slate-300",
  date_picker:           "bg-white border-slate-300",
  datetime_picker:       "bg-white border-slate-300",
  decision_node:         "bg-amber-50 border-amber-400",
  transition:            "bg-amber-50 border-amber-300",
  form:                  "bg-emerald-50 border-emerald-400",
  notification_sms:      "bg-purple-50 border-purple-400",
  notification_email:    "bg-purple-50 border-purple-400",
  notification_whatsapp: "bg-purple-50 border-purple-400",
  notification_messenger:"bg-purple-50 border-purple-400",
  notification_telegram: "bg-purple-50 border-purple-400",
  phone_verification:    "bg-cyan-50 border-cyan-400",
  webhook_api:           "bg-orange-50 border-orange-400",
  results_page:          "bg-blue-600 border-blue-700",
};

const DARK_CARD_STYLES = {
  start_page:            "bg-blue-950 border-blue-700",
  custom_page:           "bg-blue-950 border-blue-700",
  single_select:         "bg-slate-900 border-slate-700",
  multiple_choice:       "bg-slate-900 border-slate-700",
  checkbox_multi_select: "bg-slate-900 border-slate-700",
  dropdown:              "bg-slate-900 border-slate-700",
  text_field:            "bg-slate-900 border-slate-700",
  text_block:            "bg-slate-900 border-slate-700",
  information:           "bg-slate-900 border-slate-700",
  slider:                "bg-slate-900 border-slate-700",
  address:               "bg-slate-900 border-slate-700",
  date_picker:           "bg-slate-900 border-slate-700",
  datetime_picker:       "bg-slate-900 border-slate-700",
  decision_node:         "bg-amber-950 border-amber-700",
  transition:            "bg-amber-950 border-amber-800",
  form:                  "bg-emerald-950 border-emerald-700",
  notification_sms:      "bg-purple-950 border-purple-700",
  notification_email:    "bg-purple-950 border-purple-700",
  notification_whatsapp: "bg-purple-950 border-purple-700",
  notification_messenger:"bg-purple-950 border-purple-700",
  notification_telegram: "bg-purple-950 border-purple-700",
  phone_verification:    "bg-cyan-950 border-cyan-700",
  webhook_api:           "bg-orange-950 border-orange-700",
  results_page:          "bg-blue-900 border-blue-600",
};

export const DecisionFlowNode = memo(function DecisionFlowNode({ data, selected }) {
  const { typeDef, cat } = getCategoryForType(data.node_type);
  const Icon = typeDef.Icon;
  const isAnswerType = ANSWER_TYPES.has(data.node_type);
  const isDecisionNode = data.node_type === "decision_node";
  const isWebhookNode = data.node_type === "webhook_api";
  const isOutcome = data.node_type === "results_page";
  const isDark = data._darkMode;
  const showAnswers = data._showAnswerHandles !== false;
  const answerOptions = data.answer_options || [];
  const paths = data.config?.paths || [];
  const cfCount = (data.custom_field_assignments || []).length;
  const tagCount = (data.tags_to_add || []).length + (data.tags_to_remove || []).length;
  const scriptCount = (data.scripts || []).length;
  const isDirty = data._isDirty || false;
  const isUnreachable = data._unreachable || false;
  const hasNoOutgoing = data._noOutgoing || false;
  const connectedHandles = new Set(data._connectedHandles || []);

  const cardStyle = isDark
    ? (DARK_CARD_STYLES[data.node_type] || "bg-slate-900 border-slate-700")
    : (CARD_STYLES[data.node_type] || "bg-white border-slate-300");

  const textColor = (isOutcome || isDark) ? "text-white" : "text-slate-900";
  const subTextColor = isOutcome ? "text-blue-200" : isDark ? "text-slate-400" : "text-slate-500";
  const headerBg = isOutcome ? "bg-blue-700/60" : isDark ? "bg-white/5" : "bg-black/[0.03]";
  const borderColor = isOutcome ? "border-blue-500/60" : isDark ? "border-white/10" : "border-inherit";
  const footerBg = isDark ? "bg-white/5" : "bg-slate-50/80";

  return (
    <div
      className={`relative rounded-xl border shadow-sm transition-all duration-200 cursor-pointer group
        ${cardStyle}
        ${selected
          ? "shadow-lg ring-2 ring-blue-500/40 ring-offset-1"
          : "hover:shadow-md hover:ring-1 hover:ring-slate-300/60"}
      `}
      style={{ width: 280 }}
    >
      {/* TARGET handle - LEFT edge */}
      {data.node_type !== "start_page" && (
        <Handle
          type="target"
          position={Position.Left}
          id="target-left"
          className="!w-3 !h-3 !border-2 !border-slate-400 !bg-slate-200 hover:!bg-blue-400 hover:!border-blue-500 transition-colors"
          style={{ left: -6, top: "50%" }}
        />
      )}

      {/* Header */}
      <div className={`px-3 py-2 border-b ${borderColor} ${headerBg} rounded-t-xl flex items-center gap-2`}>
        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isOutcome ? "bg-blue-500/40" : "bg-current/10"}`}
          style={{ background: isOutcome ? undefined : cat.iconColor.replace("text-", "").includes("-") ? undefined : undefined }}>
          <Icon size={12} className={isOutcome ? "text-white" : cat.iconColor} />
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wide flex-1 truncate ${subTextColor}`}>
          {typeDef.label}
        </span>
        {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved changes" />}
        {isUnreachable && <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" title="Not reachable from start node" />}
        {!isUnreachable && hasNoOutgoing && !isOutcome && <span className="w-2 h-2 rounded-full bg-orange-300 flex-shrink-0" title="No outgoing connection" />}
        {data.__error && <AlertCircle size={12} className="text-red-500 flex-shrink-0" />}
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        <div className={`text-sm font-medium line-clamp-2 ${textColor}`}>
          {data.label || data.node_type}
        </div>
        {data.title_display && (
          <div className={`text-xs mt-0.5 line-clamp-2 ${subTextColor}`}>{data.title_display}</div>
        )}
      </div>

      {/* Answer rows (answer-type, showAnswers ON) */}
      {isAnswerType && showAnswers && (
        <div className={`border-t ${borderColor}`}>
          {answerOptions.length === 0 ? (
            <div className={`py-2.5 text-center text-[11px] italic ${subTextColor}`}>No answers yet</div>
          ) : (
            answerOptions.map((opt) => {
              const connected = connectedHandles.has(`answer-${opt.option_id}`);
              return (
                <div
                  key={opt.option_id}
                  className={`relative flex items-center gap-2 px-3 border-b last:border-b-0 ${borderColor} ${connected ? (isDark ? "bg-blue-900/30" : "bg-blue-50/40") : (isDark ? "hover:bg-white/5" : "hover:bg-slate-50")}`}
                  style={{ minHeight: 30 }}
                >
                  <Circle size={8} className={`flex-shrink-0 ${subTextColor}`} />
                  <span className={`text-xs truncate flex-1 ${textColor}`}>{opt.label || "Untitled"}</span>
                  {opt.is_dq && (
                    <span className="text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1 rounded flex-shrink-0">DQ</span>
                  )}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`answer-${opt.option_id}`}
                    className={`!w-3 !h-3 !border-2 transition-colors ${connected ? "!bg-blue-500 !border-blue-600" : "!bg-white !border-slate-400 hover:!bg-blue-400 hover:!border-blue-500"}`}
                    style={{ right: -6, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
                  />
                </div>
              );
            })
          )}
          {/* Default fallback row */}
          <div className={`relative flex items-center justify-between px-3 py-1.5 ${isDark ? "bg-white/5" : "bg-slate-50/60"}`} style={{ minHeight: 26 }}>
            <span className={`text-[9px] italic ${subTextColor}`}>default route</span>
            <Handle
              type="source"
              position={Position.Right}
              id="source-right"
              className="!w-3 !h-3 !border-2 !bg-slate-300 !border-slate-400"
              style={{ right: -6, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
            />
          </div>
        </div>
      )}

      {/* Answer-type collapsed (showAnswers OFF) */}
      {isAnswerType && !showAnswers && (
        <div className={`px-3 py-1.5 border-t ${borderColor} ${footerBg} rounded-b-xl flex items-center gap-2 relative`} style={{ minHeight: 30 }}>
          <span className={`text-[10px] ${subTextColor}`}>{answerOptions.length} options</span>
          {cfCount > 0 && <span className={`inline-flex items-center gap-0.5 text-[10px] ${subTextColor}`}><Database size={8} />{cfCount}</span>}
          <Handle
            type="source"
            position={Position.Right}
            id="source-right"
            className="!w-3 !h-3 !border-2 !bg-slate-300 !border-slate-400"
            style={{ right: -6, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
          />
        </div>
      )}

      {/* Decision node paths */}
      {isDecisionNode && (
        <div className={`border-t ${borderColor}`}>
          {paths.map((path) => {
            const connected = connectedHandles.has(`path-${path.path_id}`);
            return (
              <div
                key={path.path_id}
                className={`relative flex items-center gap-2 px-3 border-b last:border-b-0 ${borderColor} ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                style={{ minHeight: 30 }}
              >
                <span className={`text-xs truncate flex-1 ${textColor}`}>{path.title || `Path`}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`path-${path.path_id}`}
                  className={`!w-3 !h-3 !border-2 transition-colors ${connected ? "!bg-amber-500 !border-amber-600" : "!bg-white !border-slate-400"}`}
                  style={{ right: -6, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
                />
              </div>
            );
          })}
          {/* Else/fallback */}
          <div className={`relative flex items-center px-3 py-1.5 ${isDark ? "bg-white/5" : "bg-slate-50/60"}`} style={{ minHeight: 28 }}>
            <span className={`text-[10px] italic ${subTextColor}`}>else (fallback)</span>
            <Handle
              type="source"
              position={Position.Right}
              id="path-else"
              className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-500"
              style={{ right: -6, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
            />
          </div>
        </div>
      )}

      {/* Webhook success / failure */}
      {isWebhookNode && (
        <div className={`border-t ${borderColor}`}>
          <div className={`relative flex items-center gap-2 px-3 border-b ${borderColor}`} style={{ minHeight: 30 }}>
            <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
            <span className="text-xs text-emerald-700 flex-1">Success</span>
            <Handle
              type="source"
              position={Position.Right}
              id="success"
              className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-600"
              style={{ right: -6, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
            />
          </div>
          <div className="relative flex items-center gap-2 px-3" style={{ minHeight: 30 }}>
            <XCircle size={11} className="text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-700 flex-1">Failure</span>
            <Handle
              type="source"
              position={Position.Right}
              id="failure"
              className="!w-3 !h-3 !bg-red-500 !border-2 !border-red-600"
              style={{ right: -6, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
            />
          </div>
        </div>
      )}

      {/* Default right source handle for simple nodes */}
      {!isAnswerType && !isDecisionNode && !isWebhookNode && !isOutcome && (
        <div className={`px-3 py-1.5 border-t ${borderColor} ${footerBg} rounded-b-xl flex items-center gap-2 relative`} style={{ minHeight: 28 }}>
          {cfCount > 0 && <span className={`inline-flex items-center gap-0.5 text-[10px] ${subTextColor}`}><Database size={8} />{cfCount}</span>}
          {tagCount > 0 && <span className={`inline-flex items-center gap-0.5 text-[10px] ${subTextColor}`}><Tag size={8} />{tagCount}</span>}
          {scriptCount > 0 && <span className={`inline-flex items-center gap-0.5 text-[10px] ${subTextColor}`}><Code size={8} />{scriptCount}</span>}
          <Handle
            type="source"
            position={Position.Right}
            id="source-right"
            className="!w-3 !h-3 !border-2 !bg-slate-300 !border-slate-400 hover:!bg-blue-400 hover:!border-blue-500 transition-colors"
            style={{ right: -6, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
          />
        </div>
      )}

      {/* Outcome node - no source handle, small footer */}
      {isOutcome && (
        <div className="px-3 py-1.5 bg-blue-700/40 rounded-b-xl border-t border-blue-500/40">
          <span className="text-[10px] text-blue-200">
            {data.config?.qualification_tier ? `Tier: ${data.config.qualification_tier}` : "Outcome"}
          </span>
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute -top-7 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 z-10 pointer-events-none group-hover:pointer-events-auto">
        <button
          onMouseDown={(e) => { e.stopPropagation(); data.onPreview?.(); }}
          className="bg-white border border-slate-200 rounded-md px-1.5 py-1 shadow-sm hover:bg-blue-50 flex items-center gap-1"
          title="Preview"
        >
          <Eye size={11} className="text-blue-500" />
        </button>
        <button
          onMouseDown={(e) => { e.stopPropagation(); data.onEdit?.(); }}
          className="bg-white border border-slate-200 rounded-md px-1.5 py-1 shadow-sm hover:bg-slate-50 flex items-center gap-1"
          title="Edit"
        >
          <Pencil size={11} className="text-slate-600" />
        </button>
        <button
          onMouseDown={(e) => { e.stopPropagation(); data.onDuplicate?.(); }}
          className="bg-white border border-slate-200 rounded-md px-1.5 py-1 shadow-sm hover:bg-slate-50 flex items-center gap-1"
          title="Duplicate"
        >
          <Copy size={11} className="text-slate-600" />
        </button>
        <button
          onMouseDown={(e) => { e.stopPropagation(); data.onDelete?.(); }}
          className="bg-white border border-slate-200 rounded-md px-1.5 py-1 shadow-sm hover:bg-red-50 flex items-center gap-1"
          title="Delete"
        >
          <Trash2 size={11} className="text-red-500" />
        </button>
      </div>
    </div>
  );
});