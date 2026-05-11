import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, reconnectEdge, MarkerType,
  ReactFlowProvider, useReactFlow, Panel,
} from "@xyflow/react";
import { Plus, Sun, Moon, X, LayoutGrid } from "lucide-react";
import { DecisionFlowNode } from "./DecisionFlowNode";
import { DecisionFlowEdge } from "./DecisionFlowEdge";
import FloatingNodePalette from "./FloatingNodePalette";
import TreeSettingsDrawer from "./TreeSettingsDrawer";
import { getCategoryForType } from "./nodeCategories";

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

// Placeholder editor modal
function NodeEditorModal({ node, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!node) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="font-semibold text-slate-900">{node.data?.label || node.data?.node_type}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{node.data?.node_type}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 text-center space-y-3">
          <div className="text-4xl">🔧</div>
          <p className="text-sm font-medium text-slate-700">Per-node-type editor (coming in next build)</p>
          <p className="text-xs text-slate-400">Use the canvas to wire connections. Full node editor modal coming soon.</p>
        </div>
        <div className="px-5 py-3 bg-slate-50 rounded-b-xl border-t border-slate-200 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CanvasInner({
  nodes, edges, onNodesChange, onEdgesChange, onConnect,
  onNodeDoubleClick, onPaneClick, onDropNode, onDuplicateNode, onDeleteNode,
  onEdgeDelete, onPreviewNode, dirtyNodeIds,
  reactFlowInstance, setReactFlowInstance,
  showAnswers, isDarkMode,
  quiz, quizId, brands, onUpdateQuiz,
  onRunAutoLayout,
}) {
  const { screenToFlowPosition, setEdges, fitView } = useReactFlow();
  const dragTypeRef = useRef(null);
  const edgeReconnectSuccessful = useRef(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [editorNode, setEditorNode] = useState(null);

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
    },
  }));

  const edgesWithDelete = edges.map((e) => ({
    ...e,
    data: { ...e.data, onEdgeDelete },
  }));

  const handleNodeDoubleClick = useCallback((_, node) => {
    setEditorNode(node);
  }, []);

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
        fitView
        proOptions={{ hideAttribution: true }}
        connectionMode="strict"
        multiSelectionKeyCode="Shift"
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

      {/* Node editor placeholder modal */}
      {editorNode && (
        <NodeEditorModal node={editorNode} onClose={() => setEditorNode(null)} />
      )}
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