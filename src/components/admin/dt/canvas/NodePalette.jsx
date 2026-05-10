import React, { useState } from "react";
import { NODE_CATEGORIES } from "./nodeCategories";

export default function NodePalette({ onDragStart }) {
  const [search, setSearch] = useState("");

  return (
    <aside className="w-60 border-r bg-slate-50 flex flex-col flex-shrink-0">
      <div className="p-3 border-b bg-white">
        <input
          type="text"
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {NODE_CATEGORIES.map((cat) => {
          const filtered = cat.types.filter(
            (t) =>
              !search ||
              t.label.toLowerCase().includes(search.toLowerCase()) ||
              t.description.toLowerCase().includes(search.toLowerCase())
          );
          if (filtered.length === 0) return null;
          return (
            <div key={cat.name}>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold px-2 mb-1">
                {cat.name}
              </div>
              <div className="space-y-0.5">
                {filtered.map((nt) => (
                  <div
                    key={nt.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, nt.type)}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-white hover:shadow-sm cursor-grab active:cursor-grabbing border border-transparent hover:border-slate-200 transition-all"
                  >
                    <nt.Icon size={15} className={cat.iconColor + " flex-shrink-0 mt-0.5"} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 leading-tight">{nt.label}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 leading-tight">{nt.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}