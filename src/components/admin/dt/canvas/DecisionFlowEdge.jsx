import React, { useCallback } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from "@xyflow/react";
import { X } from "lucide-react";

function resolveEdgeColor(data) {
  const src = data?.source_handle || "";
  // Webhook handles
  if (src === "success") return "#10b981";
  if (src === "failure") return "#ef4444";
  // Path handles (decision node)
  if (src.startsWith("path-")) return "#f59e0b";
  // Answer handles - color by destination
  if (data?.target_is_dq) return "#ef4444";
  if (data?.target_is_t1) return "#059669";
  if (data?.target_is_qualified) return "#10b981";
  // Explicit style override
  if (data?.style_color && data.style_color !== "#94a3b8") return data.style_color;
  return "#94a3b8";
}

export function DecisionFlowEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  data, style = {}, markerEnd, selected,
}) {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 12,
  });

  const strokeColor = selected ? "#6366f1" : resolveEdgeColor(data);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
    data?.onEdgeDelete?.(id);
  }, [id, setEdges, data]);

  const isPathEdge = data?.source_handle?.startsWith("path-");
  const labelBg = isPathEdge ? "#fffbeb" : "white";
  const labelBorder = isPathEdge ? "#fcd34d" : "#e2e8f0";

  const deleteY = labelY + (data?.label ? 20 : 0);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: data?.animated ? "none" : undefined,
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        {data?.label && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              background: labelBg,
              border: `1px solid ${labelBorder}`,
            }}
            className="text-[10px] font-medium text-slate-600 px-1.5 py-0.5 rounded shadow-sm max-w-[120px] truncate nodrag nopan"
          >
            {data.label}
          </div>
        )}
        {selected && (
          <button
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${deleteY + 10}px)`,
              pointerEvents: "all",
            }}
            className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors nodrag nopan"
            onClick={handleDelete}
            title="Delete edge"
          >
            <X size={10} />
          </button>
        )}
      </EdgeLabelRenderer>
    </>
  );
}