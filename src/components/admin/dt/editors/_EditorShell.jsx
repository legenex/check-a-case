import React, { useState } from "react";

/**
 * Generic tabbed shell for per-type node editors.
 * Props:
 *   tabs: [{ id, label }]
 *   children: (activeTabId) => ReactNode
 */
export default function EditorShell({ tabs = [], children }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeTab === t.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {children(activeTab)}
      </div>
    </div>
  );
}