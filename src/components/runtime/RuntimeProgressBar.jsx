import React from "react";

export default function RuntimeProgressBar({ ratio }) {
  const pct = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  return (
    <div className="w-full h-1.5 bg-slate-100">
      <div
        className="h-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: 'var(--rt-primary, #0284c7)' }}
      />
    </div>
  );
}