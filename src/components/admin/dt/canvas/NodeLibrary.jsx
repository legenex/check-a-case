import React, { useState, useCallback } from "react";
import {
  Zap, CircleHelp, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Send, Flag, StickyNote,
  Trophy, Ban, AlertTriangle, Link, Webhook, Search, ChevronLeft, ChevronRight
} from "lucide-react";
import { NODE_REGISTRY, CATEGORY_ORDER, ACCENT_COLORS, RESULT_KINDS } from "./nodeRegistry";

const ICON_MAP = {
  Zap, CircleHelp, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Send, Flag, StickyNote,
  Trophy, Ban, AlertTriangle, Link, Webhook,
};

const DESCRIPTIONS = {
  start: "Entry point of the tree",
  single_choice: "One answer from multiple options",
  multi_choice: "Multiple answers allowed",
  text_input: "Free-text answer",
  number_input: "Numeric slider or range",
  email_input: "Email address field",
  phone_input: "Phone number with verification",
  branch: "Route based on conditions",
  filter: "Pass or fail a condition",
  calc: "Compute a variable value",
  set_var: "Set a variable to a value",
  send_email: "Send an email notification",
  slack: "Post a Slack message",
  webhook: "Call an external API",
  tag: "Add or remove a tag",
  submit: "Submit lead to CRM",
  result: "Terminal outcome node",
  note: "Non-routing comment node",
};

function LibraryItem({ typeKey, def, isDark, collapsed, onDragStart }) {
  const Icon = ICON_MAP[def.icon] || Flag;
  const color = ACCENT_COLORS[def.accent] || ACCENT_COLORS.zinc;
  const desc = DESCRIPTIONS[typeKey] || "";

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/x-node-type", typeKey);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      title={collapsed ? `${def.label} - ${desc}` : desc}
      className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-100 active:scale-[0.985]"
      style={{
        "--hover-bg": isDark ? "rgba(139,92,246,0.06)" : "rgba(139,92,246,0.05)",
        "--hover-border": isDark ? "rgba(139,92,246,0.18)" : "rgba(139,92,246,0.18)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? "rgba(139,92,246,0.06)" : "rgba(139,92,246,0.05)";
        e.currentTarget.style.outline = "1px solid rgba(139,92,246,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "";
        e.currentTarget.style.outline = "";
      }}
    >
      <span className="flex items-center justify-center rounded-md flex-shrink-0"
        style={{ width: 28, height: 28, background: color.bg, color: color.hex }}>
        <Icon size={14} />
      </span>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
            {def.label}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultKindChip({ kindKey, kindDef, isDark, collapsed }) {
  const Icon = ICON_MAP[kindDef.icon] || Flag;
  const color = ACCENT_COLORS[kindDef.accent] || ACCENT_COLORS.zinc;

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/x-node-type", "result");
    e.dataTransfer.setData("application/x-result-kind", kindKey);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      title={kindDef.label}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-all active:scale-[0.985]"
      onMouseEnter={(e) => { e.currentTarget.style.background = color.bg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
    >
      <Icon size={12} style={{ color: color.hex, flexShrink: 0 }} />
      {!collapsed && <span className="text-[10px] font-medium" style={{ color: color.hex }}>{kindDef.label}</span>}
    </div>
  );
}

export default function NodeLibrary({ isDark, collapsed, onToggle }) {
  const [search, setSearch] = useState("");

  const chromeBg = isDark ? "rgba(20,20,24,0.92)" : "rgba(252,251,248,0.92)";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  const categorized = {};
  for (const cat of CATEGORY_ORDER) categorized[cat] = [];
  for (const [key, def] of Object.entries(NODE_REGISTRY)) {
    if (key === "start") continue; // hide start from library
    const q = search.toLowerCase();
    if (q && !def.label.toLowerCase().includes(q) && !def.category.toLowerCase().includes(q)) continue;
    if (categorized[def.category]) categorized[def.category].push({ key, def });
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col h-full relative z-30 transition-all duration-200"
      style={{
        width: collapsed ? 56 : 280,
        background: chromeBg,
        backdropFilter: "blur(14px) saturate(140%)",
        borderRight: `1px solid ${borderColor}`,
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center z-10 border transition-colors"
        style={{ background: chromeBg, borderColor, color: textColor }}
        title={collapsed ? "Expand library" : "Collapse library"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: textColor }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes..."
              className="w-full h-8 pl-7 pr-3 rounded-lg text-xs bg-transparent border outline-none"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)",
                color: isDark ? "#e2e8f0" : "#1e293b",
              }}
            />
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = categorized[cat];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat} className="mb-2">
              {!collapsed && (
                <div className="px-2 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: textColor }}>
                  {cat}
                </div>
              )}
              {items.map(({ key, def }) => {
                if (key === "result" && cat === "Results" && !collapsed) {
                  return (
                    <div key={key}>
                      <LibraryItem typeKey={key} def={def} isDark={isDark} collapsed={collapsed} />
                      <div className="px-2 pb-1 flex flex-wrap gap-1">
                        {Object.entries(RESULT_KINDS).map(([kindKey, kindDef]) => (
                          <ResultKindChip key={kindKey} kindKey={kindKey} kindDef={kindDef} isDark={isDark} collapsed={collapsed} />
                        ))}
                      </div>
                    </div>
                  );
                }
                return <LibraryItem key={key} typeKey={key} def={def} isDark={isDark} collapsed={collapsed} />;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}