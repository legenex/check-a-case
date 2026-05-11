import React from "react";
import { NODE_W } from "./CanvasNode";

const MM_W = 200;
const MM_H = 140;

export default function CanvasMinimap({ nodes, viewport, canvasW, canvasH, isDark, onRecenter }) {
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const pad = 16;
    const xs2 = nodes.map((n) => n.position.x);
    const ys2 = nodes.map((n) => n.position.y);
    const minX2 = Math.min(...xs2);
    const minY2 = Math.min(...ys2);
    const worldW2 = (Math.max(...xs2) + NODE_W - minX2) || 1;
    const worldH2 = (Math.max(...ys2) + 90 - minY2) || 1;
    const scaleX2 = (MM_W - pad * 2) / worldW2;
    const scaleY2 = (MM_H - pad * 2) / worldH2;
    const scale2 = Math.min(scaleX2, scaleY2, 0.3);
    const wx = minX2 + (mx - pad) / scale2;
    const wy = minY2 + (my - pad) / scale2;
    onRecenter(wx, wy);
  };

  if (nodes.length === 0) return null;

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs) + NODE_W;
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys) + 90;

  const worldW = maxX - minX || 1;
  const worldH = maxY - minY || 1;
  const pad = 16;
  const scaleX = (MM_W - pad * 2) / worldW;
  const scaleY = (MM_H - pad * 2) / worldH;
  const scale = Math.min(scaleX, scaleY, 0.3);

  const toMM = (wx, wy) => ({
    x: pad + (wx - minX) * scale,
    y: pad + (wy - minY) * scale,
  });

  // Viewport rect in world coords
  const vpLeft = -viewport.x / viewport.zoom;
  const vpTop = -viewport.y / viewport.zoom;
  const vpW = canvasW / viewport.zoom;
  const vpH = canvasH / viewport.zoom;
  const vpMM = toMM(vpLeft, vpTop);
  const vpMM_W = vpW * scale;
  const vpMM_H = vpH * scale;



  return (
    <div
      className="absolute bottom-16 right-4 rounded-xl overflow-hidden cursor-pointer z-20"
      style={{
        width: MM_W, height: MM_H,
        background: isDark ? "rgba(20,20,24,0.88)" : "rgba(252,251,248,0.92)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
      onClick={handleClick}
    >
      <svg width={MM_W} height={MM_H}>
        {nodes.map((n) => {
          const pos = toMM(n.position.x, n.position.y);
          return (
            <rect
              key={n.id}
              x={pos.x} y={pos.y}
              width={Math.max(NODE_W * scale, 8)}
              height={Math.max(90 * scale, 4)}
              rx={2}
              fill={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
            />
          );
        })}
        {/* Viewport rect */}
        <rect
          x={vpMM.x} y={vpMM.y}
          width={Math.max(vpMM_W, 10)}
          height={Math.max(vpMM_H, 8)}
          rx={2}
          fill="rgba(139,92,246,0.12)"
          stroke="#8b5cf6"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}