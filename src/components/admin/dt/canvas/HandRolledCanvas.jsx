import React, { useRef, useState, useCallback, useEffect } from "react";
import CanvasNode, { NODE_W } from "./CanvasNode";
import CanvasEdges from "./CanvasEdges";
import CanvasMinimap from "./CanvasMinimap";
import ZoomControls from "./ZoomControls";
import QuickAddPopover from "./QuickAddPopover";

const GRID_SIZE = 22;
const CLAMP_MIN = 0.25;
const CLAMP_MAX = 2;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function screenToWorld(sx, sy, vp) {
  return { x: (sx - vp.x) / vp.zoom, y: (sy - vp.y) / vp.zoom };
}

function worldToScreen(wx, wy, vp) {
  return { x: wx * vp.zoom + vp.x, y: wy * vp.zoom + vp.y };
}

export default function HandRolledCanvas({
  nodes, edges, selection, isDark,
  testNodeId, testTraversedNodes,
  selectedEdgeId,
  onNodesChange, onEdgesChange,
  onSelect, onClearSelection, onSelectAll,
  onDeleteSelected, onDuplicateSelected,
  onEdgeClick, onEdgeDelete,
  onNodeDelete, onNodeDuplicate,
  onConnect,
  onCanvasDrop,
  onTitleCommit,
  onViewportRef,
  libraryWidth,
}) {
  const wrapRef = useRef(null);
  const [viewport, setViewport] = useState({ x: 80, y: 80, zoom: 0.85 });
  const [spaceDown, setSpaceDown] = useState(false);
  const [hoverEdgeId, setHoverEdgeId] = useState(null);
  const [ghostEdge, setGhostEdge] = useState(null);
  const [quickAdd, setQuickAdd] = useState(null);
  const [marquee, setMarquee] = useState(null);

  // Drag state refs
  const dragRef = useRef(null);     // node drag
  const panRef = useRef(null);      // panning
  const marqueeRef = useRef(null);  // marquee select
  const connectRef = useRef(null);  // edge connect

  // Expose viewport updater to parent (for jump-to-node)
  useEffect(() => {
    onViewportRef && (onViewportRef.current = { setViewport, getViewport: () => viewport });
  });

  // Space key
  useEffect(() => {
    const down = (e) => { if (e.key === " " && !e.target.matches("input,textarea")) setSpaceDown(true); };
    const up = (e) => { if (e.key === " ") setSpaceDown(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Fit to view
  const fitView = useCallback((nodeList) => {
    const ns = nodeList || nodes;
    if (!ns.length || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const xs = ns.map((n) => n.position.x);
    const ys = ns.map((n) => n.position.y);
    const minX = Math.min(...xs) - 40;
    const maxX = Math.max(...xs) + NODE_W + 40;
    const minY = Math.min(...ys) - 40;
    const maxY = Math.max(...ys) + 90 + 40;
    const wW = maxX - minX;
    const wH = maxY - minY;
    const availW = rect.width - libraryWidth - 80;
    const availH = rect.height - 56 - 80;
    const zoom = clamp(Math.min(availW / wW, availH / wH), CLAMP_MIN, 1);
    setViewport({
      x: (rect.width - wW * zoom) / 2 - minX * zoom,
      y: (rect.height - wH * zoom) / 2 - minY * zoom,
      zoom,
    });
  }, [nodes, libraryWidth]);

  useEffect(() => {
    const t = setTimeout(() => fitView(nodes), 150);
    return () => clearTimeout(t);
  }, []);

  const jumpToNode = useCallback((nodeId) => {
    const n = nodes.find((nd) => nd.id === nodeId);
    if (!n || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = n.position.x + NODE_W / 2;
    const cy = n.position.y + 45;
    setViewport((vp) => ({
      ...vp,
      x: rect.width / 2 - cx * vp.zoom,
      y: rect.height / 2 - cy * vp.zoom,
    }));
  }, [nodes]);

  useEffect(() => {
    if (onViewportRef) {
      onViewportRef.current = { setViewport, fitView, jumpToNode };
    }
  }, [fitView, jumpToNode]);

  // Wheel
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      setViewport((vp) => {
        const wx = (mx - vp.x) / vp.zoom;
        const wy = (my - vp.y) / vp.zoom;
        const newZoom = clamp(vp.zoom * (1 + -e.deltaY * 0.0015), CLAMP_MIN, CLAMP_MAX);
        return { x: mx - wx * newZoom, y: my - wy * newZoom, zoom: newZoom };
      });
    } else {
      setViewport((vp) => ({ ...vp, x: vp.x - e.deltaX, y: vp.y - e.deltaY }));
    }
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // Pointer down on canvas background
  const onBgPointerDown = useCallback((e) => {
    if (e.target.closest("[data-handle]") || e.target.closest("[data-action]")) return;
    const rect = wrapRef.current.getBoundingClientRect();

    // Middle mouse or space+left = pan
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      e.preventDefault();
      panRef.current = { startX: e.clientX, startY: e.clientY, vpStart: viewport };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // Left click on empty = marquee
    if (e.button === 0) {
      onClearSelection();
      setQuickAdd(null);
      const wx = e.clientX - rect.left;
      const wy = e.clientY - rect.top;
      marqueeRef.current = { startX: wx, startY: wy };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, [spaceDown, viewport, onClearSelection]);

  const onBgPointerMove = useCallback((e) => {
    const rect = wrapRef.current.getBoundingClientRect();

    // Pan
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setViewport({ ...panRef.current.vpStart, x: panRef.current.vpStart.x + dx, y: panRef.current.vpStart.y + dy });
      return;
    }

    // Marquee
    if (marqueeRef.current) {
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const x = Math.min(sx, marqueeRef.current.startX);
      const y = Math.min(sy, marqueeRef.current.startY);
      const w = Math.abs(sx - marqueeRef.current.startX);
      const h = Math.abs(sy - marqueeRef.current.startY);
      setMarquee({ x, y, w, h });
      return;
    }

    // Node drag
    if (dragRef.current) {
      const dx = (e.clientX - dragRef.current.lastX) / viewport.zoom;
      const dy = (e.clientY - dragRef.current.lastY) / viewport.zoom;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      onNodesChange(dragRef.current.ids.map((id) => ({ type: "move", id, dx, dy })));
      return;
    }

    // Connect ghost
    if (connectRef.current) {
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const world = screenToWorld(cx, cy, viewport);
      setGhostEdge({ ...connectRef.current, ex: world.x, ey: world.y });
    }
  }, [viewport, onNodesChange]);

  const onBgPointerUp = useCallback((e) => {
    const rect = wrapRef.current.getBoundingClientRect();

    if (panRef.current) { panRef.current = null; return; }

    // Marquee release - select intersecting nodes
    if (marqueeRef.current && marquee) {
      const selected = nodes.filter((n) => {
        const ns = worldToScreen(n.position.x, n.position.y, viewport);
        const ne = worldToScreen(n.position.x + NODE_W, n.position.y + 90, viewport);
        return ns.x < marquee.x + marquee.w && ne.x > marquee.x &&
               ns.y < marquee.y + marquee.h && ne.y > marquee.y;
      });
      onSelect(selected.map((n) => n.id), false);
      marqueeRef.current = null;
      setMarquee(null);
      return;
    }
    marqueeRef.current = null;
    setMarquee(null);

    // Node drag release
    if (dragRef.current) {
      dragRef.current.onRelease?.();
      dragRef.current = null;
      return;
    }

    // Connect release
    if (connectRef.current) {
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setGhostEdge(null);
      connectRef.current = null;

      // If pointer is over an input handle - handled by onConnectEnd on the node
      // Otherwise, open QuickAdd
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const inputHandle = target?.closest("[data-handle='input']");
      if (!inputHandle) {
        const world = screenToWorld(cx, cy, viewport);
        setQuickAdd({ screenX: cx + rect.left, screenY: cy + rect.top, worldX: world.x, worldY: world.y });
      }
      return;
    }
  }, [marquee, nodes, viewport, onSelect]);

  // Node drag start
  const onNodeDragStart = useCallback((e, nodeId) => {
    e.stopPropagation();
    const ids = selection.includes(nodeId) ? selection : [nodeId];
    dragRef.current = { ids, lastX: e.clientX, lastY: e.clientY };
    wrapRef.current?.setPointerCapture?.(e.pointerId);
  }, [selection]);

  // Connect start from output handle
  const onConnectStart = useCallback((e, nodeId, handleId) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const src = nodes.find((n) => n.id === nodeId);
    if (!src) return;
    const outputs = src.outputHandles || [];
    const sx = src.position.x + NODE_W + 6;
    const sy = src.position.y + 45;
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, viewport);
    connectRef.current = { sourceId: nodeId, sourceHandle: handleId, sx: src.position.x + NODE_W + 6, sy, ex: world.x, ey: world.y };
    wrapRef.current?.setPointerCapture(e.pointerId);
  }, [nodes, viewport]);

  // Connect end on input handle
  const onConnectEnd = useCallback((e, targetId) => {
    if (!connectRef.current) return;
    const { sourceId, sourceHandle } = connectRef.current;
    setGhostEdge(null);
    connectRef.current = null;
    if (sourceId !== targetId) {
      onConnect({ source: sourceId, sourceHandle, target: targetId, targetHandle: "in" });
    }
  }, [onConnect]);

  // QuickAdd from connect-to-empty
  const onQuickAddSelect = useCallback((typeKey) => {
    if (!quickAdd) return;
    const { worldX, worldY } = quickAdd;
    const sourceId = connectRef.current?.sourceId;
    const sourceHandle = connectRef.current?.sourceHandle;
    setQuickAdd(null);
    connectRef.current = null;
    onCanvasDrop(typeKey, worldX - NODE_W / 2, worldY - 40, sourceId ? { source: sourceId, sourceHandle } : null);
  }, [quickAdd, onCanvasDrop]);

  // Drop from library
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const typeKey = e.dataTransfer.getData("application/x-node-type");
    if (!typeKey) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, viewport);
    const resultKind = e.dataTransfer.getData("application/x-result-kind") || undefined;
    onCanvasDrop(typeKey, world.x - NODE_W / 2, world.y - 40, null, resultKind ? { result_kind: resultKind } : undefined);
  }, [viewport, onCanvasDrop]);

  // Minimap recenter
  const onMinimapRecenter = useCallback((wx, wy) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setViewport((vp) => ({
      ...vp,
      x: rect.width / 2 - wx * vp.zoom,
      y: rect.height / 2 - wy * vp.zoom,
    }));
  }, []);

  const { zoom } = viewport;
  const rect = wrapRef.current?.getBoundingClientRect();
  const bgOffsetX = ((viewport.x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
  const bgOffsetY = ((viewport.y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
  const bgSize = GRID_SIZE * zoom;

  const testTraversedSet = new Set(testTraversedNodes || []);

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 overflow-hidden"
      style={{
        cursor: spaceDown ? "grab" : "default",
        background: isDark ? "#0d0d11" : "#f6f5f1",
        backgroundImage: `radial-gradient(${isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.08)"} 1.2px, transparent 1.3px)`,
        backgroundSize: `${bgSize}px ${bgSize}px`,
        backgroundPosition: `${bgOffsetX}px ${bgOffsetY}px`,
        zIndex: 10,
      }}
      onPointerDown={onBgPointerDown}
      onPointerMove={onBgPointerMove}
      onPointerUp={onBgPointerUp}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* World transform wrapper */}
      <div
        className="absolute"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: "0 0", width: 0, height: 0 }}
      >
        {/* Edges SVG layer (behind nodes) */}
        <CanvasEdges
          edges={edges}
          nodes={nodes}
          selectedEdgeId={selectedEdgeId}
          hoverEdgeId={hoverEdgeId}
          onEdgeClick={onEdgeClick}
          onEdgeDelete={onEdgeDelete}
          isDark={isDark}
          viewport={viewport}
          ghostEdge={ghostEdge}
        />

        {/* Nodes */}
        {nodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            isDark={isDark}
            isSelected={selection.includes(node.id)}
            isTestActive={testNodeId === node.id}
            isTestTraversed={testTraversedSet.has(node.id)}
            onDragStart={onNodeDragStart}
            onSelect={onSelect}
            onDelete={onNodeDelete}
            onDuplicate={onNodeDuplicate}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onTitleCommit={onTitleCommit}
          />
        ))}
      </div>

      {/* Marquee */}
      {marquee && (
        <div
          className="absolute pointer-events-none border border-violet-400"
          style={{
            left: marquee.x, top: marquee.y,
            width: marquee.w, height: marquee.h,
            background: "rgba(139,92,246,0.07)",
            zIndex: 15,
          }}
        />
      )}

      {/* QuickAdd popover */}
      {quickAdd && (
        <QuickAddPopover
          screenX={quickAdd.screenX - (rect?.left || 0)}
          screenY={quickAdd.screenY - (rect?.top || 0)}
          isDark={isDark}
          onSelect={onQuickAddSelect}
          onClose={() => setQuickAdd(null)}
        />
      )}

      {/* Minimap */}
      <CanvasMinimap
        nodes={nodes}
        viewport={viewport}
        canvasW={rect?.width || 800}
        canvasH={rect?.height || 600}
        isDark={isDark}
        onRecenter={onMinimapRecenter}
      />

      {/* Zoom controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={() => setViewport((pv) => {
          const newZoom = clamp(pv.zoom * 1.2, CLAMP_MIN, CLAMP_MAX);
          if (!wrapRef.current) return pv;
          const r = wrapRef.current.getBoundingClientRect();
          const cx = r.width / 2; const cy = r.height / 2;
          const wx = (cx - pv.x) / pv.zoom; const wy = (cy - pv.y) / pv.zoom;
          return { x: cx - wx * newZoom, y: cy - wy * newZoom, zoom: newZoom };
        })}
        onZoomOut={() => setViewport((pv) => {
          const newZoom = clamp(pv.zoom / 1.2, CLAMP_MIN, CLAMP_MAX);
          if (!wrapRef.current) return pv;
          const r = wrapRef.current.getBoundingClientRect();
          const cx = r.width / 2; const cy = r.height / 2;
          const wx = (cx - pv.x) / pv.zoom; const wy = (cy - pv.y) / pv.zoom;
          return { x: cx - wx * newZoom, y: cy - wy * newZoom, zoom: newZoom };
        })}
        onFitView={() => fitView()}
        isDark={isDark}
      />
    </div>
  );
}