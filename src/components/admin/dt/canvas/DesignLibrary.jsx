// DesignLibrary.jsx — left panel, 280px expanded / 56px collapsed
import React, { useState } from "react";
import {
  Zap, HelpCircle, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Flag, StickyNote, FileCheck2,
  Trophy, Ban, AlertTriangle, ExternalLink, Webhook, Search,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { NODE_TYPES, ACCENT_HEX, CATEGORIES, RESULT_KINDS } from "./nodeTypes";

const ICON_MAP = {
  Zap, HelpCircle, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Flag, StickyNote, FileCheck2,
  Trophy, Ban, AlertTriangle, ExternalLink, Webhook,
};

function LibItem({ typeKey, def, collapsed }) {
  const Icon = ICON_MAP[def.icon] || Flag;
  const hex = ACCENT_HEX[def.accent] || "#64748b";

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/x-node-type", typeKey);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      title={collapsed ? def.label : def.description}
      className="cc-lib-item flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-grab active:cursor-grabbing"
    >
      <span className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ width: 30, height: 30, background: `${hex}1a`, color: hex }}>
        <Icon size={15} strokeWidth={1.75} />
      </span>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium truncate">{def.label}</div>
        </div>
      )}
    </div>
  );
}

function ResultKindChip({ kindKey, kindDef, collapsed }) {
  const Icon = ICON_MAP[kindDef.icon] || Flag;
  const hex = ACCENT_HEX[kindDef.accent] || "#64748b";

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
      className="cc-lib-item flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing"
    >
      <Icon size={12} strokeWidth={1.75} style={{ color: hex, flexShrink: 0 }} />
      {!collapsed && (
        <span className="text-[10.5px] font-medium" style={{ color: hex }}>{kindDef.label}</span>
      )}
    </div>
  );
}

export default function DesignLibrary({ isLight, collapsed, onToggle }) {
  const [search, setSearch] = useState("");

  const chromeBg = isLight ? "rgba(252,251,248,0.92)" : "rgba(20,20,24,0.92)";
  const borderC = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)";
  const textS = isLight ? "#64748b" : "#94a3b8";
  const textP = isLight ? "#0f172a" : "#e2e8f0";

  const byCategory = {};
  for (const cat of CATEGORIES) byCategory[cat] = [];
  for (const [key, def] of Object.entries(NODE_TYPES)) {
    if (key === "start") continue;
    if (search) {
      const q = search.toLowerCase();
      if (!def.label.toLowerCase().includes(q) && !def.category.toLowerCase().includes(q)) continue;
    }
    if (byCategory[def.category]) byCategory[def.category].push({ key, def });
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col h-full relative z-30 transition-all duration-200"
      style={{
        width: collapsed ? 56 : 280,
        background: chromeBg,
        backdropFilter: "blur(14px) saturate(140%)",
        borderRight: `1px solid ${borderC}`,
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center z-10 border transition-colors"
        style={{ background: chromeBg, borderColor: borderC, color: textS }}
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <ChevronRight size={11} strokeWidth={1.75} /> : <ChevronLeft size={11} strokeWidth={1.75} />}
      </button>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
            style={{ borderColor: borderC, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}>
            <Search size={12} strokeWidth={1.75} style={{ color: textS }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes..."
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: textP }}
            />
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-4 scroll-thin">
        {CATEGORIES.map((cat) => {
          const items = byCategory[cat];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat} className="mb-2">
              {!collapsed && (
                <div className="px-2 pt-2.5 pb-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: textS }}>
                  {cat}
                </div>
              )}
              {items.map(({ key, def }) => {
                if (key === "result" && !collapsed) {
                  return (
                    <div key={key}>
                      <LibItem typeKey={key} def={def} collapsed={collapsed} />
                      <div className="px-2 pb-1 flex flex-wrap gap-1">
                        {Object.entries(RESULT_KINDS).map(([kk, kd]) => (
                          <ResultKindChip key={kk} kindKey={kk} kindDef={kd} collapsed={collapsed} />
                        ))}
                      </div>
                    </div>
                  );
                }
                return <LibItem key={key} typeKey={key} def={def} collapsed={collapsed} />;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}