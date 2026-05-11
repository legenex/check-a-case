// DesignMinimap.jsx — bottom-right 220x140 minimap
import React from "react";
import { getNodeVisual } from "./nodeTypes";
import { NODE_W } from "./DesignNode";
import { ACCENT_HEX } from "./nodeTypes";

const MM_W = 220;
const MM_H = 140;
const PAD = 12;

export default function DesignMinimap({ nodes, viewport, canvasW, canvasH, isLight, onRecenter }) {
  if (nodes.length === 0) return null;

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const worldW = (Math.max(...xs) + NODE_W - minX) || 1;
  const worldH = (Math.max(...ys) + 100 - minY) || 1;

  const scaleX = (MM_W - PAD * 2) / worldW;
  const scaleY = (MM_H - PAD * 2) / worldH;
  const scale = Math.min(scaleX, scaleY, 0.3);

  const toMM = (wx, wy) => ({
    x: PAD + (wx - minX) * scale,
    y: PAD + (wy - minY) * scale,
  });

  // Viewport rect in world coords
  const vpMinX = -viewport.x / viewport.zoom;
  const vpMinY = -viewport.y / viewport.zoom;
  const vpW = canvasW / viewport.zoom;
  const vpH = canvasH / viewport.zoom;
  const vp = toMM(vpMinX, vpMinY);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = minX + (mx - PAD) / scale;
    const wy = minY + (my - PAD) / scale;
    onRecenter(wx, wy);
  };

  const chromeBg = isLight ? "rgba(252,251,248,0.92)" : "rgba(20,20,24,0.92)";
  const borderC = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)";

  return (
    <div
      className="absolute bottom-16 right-4 rounded-xl overflow-hidden z-20"
      style={{
        width: MM_W, height: MM_H,
        background: chromeBg,
        backdropFilter: "blur(14px) saturate(140%)",
        border: `1px solid ${borderC}`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        cursor: "crosshair",
      }}
      onClick={handleClick}
    >
      <svg width={MM_W} height={MM_H} className="pointer-events-none">
        {nodes.map((n) => {
          const p = toMM(n.position.x, n.position.y);
          const visual = getNodeVisual(n);
          const hex = ACCENT_HEX[visual.accent] || "#64748b";
          return (
            <rect
              key={n.id}
              x={p.x} y={p.y}
              width={Math.max(NODE_W * scale, 6)}
              height={Math.max(8 * scale, 3)}
              rx={2} fill={hex} opacity={0.7}
            />
          );
        })}
        {/* Viewport rect */}
        <rect
          x={vp.x} y={vp.y}
          width={Math.max(vpW * scale, 8)}
          height={Math.max(vpH * scale, 8)}
          fill="none"
          stroke={isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)"}
          strokeWidth={1}
          rx={2}
        />
      </svg>
    </div>
  );
}