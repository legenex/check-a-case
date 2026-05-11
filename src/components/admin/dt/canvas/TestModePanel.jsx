import React, { useState, useCallback } from "react";
import { X, ChevronRight } from "lucide-react";
import { designType, getNodeOutputs } from "./nodeTypes";
import { detectEntryNode } from "./validateTree";

export default function TestModePanel({ nodes, edges, startNodeId, isDark, onClose, onJumpToNode }) {
  const autoEntryId = detectEntryNode(nodes, edges).entryId;
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId || autoEntryId || nodes[0]?.id);
  const [variables, setVariables] = useState({});
  const [path, setPath] = useState([currentNodeId].filter(Boolean));

  const nodeMap = {};
  for (const n of nodes) nodeMap[n.id] = n;

  const currentNode = nodeMap[currentNodeId];
  const dt = currentNode ? designType(currentNode) : null;
  const isTerminal = dt === "result" || !currentNode;

  const getOutgoingEdges = (nodeId) => edges.filter((e) => e.source === nodeId);

  const handleAdvance = useCallback((handleId) => {
    const outgoing = getOutgoingEdges(currentNodeId);
    const edge = outgoing.find((e) => e.sourceHandle === handleId) || outgoing[0];
    if (!edge) return;
    const nextNode = nodeMap[edge.target];
    if (!nextNode) return;
    setCurrentNodeId(nextNode.id);
    setPath((p) => [...p, nextNode.id]);
  }, [currentNodeId, edges, nodeMap]);

  const handleReset = () => {
    const start = detectEntryNode(nodes, edges).entryId || nodes[0]?.id;
    setCurrentNodeId(start);
    setVariables({});
    setPath([start].filter(Boolean));
  };

  const bg = isDark ? "rgba(20,20,24,0.97)" : "rgba(252,251,248,0.97)";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const textPrimary = isDark ? "#e2e8f0" : "#1e293b";
  const textSecondary = isDark ? "#64748b" : "#94a3b8";

  const outputs = currentNode ? getNodeOutputs(currentNode) : [];

  return (
    <div
      className="flex-shrink-0 flex flex-col h-full z-30"
      style={{
        width: 380,
        background: bg,
        backdropFilter: "blur(14px) saturate(140%)",
        borderLeft: `1px solid ${border}`,
        animation: "ccSlideIn 220ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: border }}>
        <div>
          <div className="font-semibold text-sm" style={{ color: textPrimary }}>Test Run</div>
          <div className="text-[10px]" style={{ color: textSecondary }}>Simulating flow - no data is saved</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="text-xs px-2 py-1 rounded border transition-colors" style={{ borderColor: border, color: textSecondary }}>Reset</button>
          <button onClick={onClose} className="p-1 rounded hover:bg-rose-500/10" style={{ color: textSecondary }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Current node */}
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: border }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: textSecondary }}>Current Node</div>
        {currentNode ? (
          <div className="rounded-lg p-3" style={{ background: isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <div className="font-medium text-sm" style={{ color: textPrimary }}>{currentNode.label || dt}</div>
            {currentNode.title_display && <div className="text-xs mt-1" style={{ color: textSecondary }}>{currentNode.title_display}</div>}
          </div>
        ) : (
          <div className="text-sm" style={{ color: textSecondary }}>Tree complete</div>
        )}

        {!isTerminal && outputs.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {outputs.map((out) => (
              <button
                key={out.id}
                onClick={() => handleAdvance(out.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors"
                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: textPrimary }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"; }}
              >
                {out.label}
                <ChevronRight size={12} />
              </button>
            ))}
          </div>
        )}

        {isTerminal && (
          <div className="mt-3 text-xs text-emerald-500 font-medium">Flow complete</div>
        )}
      </div>

      {/* Path trail */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: textSecondary }}>Path ({path.length} steps)</div>
        <div className="space-y-1">
          {path.map((nid, i) => {
            const n = nodeMap[nid];
            return (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors"
                style={{ color: nid === currentNodeId ? "#8b5cf6" : textSecondary }}
                onClick={() => onJumpToNode(nid)}
              >
                <span className="text-[9px] w-4 text-right flex-shrink-0">{i + 1}.</span>
                <span className="truncate">{n?.label || nid}</span>
                {nid === currentNodeId && <span className="ml-auto text-[9px] text-violet-400">current</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}