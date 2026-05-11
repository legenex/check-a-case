import React, { useMemo } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { validateTree } from "./validateTree";

export default function ValidationPopover({ nodes, edges, isDark, onJumpToNode, onClose }) {
  const { issues, entryId } = useMemo(
    () => validateTree(nodes, edges),
    [nodes, edges]
  );

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const bg = isDark ? "rgba(20,20,24,0.97)" : "rgba(255,255,255,0.97)";
  const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";

  const getIcon = (severity) => {
    if (severity === "error") return <AlertCircle size={13} className="text-rose-500 flex-shrink-0 mt-0.5" />;
    return <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />;
  };

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
          <>
            {errors.map((issue, i) => (
              <button
                key={`error-${i}`}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors"
                style={{ background: isDark ? "rgba(244,63,94,0.06)" : "rgba(244,63,94,0.04)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(244,63,94,0.12)" : "rgba(244,63,94,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(244,63,94,0.06)" : "rgba(244,63,94,0.04)"; }}
                onClick={() => { if (issue.nodeId) onJumpToNode(issue.nodeId); onClose(); }}
              >
                {getIcon("error")}
                <div>
                  <div className="text-xs font-medium" style={{ color: "#f43f5e" }}>{issue.message}</div>
                </div>
              </button>
            ))}
            {warnings.map((issue, i) => (
              <button
                key={`warn-${i}`}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors"
                style={{ background: isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)"; }}
                onClick={() => { if (issue.nodeId) onJumpToNode(issue.nodeId); onClose(); }}
              >
                {getIcon("warning")}
                <div>
                  <div className="text-xs font-medium" style={{ color: "#f59e0b" }}>{issue.message}</div>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}