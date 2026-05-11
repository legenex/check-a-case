// DesignNode.jsx — Node card that exactly matches the design HTML source
import React, { useState, useRef, useCallback } from "react";
import {
  Zap, HelpCircle, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Flag, StickyNote, FileCheck2,
  Trophy, Ban, AlertTriangle, ExternalLink, Webhook, Trash2, Copy,
  Check, AlertTriangle as WarnIcon,
} from "lucide-react";
import { NODE_TYPES, ACCENT_HEX, RESULT_KINDS, getNodeVisual, getNodeOutputs, designType } from "./nodeTypes";

export const NODE_W = 260;
const ROW_H = 28;
const HEADER_H = 64;

const ICON_MAP = {
  Zap, HelpCircle, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Flag, StickyNote, FileCheck2,
  Trophy, Ban, AlertTriangle, ExternalLink, Webhook,
};

function NodeIcon({ name, size = 18 }) {
  const Icon = ICON_MAP[name] || Flag;
  return <Icon size={size} strokeWidth={1.75} />;
}

function NodeTitle({ title, onChange, className }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);

  const commit = () => {
    setEditing(false);
    if (val !== title) onChange(val);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setEditing(false); setVal(title); }
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-transparent outline-none border-b border-violet-500 text-[13.5px] font-semibold leading-tight"
        style={{ color: "inherit" }}
      />
    );
  }

  return (
    <span
      className={`block truncate cursor-text ${className}`}
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setVal(title); }}
    >
      {title}
    </span>
  );
}

function OutputRow({ label, accentHex, isLight, showLabel, onStart, nodeId, handleId }) {
  return (
    <div className="cc-no-drag relative flex items-center justify-end gap-2 px-3.5 py-1.5 group cursor-crosshair"
         onPointerDown={(e) => { e.stopPropagation(); onStart(e); }}>
      {showLabel && (
        <span className={`text-[11px] font-medium truncate ${isLight ? "text-slate-600 group-hover:text-slate-900" : "text-zinc-400 group-hover:text-zinc-100"}`}
              style={{ maxWidth: 180 }} title={label}>{label}</span>
      )}
      <span className="cc-handle w-3 h-3 rounded-full border-2 absolute right-0 translate-x-1/2"
            style={{ background: accentHex, borderColor: isLight ? "#fff" : "#1c1c22", pointerEvents: "auto", zIndex: 20 }}
            data-handle-output="true"
            data-node-id={nodeId}
            data-handle-id={handleId} />
    </div>
  );
}

function NodeBody({ node, subColor, accentHex, isLight, dt }) {
  const mono = isLight ? "text-slate-500" : "text-zinc-400";
  const className = "cc-canvas-node";

  if (dt === "start") {
    return (
      <p className={`text-[11px] ${mono} line-clamp-2`}>
        {node.title_display || node.label || "Entry point"}
      </p>
    );
  }
  if (dt === "single_choice") {
    const q = node.title_display || node.help_text || "Your question?";
    return <p className={`text-[11px] ${mono} line-clamp-2`}>{q}</p>;
  }
  if (dt === "multi_choice") {
    const q = node.title_display || node.help_text || "Pick any that apply";
    return <p className={`text-[11px] ${mono} line-clamp-2`}>{q}</p>;
  }
  if (dt === "text_input" || dt === "email_input") {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`text-[11px] ${mono} truncate`}>{node.placeholder || node.help_text || "Enter text"}</span>
        {node.config?.variable && (
          <span className="cc-chip" style={{ background: `${accentHex}18`, color: accentHex, border: `1px solid ${accentHex}30` }}>
            {node.config.variable}
          </span>
        )}
      </div>
    );
  }
  if (dt === "number_input") {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`text-[11px] ${mono}`}>{node.config?.min ?? 0} – {node.config?.max ?? 100}</span>
      </div>
    );
  }
  if (dt === "phone_input") {
    return <p className={`text-[11px] ${mono}`}>{node.help_text || "Best phone number"}</p>;
  }
  if (dt === "branch") {
    const branches = (node.config?.branches || []).slice(0, 2);
    return (
      <div className="space-y-0.5">
        {branches.map((b, i) => (
          <p key={i} className={`text-[10px] font-mono ${mono} truncate`}>{b.expr || b.name || `Branch ${i+1}`}</p>
        ))}
      </div>
    );
  }
  if (dt === "filter") {
    return <p className={`text-[10px] font-mono ${mono} truncate`}>{node.config?.expr || "condition"}</p>;
  }
  if (dt === "calc") {
    const t = node.config?.target || "result";
    const x = node.config?.expr || "...";
    return <p className={`text-[10px] font-mono ${mono} truncate`}>{t} = {x}</p>;
  }
  if (dt === "set_var") {
    const t = node.config?.target || "var";
    const v = node.config?.value || "value";
    return <p className={`text-[10px] font-mono ${mono} truncate`}>{t} = "{v}"</p>;
  }
  if (dt === "send_email") {
    return <p className={`text-[11px] ${mono} truncate`}>To {node.config?.to || "{{email}}"}</p>;
  }
  if (dt === "slack") {
    return <p className={`text-[11px] ${mono} truncate`}>{node.config?.channel || "#channel"}</p>;
  }
  if (dt === "webhook") {
    const method = node.config?.method || "POST";
    const url = node.config?.url || "https://...";
    return <p className={`text-[10px] font-mono ${mono} truncate`}>{method} {url}</p>;
  }
  if (dt === "tag") {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {node.config?.tag && (
          <span className="cc-chip" style={{ background: `${accentHex}18`, color: accentHex, border: `1px solid ${accentHex}30` }}>
            #{node.config.tag}
          </span>
        )}
        {node.config?.score !== undefined && (
          <span className="cc-chip" style={{ background: `${accentHex}18`, color: accentHex, border: `1px solid ${accentHex}30` }}>
            +{node.config.score}
          </span>
        )}
      </div>
    );
  }
  if (dt === "submit") {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`text-[11px] ${mono}`}>-&gt; {node.config?.destination || "Lead"}</span>
        {node.config?.trustedform && (
          <span className="cc-chip" style={{ background: `${accentHex}18`, color: accentHex, border: `1px solid ${accentHex}30` }}>TF</span>
        )}
      </div>
    );
  }
  if (dt === "result") {
    const kind = node.config?.result_kind || "qualified";
    const rk = RESULT_KINDS[kind] || RESULT_KINDS.qualified;
    const hex = ACCENT_HEX[rk.accent];
    if (kind === "qualified") {
      return (
        <div className="space-y-0.5">
          {node.config?.buyer && <p className="text-[10px] truncate" style={{ color: hex }}>Buyer: {node.config.buyer}</p>}
          {node.config?.payout !== undefined && <p className="text-[10px]" style={{ color: hex }}>${node.config.payout}</p>}
        </div>
      );
    }
    if (kind === "nurture") {
      return (
        <div className="space-y-0.5">
          {node.config?.reason && <p className="text-[10px] truncate" style={{ color: hex }}>{node.config.reason}</p>}
          {node.config?.campaign && <p className="text-[10px] truncate" style={{ color: hex }}>{node.config.campaign}</p>}
        </div>
      );
    }
    if (kind === "redirect") {
      return <p className="text-[10px] font-mono truncate" style={{ color: hex }}>{node.config?.url || "https://..."}</p>;
    }
    return <p className="text-[11px] font-medium" style={{ color: hex }}>{rk.label}</p>;
  }
  if (dt === "note") {
    return <p className={`text-[11px] ${mono} line-clamp-4 leading-relaxed`}>{node.config?.text || "Note..."}</p>;
  }
  if (node.title_display || node.help_text) {
    return <p className={`text-[11px] ${mono} line-clamp-2`}>{node.title_display || node.help_text}</p>;
  }
  return null;
}

export default function DesignNode({
  node, isLight, selected, testActive, testTraversed,
  validation, scale = 1,
  onSelect, onMove, onStartConnect, onConnectEnd, onTitleChange,
  onDeleteNode, onDuplicateNode,
}) {
  const visual = getNodeVisual(node);
  const dt = visual.dt;
  const accentHex = visual.hex;
  const outs = getNodeOutputs(node);
  const def = NODE_TYPES[dt] || NODE_TYPES.note;

  const [hovered, setHovered] = useState(false);
  const dragState = useRef(null);

  const isOrphan = validation?.orphans?.has(node.id);
  const isDead = validation?.deadEnds?.has(node.id);
  const isStart = dt === "start";
  const isNote = dt === "note";

  const onPointerDown = useCallback((e) => {
    if (e.target.closest("[data-handle]") || e.target.closest("[data-no-drag]")) return;
    e.stopPropagation();
    onSelect(node.id, e.shiftKey);
    dragState.current = {
      startX: e.clientX, startY: e.clientY,
      origX: node.position.x, origY: node.position.y, moved: false,
    };
    const move = (ev) => {
      if (!dragState.current) return;
      const dx = (ev.clientX - dragState.current.startX) / scale;
      const dy = (ev.clientY - dragState.current.startY) / scale;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragState.current.moved = true;
      onMove(node.id, { x: dragState.current.origX + dx, y: dragState.current.origY + dy });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      dragState.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [node.id, node.position.x, node.position.y, scale, onSelect, onMove]);

  const cardBg = isLight ? "#ffffff" : "#1c1c22";
  const cardBorder = selected
    ? accentHex
    : isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.07)";
  const titleColor = isLight ? "#0f172a" : "#fafafa";
  const subColor = isLight ? "#64748b" : "#71717a";
  const secondaryText = isLight ? "#94a3b8" : "#52525b";

  const selectedShadow = selected
    ? `0 0 0 2px ${accentHex}, 0 10px 30px -10px ${accentHex}55`
    : isLight
      ? "0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)"
      : "0 8px 24px -12px rgba(0,0,0,0.6)";

  // Result gradient background class
  const resultKind = node.config?.result_kind;
  let gradBg = null;
  if (dt === "result" && resultKind) {
    const gradMap = {
      qualified: "rgba(16,185,129,0.06)",
      disqualified: "rgba(244,63,94,0.06)",
      nurture: "rgba(245,158,11,0.06)",
      redirect: "rgba(217,70,239,0.06)",
      transfer: "rgba(99,102,241,0.06)",
    };
    gradBg = gradMap[resultKind] || null;
  }

  const singleOutputNoLabel = outs.length === 1 && outs[0].label === "";

  return (
    <div
      className="cc-canvas-node absolute select-none"
      style={{ width: NODE_W, left: node.position.x, top: node.position.y, willChange: "transform" }}
      onPointerDown={onPointerDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pulse ring for test-active */}
      {testActive && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: "0 0 0 2px rgba(16,185,129,0.95), 0 0 28px rgba(16,185,129,0.45)",
            animation: "ccPulse 1.8s ease-in-out infinite",
            zIndex: 2,
          }}
        />
      )}

      {/* Card */}
      <div
        className="rounded-xl overflow-visible"
        style={{
          background: gradBg
            ? `linear-gradient(180deg, ${gradBg}, transparent 60%), ${cardBg}`
            : cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: selectedShadow,
        }}
      >
        {/* Hover action buttons */}
        {(hovered || selected) && !isStart && (
          <div
            data-no-drag
            className="absolute -top-3 right-2 flex items-center gap-0 rounded-lg overflow-hidden border shadow-lg z-10"
            style={{
              background: isLight ? "#fff" : "#1c1c22",
              borderColor: isLight ? "#e2e8f0" : "rgba(255,255,255,0.08)",
            }}
          >
            <button
              title="Duplicate"
              onClick={(e) => { e.stopPropagation(); onDuplicateNode?.(node.id); }}
              className="w-7 h-7 flex items-center justify-center transition-colors"
              style={{ color: isLight ? "#64748b" : "#a1a1aa" }}
              onMouseEnter={(e) => e.currentTarget.style.background = isLight ? "#f1f5f9" : "rgba(255,255,255,0.06)"}
              onMouseLeave={(e) => e.currentTarget.style.background = ""}
            >
              <Copy size={13} strokeWidth={1.75} />
            </button>
            <button
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDeleteNode?.(node.id); }}
              className="w-7 h-7 flex items-center justify-center transition-colors"
              style={{ color: "#f43f5e" }}
              onMouseEnter={(e) => e.currentTarget.style.background = isLight ? "#fff1f2" : "rgba(244,63,94,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = ""}
            >
              <Trash2 size={13} strokeWidth={1.75} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 px-3.5 pt-3.5 pb-2" style={{ cursor: "grab" }}>
          {/* Accent icon tile */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accentHex}, ${accentHex}cc)`,
              boxShadow: `0 4px 12px -4px ${accentHex}80`,
              color: "#fff",
            }}
          >
            <NodeIcon name={visual.icon} size={18} />
          </div>

          <div className="flex-1 min-w-0">
            <NodeTitle
              title={node.label || def.label}
              onChange={(v) => onTitleChange?.(node.id, v)}
              className="text-[13.5px] font-semibold leading-tight"
            />
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.08em] font-medium" style={{ color: accentHex }}>
                {visual.label.toUpperCase()}
              </span>
              <span className="text-[10px]" style={{ color: secondaryText }}>·</span>
              <span className="text-[9.5px] font-mono" style={{ color: secondaryText }}>
                {node.id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Validation warning */}
          {(isOrphan || isDead) && (
            <span
              title={isOrphan ? "No inbound" : "No outbound"}
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
            >
              <AlertTriangle size={11} strokeWidth={1.75} />
            </span>
          )}
          {testTraversed && (
            <span
              title="Traversed"
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
            >
              <Check size={11} strokeWidth={1.75} />
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-3.5 pb-2.5 min-h-[28px]">
          <NodeBody
            node={node}
            subColor={subColor}
            accentHex={accentHex}
            isLight={isLight}
            dt={dt}
          />
        </div>

        {/* Input handle — left edge, centered */}
        {!isStart && !isNote && (
          <div
            className="cc-handle absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2"
            style={{ background: isLight ? "#fff" : "#1c1c22", borderColor: accentHex, pointerEvents: "auto", zIndex: 20 }}
            data-handle-input="true"
            data-node-id={node.id}
          />
        )}

        {/* Output rows (multi-output) */}
        {outs.length > 1 && (
          <div style={{ borderTop: `1px solid ${isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.05)"}` }}>
            {outs.map((o) => (
              <OutputRow
                key={o.id}
                label={o.label}
                accentHex={accentHex}
                isLight={isLight}
                showLabel
                nodeId={node.id}
                handleId={o.id}
                onStart={(e) => onStartConnect(e, node.id, o.id, accentHex)}
              />
            ))}
          </div>
        )}

        {/* Single-output handle — right edge centered (no label row) */}
        {singleOutputNoLabel && (
          <div
            className="cc-handle absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
            style={{ background: accentHex, borderColor: isLight ? "#fff" : "#1c1c22", pointerEvents: "auto", zIndex: 20 }}
            data-handle-output="true"
            data-node-id={node.id}
            data-handle-id={outs[0].id}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStartConnect(e, node.id, outs[0].id, accentHex);
            }}
          />
        )}

        {/* Single-output WITH label — show as a row */}
        {outs.length === 1 && outs[0].label !== "" && (
          <div style={{ borderTop: `1px solid ${isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.05)"}` }}>
            <OutputRow
              label={outs[0].label}
              accentHex={accentHex}
              isLight={isLight}
              showLabel
              nodeId={node.id}
              handleId={outs[0].id}
              onStart={(e) => onStartConnect(e, node.id, outs[0].id, accentHex)}
            />
          </div>
        )}
      </div>
    </div>
  );
}