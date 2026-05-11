// DesignQuickAdd.jsx — popover after dragging to empty canvas
import React, { useState, useEffect, useRef } from "react";
import {
  Zap, HelpCircle, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Flag, StickyNote, FileCheck2,
  Trophy, Ban, AlertTriangle, ExternalLink, Webhook, Search,
} from "lucide-react";
import { NODE_TYPES, ACCENT_HEX, CATEGORIES } from "./nodeTypes";

const ICON_MAP = {
  Zap, HelpCircle, CheckSquare, Type, Hash, Mail, Phone, GitBranch,
  Calculator, Variable, MessageSquare, Tag, Flag, StickyNote, FileCheck2,
  Trophy, Ban, AlertTriangle, ExternalLink, Webhook,
};

export default function DesignQuickAdd({ screenX, screenY, isLight, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("pointerdown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("pointerdown", handler);
    };
  }, [onClose]);

  const filtered = Object.entries(NODE_TYPES)
    .filter(([k]) => k !== "start")
    .filter(([k, v]) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return v.label.toLowerCase().includes(q) || v.category.toLowerCase().includes(q);
    })
    .slice(0, 10);

  const chromeBg = isLight ? "rgba(252,251,248,0.97)" : "rgba(20,20,24,0.97)";
  const borderC = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)";
  const textP = isLight ? "#0f172a" : "#f1f5f9";
  const textS = isLight ? "#64748b" : "#94a3b8";

  // Position so popover stays in viewport
  const left = Math.min(screenX, (wrapW() || 600) - 298);
  const top = Math.min(screenY, (wrapH() || 500) - 320);

  return (
    <div
      ref={ref}
      className="absolute z-50 rounded-xl overflow-hidden shadow-2xl"
      style={{
        left, top, width: 288,
        background: chromeBg,
        backdropFilter: "blur(16px) saturate(150%)",
        border: `1px solid ${borderC}`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
          style={{ borderColor: borderC, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}>
          <Search size={12} strokeWidth={1.75} style={{ color: textS }} />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: textP }}
          />
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto px-1.5 pb-2 scroll-thin">
        {filtered.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: textS }}>No results</p>
        )}
        {filtered.map(([key, def]) => {
          const Icon = ICON_MAP[def.icon] || Flag;
          const hex = ACCENT_HEX[def.accent] || "#64748b";
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(139,92,246,0.07)"}
              onMouseLeave={(e) => e.currentTarget.style.background = ""}
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${hex}20`, color: hex }}>
                <Icon size={14} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: textP }}>{def.label}</div>
                <div className="text-[10px] truncate" style={{ color: textS }}>{def.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function wrapW() { return window.innerWidth; }
function wrapH() { return window.innerHeight; }