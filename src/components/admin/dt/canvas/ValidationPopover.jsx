import React, { useMemo } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { NODE_W } from "./CanvasNode";
import { designType } from "./nodeRegistry";

function computeValidation(nodes, edges) {
  const issues = [];
  const nodeMap = {};
  for (const n of nodes) nodeMap[n.id] = n;

  const inbound = {};
  const outbound = {};
  for (const n of nodes) { inbound[n.id] = 0; outbound[n.id] = 0; }
  for (const e of edges) {
    if (outbound[e.source] !== undefined) outbound[e.source]++;
    if (inbound[e.target] !== undefined) inbound[e.target]++;
  }

  const startNode = nodes.find((n) => designType(n) === "start");
  const terminalTypes = new Set(["result", "note"]);

  // Orphans
  for (const n of nodes) {
    const dt = designType(n);
    if (dt === "start" || dt === "note") continue;
    if (inbound[n.id] === 0) {
      issues.push({ type: "orphan", nodeId: n.id, label: n.label || dt, text: "Orphan: no inbound connection" });
    }
  }

  // Dead ends
  for (const n of nodes) {
    const dt = designType(n);
    if (terminalTypes.has(dt)) continue;
    if (outbound[n.id] === 0) {
      issues.push({ type: "deadend", nodeId: n.id, label: n.label || dt, text: "Dead end: no outbound connection" });
    }
  }

  // Unreachable (DFS from start)
  if (startNode) {
    const adj = {};
    for (const n of nodes) adj[n.id] = [];
    for (const e of edges) { if (adj[e.source]) adj[e.source].push(e.target); }
    const visited = new Set();
    const stack = [startNode.id];
    while (stack.length) {
      const id = stack.pop();
      if (visited.has(id)) continue;
      visited.add(id);
      for (const next of adj[id] || []) stack.push(next);
    }
    for (const n of nodes) {
      const dt = designType(n);
      if (dt === "start" || dt === "note") continue;
      if (!visited.has(n.id) && !issues.find((i) => i.nodeId === n.id && i.type === "orphan")) {
        issues.push({ type: "unreachable", nodeId: n.id, label: n.label || dt, text: "Unreachable from Start" });
      }
    }
  }

  return issues;
}

export default function ValidationPopover({ nodes, edges, isDark, onJumpToNode, onClose }) {
  const issues = useMemo(() => computeValidation(nodes, edges), [nodes, edges]);
  const bg = isDark ? "rgba(20,20,24,0.97)" : "rgba(255,255,255,0.97)";
  const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";

  return (
    <div
      className="absolute right-4 z-50 rounded-xl shadow-2xl overflow-hidden"
      style={{
        top: 64, width: 460,
        background: bg,
        backdropFilter: "blur(16px)",
        border: `1px solid ${border}`,
        animation: "ccSlideIn 220ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: border }}>
        <span className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
          Validation {issues.length > 0 ? `(${issues.length} issue${issues.length > 1 ? "s" : ""})` : ""}
        </span>
        <button onClick={onClose} className="text-xs" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Close</button>
      </div>
      <div className="max-h-80 overflow-y-auto p-3 space-y-1.5">
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-4 text-emerald-500">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">No issues, tree is well-formed.</span>
          </div>
        ) : (
          issues.map((issue, i) => (
            <button
              key={i}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors"
              style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"; }}
              onClick={() => { onJumpToNode(issue.nodeId); onClose(); }}
            >
              <AlertCircle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{issue.label}</div>
                <div className="text-[10px]" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{issue.text}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export { computeValidation };