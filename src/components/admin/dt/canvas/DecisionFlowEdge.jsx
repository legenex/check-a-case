import React from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

export function DecisionFlowEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  data, style = {}, markerEnd,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const color = data?.style_color || "#94a3b8";
  const strokeColor = data?.is_dq_path ? "#ef4444" : data?.is_qualified_path ? "#10b981" : color;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: strokeColor, strokeWidth: 2, ...style }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="bg-white border border-slate-200 text-[10px] font-medium text-slate-600 px-1.5 py-0.5 rounded shadow-sm"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}