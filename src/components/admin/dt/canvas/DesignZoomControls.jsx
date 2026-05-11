// DesignZoomControls.jsx
import React from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export default function DesignZoomControls({ zoom, isLight, onZoomIn, onZoomOut, onFitView }) {
  const chromeBg = isLight ? "rgba(252,251,248,0.92)" : "rgba(20,20,24,0.92)";
  const borderC = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)";
  const textC = isLight ? "#64748b" : "#94a3b8";

  const btn = (onClick, children, title) => (
    <button
      title={title}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center transition-colors rounded"
      style={{ color: textC }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(139,92,246,0.1)"}
      onMouseLeave={(e) => e.currentTarget.style.background = ""}
    >
      {children}
    </button>
  );

  return (
    <div
      className="absolute bottom-4 right-4 flex items-center gap-0.5 rounded-xl px-1 z-20"
      style={{
        background: chromeBg,
        backdropFilter: "blur(14px) saturate(140%)",
        border: `1px solid ${borderC}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      {btn(onZoomOut, <ZoomOut size={14} strokeWidth={1.75} />, "Zoom out")}
      <span className="text-[10px] font-mono tabular-nums px-1" style={{ color: textC }}>
        {Math.round(zoom * 100)}%
      </span>
      {btn(onZoomIn, <ZoomIn size={14} strokeWidth={1.75} />, "Zoom in")}
      <div style={{ width: 1, height: 14, background: borderC, margin: "0 2px" }} />
      {btn(onFitView, <Maximize2 size={13} strokeWidth={1.75} />, "Fit view")}
    </div>
  );
}