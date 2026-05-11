import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, reconnectEdge, MarkerType,
  ReactFlowProvider, useReactFlow, Panel,
} from "@xyflow/react";
import { AnimatePresence } from "framer-motion";
import { Plus, Sun, Moon, X, LayoutGrid, Copy, Trash2 } from "lucide-react";
import { DecisionFlowNode } from "./DecisionFlowNode";
import { DecisionFlowEdge } from "./DecisionFlowEdge";
import FloatingNodePalette from "./FloatingNodePalette";
import TreeSettingsDrawer from "./TreeSettingsDrawer";
import { getCategoryForType } from "./nodeCategories";
import NodeEditorModal from "@/components/admin/dt/editors/NodeEditorModal";

// Legacy NodePalette no longer used - replaced by FloatingNodePalette

const NODE_TYPES = { decision: DecisionFlowNode };
const EDGE_TYPES = { decision: DecisionFlowEdge };

const SHOW_ANSWERS_KEY = "cac_dt_show_answer_values";
const THEME_KEY = "cac_dt_canvas_theme";
const AUTO_LAYOUT_KEY = "cac_dt_autolayout_done_"; // + quizId

function nodeMinimapColor(data) {
  const { cat } = getCategoryForType(data?.node_type || "");
  if (cat.name === "Entry") return "#3b82f6";
  if (cat.name === "Logic") return "#f59e0b";
  if (cat.name === "Forms") return "#10b981";
  if (cat.name === "Notifications") return "#8b5cf6";
  if (cat.name === "Outcomes") return "#1d4ed8";
  return "#94a3b8";
}

/** BFS auto-layout: assign positions left-to-right */
export function bfsLayout(nodes, edges) {
  if (nodes.length === 0) return nodes;

  // Build adjacency
  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) {
    if (adj[e.source]) adj[e.source].push(e.target);
  }

  // Find start node(s)
  const startNode = nodes.find((n) => n.data?.node_type === "start_page") || nodes[0];

  const visited = new Set();
  const depthMap = {}; // nodeId -> depth
  const queue = [{ id: startNode.id, depth: 0 }];

  while (queue.length) {
    const { id, depth } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    depthMap[id] = depth;
    for (const nextId of (adj[id] || [])) {
      if (!visited.has(nextId)) queue.push({ id: nextId, depth: depth + 1 });
    }
  }

  // Unvisited nodes get appended at the end
  for (const n of nodes) {
    if (!visited.has(n.id)) depthMap[n.id] = Math.max(...Object.values(depthMap), 0) + 1;
  }

  // Group by depth
  const byDepth = {};
  for (const [id, depth] of Object.entries(depthMap)) {
    if (!byDepth[depth]) byDepth[depth] = [];
    byDepth[depth].push(id);
  }

  const posMap = {};
  for (const [depth, ids] of Object.entries(byDepth)) {
    ids.forEach((id, order) => {
      posMap[id] = {
        x: 100 + Number(depth) * 340,
        y: 100 + order * 200,
      };
    });
  }

  return nodes.map((n) => ({
    ...n,
    position: posMap[n.id] || n.position,
  }));
}

// Real editor modal is imported from editors/NodeEditorModal

function CanvasInner({
  nodes, edges, onNodesChange, onEdgesChange, onConnect,
  onNodeDoubleClick, onPaneClick, onDropNode, onDuplicateNode, onDeleteNode,
  onEdgeDelete, onPreviewNode, dirtyNodeIds,
  reactFlowInstance, setReactFlowInstance,
  showAnswers, isDarkMode,
  quiz, quizId, brands, onUpdateQuiz,
  onRunAutoLayout, onSaveNode,
}) {
  const { screenToFlowPosition, setEdges, fitView } = useReactFlow();
  const dragTypeRef = useRef(null);
  const edgeReconnectSuccessful = useRef(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [editorNode, setEditorNode] = useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);

  const onSelectionChange = useCallback(({ nodes: selNodes }) => {
    setSelectedNodeIds(selNodes.map((n) => n.id));
  }, []);

  const handleBulkDuplicate = useCallback((ids) => {
    ids.forEach((id) => {
      const node = nodes.find((n) => n.id === id);
      if (node) onDuplicateNode(node);
    });
    setSelectedNodeIds([]);
  }, [nodes, onDuplicateNode]);

  const handleBulkDelete = useCallback((ids) => {
    if (!window.confirm(`Delete ${ids.length} nodes? This cannot be undone.`)) return;
    ids.forEach((id) => onDeleteNode(id));
    setSelectedNodeIds([]);
  }, [onDeleteNode]);

  // Flatten all nodes for the modal (pass raw data)
  const allNodeData = nodes.map((n) => ({ ...n.data, _flowId: n.id, position: n.position }));

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

  // Left-to-right connection validation
  const isValidConnection = useCallback((connection) => {
    if (connection.source === connection.target) return false;
    // Target must be target-left
    if (connection.targetHandle && connection.targetHandle !== "target-left") return false;
    // Source must be a right-edge handle
    const src = connection.sourceHandle || "";
    const validSource = src === "source-right" || src.startsWith("answer-") || src.startsWith("path-") || src === "success" || src === "failure";
    if (!validSource) return false;
    // Prevent duplicate edges from same source handle
    const duplicate = edges.some(
      (e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle && e.target === connection.target
    );
    return !duplicate;
  }, [edges]);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge, newConnection) => {
    edgeReconnectSuccessful.current = true;
    setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
  }, [setEdges]);

  const onReconnectEnd = useCallback((_, edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      onEdgeDelete?.(edge.id);
    }
    edgeReconnectSuccessful.current = true;
  }, [setEdges, onEdgeDelete]);

  // Build connected handles map
  const connectedHandlesByNode = {};
  for (const e of edges) {
    if (e.source && e.sourceHandle) {
      if (!connectedHandlesByNode[e.source]) connectedHandlesByNode[e.source] = [];
      connectedHandlesByNode[e.source].push(e.sourceHandle);
    }
  }

  const dirtySet = new Set(dirtyNodeIds || []);

  // Compute reachability + outgoing for warning indicators
  const reachableIds = (() => {
    const startId = nodes.find((n) => n.data?.node_type === "start_page")?.id;
    if (!startId) return new Set();
    const adj = {};
    for (const n of nodes) adj[n.id] = [];
    for (const e of edges) { if (adj[e.source]) adj[e.source].push(e.target); }
    const visited = new Set();
    const q = [startId];
    while (q.length) { const id = q.shift(); if (visited.has(id)) continue; visited.add(id); for (const next of adj[id] || []) q.push(next); }
    return visited;
  })();

  const outgoingByNode = {};
  for (const e of edges) { if (!outgoingByNode[e.source]) outgoingByNode[e.source] = 0; outgoingByNode[e.source]++; }

  const nodesWithCallbacks = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      onEdit: () => setEditorNode(n),
      onDuplicate: () => onDuplicateNode(n),
      onDelete: () => onDeleteNode(n.id),
      onPreview: () => onPreviewNode?.(n),
      _connectedHandles: connectedHandlesByNode[n.id] || [],
      _showAnswerHandles: showAnswers,
      _isDirty: dirtySet.has(n.id),
      _darkMode: isDarkMode,
      _unreachable: n.data?.node_type !== "start_page" && !reachableIds.has(n.id),
      _noOutgoing: n.data?.node_type !== "results_page" && !(outgoingByNode[n.id] > 0),
    },
  }));

  const edgesWithDelete = edges.map((e) => ({
    ...e,
    data: { ...e.data, onEdgeDelete },
  }));

  const handleNodeDoubleClick = useCallback((_, node) => {
    setEditorNode(node);
  }, []);

  const handleEditorSave = useCallback((updatedData) => {
    onSaveNode?.(updatedData);
  }, [onSaveNode]);

  const handleEditorDelete = useCallback((nodeId) => {
    onDeleteNode?.(nodeId);
  }, [onDeleteNode]);

  const canvasBg = isDarkMode ? "bg-slate-950" : "bg-slate-50";
  const dotColor = isDarkMode ? "#1e293b" : "#cbd5e1";
  const gridColor = isDarkMode ? "#0f172a" : "#e2e8f0";

  return (
    <div className={`flex-1 relative overflow-hidden ${canvasBg}`} onDragOver={onDragOver} onDrop={onDrop}>
      {/* Tree settings drawer - overlaid left side */}
      {quiz && (
        <TreeSettingsDrawer
          quiz={quiz}
          quizId={quizId}
          brands={brands}
          onUpdateQuiz={onUpdateQuiz}
        />
      )}

      {/* Floating node palette */}
      <FloatingNodePalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onDragStart={onDragStart}
      />

      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edgesWithDelete}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={onPaneClick}
        onInit={setReactFlowInstance}
        onReconnectStart={onReconnectStart}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
        reconnectRadius={20}
        isValidConnection={isValidConnection}
        onSelectionChange={onSelectionChange}
        fitView
        proOptions={{ hideAttribution: true }}
        connectionMode="strict"
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        deleteKeyCode="Backspace"
        defaultEdgeOptions={{
          type: "decision",
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        }}
      >
        <Background id="bg-dots" gap={24} size={1} color={dotColor} variant="dots" />
        <Background id="bg-grid" gap={120} size={1} color={gridColor} variant="lines" />

        <Controls position="bottom-left" showInteractive={false}>
          <button
            onClick={() => { onRunAutoLayout?.(); setTimeout(() => fitView({ padding: 0.15 }), 100); }}
            title="Auto-layout (BFS)"
            className="flex items-center justify-center w-7 h-7 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors mt-0.5"
          >
            <LayoutGrid size={13} className="text-slate-500" />
          </button>
        </Controls>

        <MiniMap
          position="bottom-right"
          nodeColor={(n) => nodeMinimapColor(n.data)}
          pannable
          zoomable
          style={{
            width: 160,
            height: 100,
            background: isDarkMode ? "#0f172a" : "#f8fafc",
            border: `1px solid ${isDarkMode ? "#1e293b" : "#e2e8f0"}`,
            borderRadius: 8,
          }}
        />

        {/* Canvas-level overlay buttons (top-left of canvas area, not toolbar) */}
        <Panel position="top-left" style={{ marginLeft: 56 }}>
          <button
            onClick={() => setPaletteOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium shadow-sm transition-colors ${
              paletteOpen
                ? "bg-blue-600 text-white border-blue-700"
                : isDarkMode
                  ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Plus size={13} /> Add Node
          </button>
        </Panel>
      </ReactFlow>

      {/* Bulk action bar */}
      {selectedNodeIds.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl pointer-events-auto">
          <span className="text-sm font-medium">{selectedNodeIds.length} nodes selected</span>
          <span className="text-slate-600">·</span>
          <button onClick={() => handleBulkDuplicate(selectedNodeIds)} className="px-2 py-1 text-xs hover:bg-slate-700 rounded flex items-center gap-1 transition-colors">
            <Copy size={12} /> Duplicate
          </button>
          <button onClick={() => handleBulkDelete(selectedNodeIds)} className="px-2 py-1 text-xs hover:bg-red-900 text-red-300 rounded flex items-center gap-1 transition-colors">
            <Trash2 size={12} /> Delete
          </button>
          <button onClick={() => setSelectedNodeIds([])} className="px-2 py-1 text-xs hover:bg-slate-700 rounded transition-colors">Clear</button>
        </div>
      )}

      {/* Real per-node-type editor modal with AnimatePresence */}
      <AnimatePresence>
        {editorNode && (
          <NodeEditorModal
            key={editorNode.id}
            node={editorNode.data || editorNode}
            allNodes={allNodeData}
            allEdges={edges}
            quiz={quiz}
            quizId={quizId}
            onSave={handleEditorSave}
            onDelete={handleEditorDelete}
            onClose={() => setEditorNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdvancedCanvas(props) {
  const [showAnswers, setShowAnswers] = useState(() => {
    try {
      const v = localStorage.getItem(SHOW_ANSWERS_KEY);
      return v === null ? true : v === "true";
    } catch { return true; }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === "dark"; }
    catch { return false; }
  });

  const toggleAnswers = useCallback(() => {
    setShowAnswers((prev) => {
      const next = !prev;
      try { localStorage.setItem(SHOW_ANSWERS_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const toggleDark = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch {}
      return next;
    });
  }, []);

  // Expose these to parent so they show in top toolbar
  useEffect(() => {
    props.onToolbarStateChange?.({ showAnswers, isDarkMode, toggleAnswers, toggleDark });
  }, [showAnswers, isDarkMode]);

  return (
    <ReactFlowProvider>
      <CanvasInner
        {...props}
        showAnswers={showAnswers}
        isDarkMode={isDarkMode}
      />
    </ReactFlowProvider>
  );
}