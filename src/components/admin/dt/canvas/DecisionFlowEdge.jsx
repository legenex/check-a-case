import React from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

export function DecisionFlowEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  data, style = {}, markerEnd,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  // Color priority:
  // 1. Explicit override (is_dq_path / is_qualified_path from data)
  // 2. Answer edge going to DQ outcome -> red
  // 3. Answer edge going to qualified outcome -> green
  // 4. Answer edge (has source_handle that is an option_id, not "default") -> blue
  // 5. Default fallback edge -> gray
  let strokeColor = "#94a3b8"; // default gray

  if (data?.is_dq_path) {
    strokeColor = "#ef4444";
  } else if (data?.is_qualified_path) {
    strokeColor = "#10b981";
  } else if (data?.source_handle && data.source_handle !== "default") {
    // This is an answer-routed edge
    if (data?.target_is_dq) {
      strokeColor = "#ef4444";
    } else if (data?.target_is_qualified) {
      strokeColor = "#10b981";
    } else {
      strokeColor = "#3b82f6";
    }
  } else if (data?.style_color && data.style_color !== "#94a3b8") {
    strokeColor = data.style_color;
  }

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
            className="bg-white border border-slate-200 text-[10px] font-medium text-slate-600 px-1.5 py-0.5 rounded shadow-sm max-w-[120px] truncate"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}