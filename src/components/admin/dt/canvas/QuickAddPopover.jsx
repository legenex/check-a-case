import React, { useState, useEffect, useRef } from "react";
import {
  Zap, CircleHelp, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Send, Flag, StickyNote,
  Trophy, Ban, AlertTriangle, Link, Webhook, Search
} from "lucide-react";
import { NODE_REGISTRY, CATEGORY_ORDER, ACCENT_COLORS } from "./nodeRegistry";

const ICON_MAP = {
  Zap, CircleHelp, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Send, Flag, StickyNote,
  Trophy, Ban, AlertTriangle, Link, Webhook,
};

export default function QuickAddPopover({ screenX, screenY, isDark, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = [];
  for (const [key, def] of Object.entries(NODE_REGISTRY)) {
    if (key === "start") continue;
    if (search && !def.label.toLowerCase().includes(search.toLowerCase()) && !def.category.toLowerCase().includes(search.toLowerCase())) continue;
    results.push({ key, def });
    if (results.length >= 10) break;
  }

  const bg = isDark ? "rgba(22,22,28,0.98)" : "rgba(255,255,255,0.98)";
  const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-xl shadow-2xl overflow-hidden"
        style={{
          left: screenX, top: screenY,
          width: 288,
          background: bg,
          backdropFilter: "blur(16px)",
          border: `1px solid ${border}`,
          animation: "ccSlideIn 220ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Add a node..."
              className="w-full h-8 pl-7 pr-3 rounded-lg text-xs outline-none border"
              style={{
                background: "transparent",
                borderColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)",
                color: isDark ? "#e2e8f0" : "#1e293b",
              }}
            />
          </div>
        </div>
        <div className="pb-2 max-h-72 overflow-y-auto">
          {results.map(({ key, def }) => {
            const Icon = ICON_MAP[def.icon] || Flag;
            const color = ACCENT_COLORS[def.accent] || ACCENT_COLORS.zinc;
            return (
              <button
                key={key}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                onClick={() => onSelect(key)}
              >
                <span className="flex items-center justify-center rounded-md flex-shrink-0"
                  style={{ width: 26, height: 26, background: color.bg, color: color.hex }}>
                  <Icon size={13} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{def.label}</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: isDark ? "#475569" : "#94a3b8" }}>{def.category}</div>
                </div>
              </button>
            );
          })}
          {results.length === 0 && (
            <div className="px-4 py-6 text-center text-xs" style={{ color: isDark ? "#475569" : "#94a3b8" }}>No nodes match</div>
          )}
        </div>
      </div>
    </>
  );
}