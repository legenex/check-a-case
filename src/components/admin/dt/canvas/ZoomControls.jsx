import React from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";

export default function ZoomControls({ zoom, onZoomIn, onZoomOut, onFitView, isDark }) {
  // zoom, onZoomIn, onZoomOut, onFitView all provided by parent
  const bg = isDark ? "rgba(20,20,24,0.92)" : "rgba(252,251,248,0.92)";
  const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  const btn = "w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-violet-500/10";

  return (
    <div
      className="absolute bottom-4 left-4 flex items-center rounded-xl overflow-hidden z-20"
      style={{
        background: bg,
        backdropFilter: "blur(10px)",
        border: `1px solid ${border}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}
    >
      <button className={btn} onClick={onZoomOut} style={{ color: textColor }} title="Zoom out">
        <Minus size={13} />
      </button>
      <span className="px-2 text-[11px] font-mono select-none" style={{ color: textColor, minWidth: 38, textAlign: "center" }}>
        {Math.round(zoom * 100)}%
      </span>
      <button className={btn} onClick={onZoomIn} style={{ color: textColor }} title="Zoom in">
        <Plus size={13} />
      </button>
      <div style={{ width: 1, height: 16, background: border, margin: "0 2px" }} />
      <button className={btn} onClick={onFitView} style={{ color: textColor }} title="Fit to view">
        <Maximize2 size={12} />
      </button>
    </div>
  );
}