// DesignEdges.jsx — SVG edge layer matching design source exactly
import React, { useMemo } from "react";
import { ACCENT_HEX, getNodeVisual, getNodeOutputs } from "./nodeTypes";
import { NODE_W } from "./DesignNode";

const HEADER_H = 64;
const ROW_H = 28;

function estimateBodyH(node) {
  const dt = node.config?.kind || node.node_type;
  if (node.node_type === "start_page") return 36;
  if (node.node_type === "single_select" || node.node_type === "checkbox_multi_select") return 36;
  if (node.node_type === "text_field" || node.node_type === "slider" || node.node_type === "phone_verification") return 32;
  if (node.node_type === "decision_node") return 36;
  if (node.node_type === "custom_page") return 28;
  if (node.node_type === "notification_email" || node.node_type === "webhook_api") return 28;
  if (node.node_type === "results_page") return 44;
  if (node.node_type === "form") return 32;
  if (node.node_type === "text_block") return 56;
  return 28;
}

function estimateNodeHeight(n) {
  const outs = getNodeOutputs(n);
  const body = estimateBodyH(n);
  const hasRows = outs.length > 1 || (outs.length === 1 && outs[0].label !== "");
  const outputsH = hasRows ? outs.length * ROW_H : 0;
  return HEADER_H + body + outputsH;
}

function getOutputPos(nodeMap, nodeId, handleId) {
  const n = nodeMap[nodeId];
  if (!n) return null;
  const outs = getNodeOutputs(n);
  const idx = outs.findIndex((o) => o.id === handleId);
  if (idx < 0) return null;

  const singleNoLabel = outs.length === 1 && outs[0].label === "";
  if (singleNoLabel) {
    return { x: n.position.x + NODE_W, y: n.position.y + estimateNodeHeight(n) / 2 };
  }

  const bodyH = estimateBodyH(n);
  const baseY = n.position.y + HEADER_H + bodyH;
  return { x: n.position.x + NODE_W, y: baseY + ROW_H * idx + ROW_H / 2 };
}

function getInputPos(nodeMap, nodeId) {
  const n = nodeMap[nodeId];
  if (!n) return null;
  return { x: n.position.x, y: n.position.y + estimateNodeHeight(n) / 2 };
}

function bezierPath(a, b) {
  const dx = Math.max(Math.abs(b.x - a.x) * 0.5, 60);
  return `M ${a.x},${a.y} C ${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
}

export default function DesignEdges({
  nodes, edges, isLight,
  selectedEdgeId, onSelectEdge, onDeleteEdge,
  hoverEdgeId, setHoverEdgeId,
  ghostEdge,
}) {
  // No memo: recompute nodeMap on every render. Cheap (<500 nodes) and avoids a class of bugs.
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className="absolute pointer-events-none"
      style={{ left: 0, top: 0, overflow: "visible", width: 1, height: 1, zIndex: 1 }}
    >
      <defs>
        {Object.entries(ACCENT_HEX).map(([k, v]) => (
          <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={v} />
          </marker>
        ))}
        <style>{`
          @keyframes ccFlow { to { stroke-dashoffset: -24; } }
          .cc-edge-hover { stroke-dasharray: 8 6; animation: ccFlow 0.6s linear infinite; }
        `}</style>
      </defs>

      {edges.map((e) => {
        const src = getOutputPos(nodeMap, e.source, e.sourceHandle || "next");
        const tgt = getInputPos(nodeMap, e.target);
        if (!src || !tgt) return null;

        const sn = nodeMap[e.source];
        if (!sn) return null;
        const visual = getNodeVisual(sn);
        const accent = visual.accent;
        const hex = visual.hex;

        const selected = e.id === selectedEdgeId;
        const hovered = e.id === hoverEdgeId;
        const path = bezierPath(src, tgt);

        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;

        return (
          <g key={e.id}>
            {/* Invisible wide hit zone — 24px stroke for forgiving hover */}
            <path d={path} stroke="transparent" strokeWidth={24} fill="none"
              style={{ pointerEvents: "stroke", cursor: "pointer", transition: "none" }}
              onMouseEnter={() => setHoverEdgeId(e.id)}
              onMouseLeave={() => setHoverEdgeId(null)}
              onClick={(ev) => { ev.stopPropagation(); onSelectEdge(e.id); }}
              onContextMenu={(ev) => { ev.preventDefault(); ev.stopPropagation(); onDeleteEdge(e.id); }} />
            {/* Visible edge */}
            <path d={path}
              stroke={hex}
              strokeOpacity={selected || hovered ? 1 : isLight ? 0.45 : 0.55}
              strokeWidth={selected || hovered ? 2.5 : 1.75}
              fill="none"
              className={hovered ? "cc-edge-hover" : ""}
              style={{ pointerEvents: "none", transition: "none" }}
              markerEnd={`url(#arr-${accent})`} />
            {/* Edge label */}
            {e.label && (
              <text x={midX} y={midY - 6} textAnchor="middle"
                fill={isLight ? "#64748b" : "#94a3b8"} fontSize={9}
                fontFamily="Inter, sans-serif">
                {e.label}
              </text>
            )}
            {/* Hover delete button — big, obvious red X */}
            {(hovered || selected) && (
              <g
                transform={`translate(${midX}, ${midY})`}
                style={{ cursor: "pointer", pointerEvents: "auto" }}
                onMouseEnter={() => setHoverEdgeId(e.id)}
                onMouseLeave={() => setHoverEdgeId(null)}
                onClick={(ev) => { ev.stopPropagation(); onDeleteEdge(e.id); }}>
                <circle r={11} fill="#f43f5e"
                  stroke={isLight ? "#fff" : "#1c1c22"} strokeWidth={2}
                  style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }} />
                <path d="M -4 -4 L 4 4 M 4 -4 L -4 4"
                  stroke="#fff" strokeWidth={2.25} strokeLinecap="round"
                  style={{ pointerEvents: "none" }} />
              </g>
            )}
          </g>
        );
      })}

      {/* Ghost edge while connecting */}
      {ghostEdge && (
        <path d={bezierPath(ghostEdge.from, ghostEdge.to)}
              stroke={ghostEdge.color || "#a1a1aa"} strokeWidth={2} fill="none"
              strokeDasharray="6 5" opacity={0.85} pointerEvents="none" />
      )}
    </svg>
  );
}