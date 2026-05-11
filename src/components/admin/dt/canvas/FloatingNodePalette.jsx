import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Search } from "lucide-react";
import { NODE_CATEGORIES } from "./nodeCategories";

export default function FloatingNodePalette({ onDragStart, open, onClose }) {
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-0 bottom-0 z-20 w-72 bg-white border-r border-slate-200 shadow-xl flex flex-col"
      style={{ animation: "slideInLeft 0.15s ease-out" }}
    >
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-700">Add Node</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 transition-colors">
          <X size={14} className="text-slate-500" />
        </button>
      </div>

      {/* Search */}
      <div className="p-2.5 border-b border-slate-100 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {NODE_CATEGORIES.map((cat) => {
          const filtered = cat.types.filter(
            (t) => !search ||
              t.label.toLowerCase().includes(search.toLowerCase()) ||
              t.description.toLowerCase().includes(search.toLowerCase())
          );
          if (filtered.length === 0) return null;
          return (
            <div key={cat.name}>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 mb-1">
                {cat.name}
              </div>
              <div className="space-y-0.5">
                {filtered.map((nt) => (
                  <div
                    key={nt.type}
                    draggable
                    onDragStart={(e) => {
                      onDragStart(e, nt.type);
                      // Don't close palette on drag start, user may want to add more
                    }}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 hover:shadow-sm cursor-grab active:cursor-grabbing border border-transparent hover:border-slate-200 transition-all"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${cat.iconBg || "bg-slate-100"}`}>
                      <nt.Icon size={13} className={cat.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 leading-tight">{nt.label}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 leading-tight">{nt.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}