import React, { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, applyEdgeChanges, applyNodeChanges,
  ReactFlowProvider, useReactFlow,
} from "@xyflow/react";
import { DecisionFlowNode } from "./DecisionFlowNode";
import { DecisionFlowEdge } from "./DecisionFlowEdge";
import NodePalette from "./NodePalette";
import { getCategoryForType } from "./nodeCategories";

const NODE_TYPES = { decision: DecisionFlowNode };
const EDGE_TYPES = { decision: DecisionFlowEdge };

function nodeColor(data) {
  const { cat } = getCategoryForType(data?.node_type || "");
  if (cat.name === "Entry") return "#3b82f6";
  if (cat.name === "Logic") return "#f59e0b";
  if (cat.name === "Forms") return "#10b981";
  if (cat.name === "Notifications") return "#8b5cf6";
  if (cat.name === "Outcomes") return "#1d4ed8";
  return "#94a3b8";
}

function CanvasInner({
  nodes, edges, onNodesChange, onEdgesChange, onConnect,
  onNodeClick, onPaneClick, onDropNode, onDuplicateNode, onDeleteNode,
  reactFlowInstance, setReactFlowInstance,
}) {
  const { screenToFlowPosition } = useReactFlow();
  const dragTypeRef = useRef(null);

  const onDragStart = useCallback((e, nodeType) => {
    dragTypeRef.current = nodeType;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const nodeType = dragTypeRef.current;
    if (!nodeType) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    onDropNode(nodeType, position);
    dragTypeRef.current = null;
  }, [screenToFlowPosition, onDropNode]);

  // Build set of source handles that have an edge, per node
  const connectedHandlesByNode = {};
  for (const e of edges) {
    if (e.source && e.sourceHandle) {
      if (!connectedHandlesByNode[e.source]) connectedHandlesByNode[e.source] = [];
      connectedHandlesByNode[e.source].push(e.sourceHandle);
    }
  }

  const nodesWithCallbacks = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      onEdit: () => onNodeClick(n),
      onDuplicate: () => onDuplicateNode(n),
      onDelete: () => onDeleteNode(n.id),
      _connectedHandles: connectedHandlesByNode[n.id] || [],
    },
  }));

  return (
    <div className="flex flex-1 overflow-hidden">
      <NodePalette onDragStart={onDragStart} />
      <div className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => onNodeClick(node)}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          fitView
          proOptions={{ hideAttribution: true }}
          connectionMode="loose"
          multiSelectionKeyCode="Shift"
          deleteKeyCode="Backspace"
          defaultEdgeOptions={{ type: "decision", animated: true }}
        >
          <Background variant="dots" gap={16} size={1} color="#cbd5e1" />
          <Controls position="top-right" />
          <MiniMap
            position="bottom-right"
            nodeColor={(n) => nodeColor(n.data)}
            style={{ width: 140, height: 90 }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function AdvancedCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}