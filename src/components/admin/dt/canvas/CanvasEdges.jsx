import React from "react";
import { ACCENT_COLORS, getNodeVisual, getNodeOutputs } from "./nodeRegistry";
import { NODE_W } from "./CanvasNode";

const NODE_H_BASE = 90; // approximate header + body
const OUTPUT_TOP_PAD = 4;
const OUTPUT_BOTTOM_PAD = 4;

function getOutputY(node, handleId) {
  const outputs = getNodeOutputs(node);
  const idx = outputs.findIndex((o) => o.id === handleId);
  const total = outputs.length;
  if (total === 0) return 45;
  const usableHeight = NODE_H_BASE - OUTPUT_TOP_PAD - OUTPUT_BOTTOM_PAD;
  const step = usableHeight / Math.max(total, 1);
  return OUTPUT_TOP_PAD + step * idx + step / 2;
}

function getInputY() {
  return NODE_H_BASE / 2;
}

export default function CanvasEdges({
  edges, nodes, selectedEdgeId, hoverEdgeId,
  onEdgeClick, onEdgeDelete, isDark, viewport,
  ghostEdge,
}) {
  const nodeMap = {};
  for (const n of nodes) nodeMap[n.id] = n;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width: "100%", height: "100%", zIndex: 1 }}
    >
      <defs>
        <style>{`
          @keyframes ccFlow {
            from { stroke-dashoffset: -24; }
            to { stroke-dashoffset: 0; }
          }
          .cc-edge-animated { stroke-dasharray: 8 6; animation: ccFlow 0.9s linear infinite; }
        `}</style>
      </defs>
      <g>
        {edges.map((edge) => {
          const src = nodeMap[edge.source];
          const tgt = nodeMap[edge.target];
          if (!src || !tgt) return null;

          const sx = src.position.x + NODE_W + 6;
          const sy = src.position.y + getOutputY(src, edge.sourceHandle || "next");
          const tx = tgt.position.x - 6;
          const ty = tgt.position.y + getInputY();

          const dx = tx - sx;
          const cp1x = sx + Math.max(dx * 0.5, 40);
          const cp2x = tx - Math.max(dx * 0.5, 40);
          const d = `M ${sx} ${sy} C ${cp1x} ${sy}, ${cp2x} ${ty}, ${tx} ${ty}`;

          const { accent } = getNodeVisual(src);
          const accentHex = ACCENT_COLORS[accent]?.hex || "#8b5cf6";
          const isSelected = selectedEdgeId === edge.id;
          const isHover = hoverEdgeId === edge.id;

          const midX = (sx + tx) / 2;
          const midY = (sy + ty) / 2;

          return (
            <g key={edge.id}>
              {/* Hit area */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                className="pointer-events-auto cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onEdgeClick(edge.id); }}
              />
              {/* Visible stroke */}
              <path
                d={d}
                fill="none"
                stroke={accentHex}
                strokeOpacity={isSelected ? 1 : isHover ? 0.9 : 0.6}
                strokeWidth={isSelected ? 3 : isHover ? 2.5 : 2}
                strokeLinecap="round"
                className={isHover ? "cc-edge-animated" : ""}
              />
              {/* Edge label */}
              {edge.label && (
                <text
                  x={midX}
                  y={midY - 6}
                  textAnchor="middle"
                  fill={isDark ? "#94a3b8" : "#64748b"}
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                >
                  {edge.label}
                </text>
              )}
              {/* Delete button when selected */}
              {isSelected && (
                <g transform={`translate(${midX - 9}, ${midY - 9})`} className="pointer-events-auto">
                  <circle cx={9} cy={9} r={9} fill={isDark ? "#1c1c22" : "#fff"} stroke="#f43f5e" strokeWidth={1.5} />
                  <line x1={5} y1={5} x2={13} y2={13} stroke="#f43f5e" strokeWidth={1.5} strokeLinecap="round" />
                  <line x1={13} y1={5} x2={5} y2={13} stroke="#f43f5e" strokeWidth={1.5} strokeLinecap="round" />
                  <rect width={18} height={18} fill="transparent"
                    onClick={(e) => { e.stopPropagation(); onEdgeDelete(edge.id); }} />
                </g>
              )}
            </g>
          );
        })}

        {/* Ghost edge (in-flight connect) */}
        {ghostEdge && (
          <path
            d={(() => {
              const { sx, sy, ex, ey } = ghostEdge;
              const dx = ex - sx;
              const cp1x = sx + Math.max(dx * 0.5, 40);
              const cp2x = ex - Math.max(dx * 0.5, 40);
              return `M ${sx} ${sy} C ${cp1x} ${sy}, ${cp2x} ${ey}, ${ex} ${ey}`;
            })()}
            fill="none"
            stroke="#8b5cf6"
            strokeOpacity={0.5}
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  );
}