import React, { useState, useCallback } from "react";
import {
  Zap, CircleHelp, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Send, Flag, StickyNote,
  Trash2, Copy, Trophy, Ban, AlertTriangle, Link, Webhook
} from "lucide-react";
import { ACCENT_COLORS, RESULT_KINDS, getNodeVisual, getNodeOutputs, designType } from "./nodeRegistry";

const NODE_W = 280;

const ICON_MAP = {
  Zap, CircleHelp, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Send, Flag, StickyNote,
  Trophy, Ban, AlertTriangle, Link, Webhook,
};

function AccentIcon({ iconName, accent, size = 16 }) {
  const Icon = ICON_MAP[iconName] || Flag;
  const color = ACCENT_COLORS[accent] || ACCENT_COLORS.zinc;
  return (
    <span
      className="flex items-center justify-center rounded-md flex-shrink-0"
      style={{ width: 28, height: 28, background: color.bg, color: color.hex }}
    >
      <Icon size={size} />
    </span>
  );
}

export default function CanvasNode({
  node, isDark, isSelected, isTestActive, isTestTraversed,
  onDragStart, onSelect, onDelete, onDuplicate,
  onConnectStart, onConnectEnd,
  onTitleCommit,
}) {
  const { accent, iconName, label: kindLabel, gradBg } = getNodeVisual(node);
  const outputs = getNodeOutputs(node);
  const dt = designType(node);
  const isStart = dt === "start";
  const accentColor = ACCENT_COLORS[accent] || ACCENT_COLORS.zinc;

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(node.label || kindLabel);
  const [hovered, setHovered] = useState(false);

  const commitTitle = useCallback(() => {
    setEditingTitle(false);
    if (titleVal !== node.label) onTitleCommit?.(node.id, titleVal);
  }, [titleVal, node.label, node.id, onTitleCommit]);

  const cancelTitle = useCallback(() => {
    setEditingTitle(false);
    setTitleVal(node.label || kindLabel);
  }, [node.label, kindLabel]);

  const onHeaderPointerDown = useCallback((e) => {
    if (editingTitle) return;
    if (e.target.closest("[data-handle]")) return;
    if (e.target.closest("[data-action]")) return;
    e.stopPropagation();
    onDragStart(e, node.id);
  }, [editingTitle, onDragStart, node.id]);

  const onOutputPointerDown = useCallback((e, handleId) => {
    e.stopPropagation();
    e.preventDefault();
    onConnectStart(e, node.id, handleId);
  }, [onConnectStart, node.id]);

  const onInputPointerUp = useCallback((e) => {
    e.stopPropagation();
    onConnectEnd(e, node.id, "in");
  }, [onConnectEnd, node.id]);

  const borderColor = isSelected ? accentColor.hex : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)";

  let cardBg = isDark ? "rgba(28,28,34,0.97)" : "rgba(255,255,255,0.97)";
  if (isTestTraversed) cardBg = isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)";

  const displayBody = (() => {
    if (dt === "single_choice" || dt === "multi_choice") {
      const opts = (node.answer_options || []).slice(0, 3);
      return (
        <div className="flex flex-wrap gap-1 pt-1">
          {opts.map((o, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{ borderColor: accentColor.hex + "55", color: accentColor.hex, background: accentColor.bg }}>
              {o.label || "Option"}
            </span>
          ))}
          {(node.answer_options || []).length > 3 && (
            <span className="text-[10px] text-slate-400">+{(node.answer_options || []).length - 3} more</span>
          )}
        </div>
      );
    }
    if (dt === "branch") {
      const branches = (node.config?.branches || []).slice(0, 3);
      return (
        <div className="space-y-0.5 pt-1">
          {branches.map((b, i) => (
            <div key={i} className="text-[10px] text-slate-400 truncate">{b.name || `Branch ${i + 1}`}</div>
          ))}
        </div>
      );
    }
    if (dt === "result") {
      const rk = RESULT_KINDS[node.config?.result_kind] || RESULT_KINDS.qualified;
      return <div className="text-[10px] pt-1" style={{ color: ACCENT_COLORS[rk.accent]?.hex }}>{rk.label}</div>;
    }
    if (dt === "note") {
      return <div className="text-[10px] text-slate-400 leading-relaxed pt-1 line-clamp-2">{node.config?.text || "Note..."}</div>;
    }
    if (node.title_display || node.help_text) {
      return <div className="text-[10px] text-slate-400 truncate pt-1">{node.title_display || node.help_text}</div>;
    }
    return null;
  })();

  return (
    <div
      className="absolute select-none"
      style={{ width: NODE_W, left: node.position.x, top: node.position.y, willChange: "transform" }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id, e.shiftKey); }}
    >
      {isTestActive && (
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: "0 0 0 3px #10b981, 0 0 16px rgba(16,185,129,0.4)", animation: "ccPulse 1.8s ease-in-out infinite", zIndex: 2 }} />
      )}

      <div
        className="rounded-xl overflow-visible"
        style={{
          background: gradBg
            ? `linear-gradient(180deg, ${gradBg} 0%, transparent 60%), ${cardBg}`
            : cardBg,
          border: `1px solid ${borderColor}`,
          outline: isSelected ? `2px solid ${accentColor.ring}` : "none",
          outlineOffset: 2,
          boxShadow: isSelected
            ? `0 0 0 2px ${accentColor.ring}, 0 4px 24px rgba(0,0,0,0.18)`
            : isDark ? "0 2px 12px rgba(0,0,0,0.35)" : "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Input handle */}
        {!isStart && dt !== "note" && (
          <div
            data-handle="input"
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 cursor-crosshair"
            style={{ background: isDark ? "#1e293b" : "#e2e8f0", borderColor: "#64748b", zIndex: 3 }}
            onPointerUp={onInputPointerUp}
          />
        )}

        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing"
          style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}
          onPointerDown={onHeaderPointerDown}
        >
          <AccentIcon iconName={iconName} accent={accent} />
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                autoFocus
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") cancelTitle(); }}
                className="w-full bg-transparent outline-none text-sm font-medium border-b border-violet-500"
                style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="block text-sm font-medium truncate cursor-text"
                style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
                onClick={(e) => { e.stopPropagation(); setEditingTitle(true); setTitleVal(node.label || kindLabel); }}
              >
                {node.label || kindLabel}
              </span>
            )}
          </div>

          {hovered && !editingTitle && (
            <div className="flex items-center gap-1 flex-shrink-0" data-action>
              <button
                data-action
                onClick={(e) => { e.stopPropagation(); onDuplicate(node.id); }}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
                title="Duplicate"
              >
                <Copy size={11} color="#94a3b8" />
              </button>
              <button
                data-action
                onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
                title="Delete"
              >
                <Trash2 size={11} color="#f43f5e" />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-3 py-2 min-h-[32px]">
          {displayBody}
        </div>

        {/* Output handles */}
        {outputs.length > 0 && (
          <div
            className="absolute top-0 h-full flex flex-col"
            style={{ right: -28, justifyContent: "space-around", paddingTop: 4, paddingBottom: 4 }}
          >
            {outputs.map((out) => (
              <div key={out.id} className="flex items-center gap-1" style={{ marginBottom: 2 }}>
                <span className="text-[9px] font-medium" style={{ color: isDark ? "#94a3b8" : "#64748b", whiteSpace: "nowrap" }}>
                  {out.label}
                </span>
                <div
                  data-handle="output"
                  data-handle-id={out.id}
                  data-node-id={node.id}
                  className="w-3 h-3 rounded-full border-2 cursor-crosshair flex-shrink-0"
                  style={{
                    background: accentColor.hex,
                    borderColor: isDark ? "#1c1c22" : "#fff",
                    boxShadow: `0 0 0 1px ${accentColor.hex}`,
                  }}
                  onPointerDown={(e) => onOutputPointerDown(e, out.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { NODE_W };