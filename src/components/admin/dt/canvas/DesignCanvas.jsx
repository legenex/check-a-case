// DesignCanvas.jsx — full canvas matching design source
import React, { useRef, useState, useCallback, useEffect } from "react";
import DesignNode, { NODE_W } from "./DesignNode";
import DesignEdges from "./DesignEdges";
import DesignMinimap from "./DesignMinimap";
import DesignZoomControls from "./DesignZoomControls";
import DesignQuickAdd from "./DesignQuickAdd";

const CLAMP_MIN = 0.18;
const CLAMP_MAX = 2.2;
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function screenToWorld(sx, sy, vp) { return { x: (sx - vp.x) / vp.zoom, y: (sy - vp.y) / vp.zoom }; }
function worldToScreen(wx, wy, vp) { return { x: wx * vp.zoom + vp.x, y: wy * vp.zoom + vp.y }; }

export default function DesignCanvas({
  nodes, edges, selection, isLight,
  testNodeId, testTraversedNodes, selectedEdgeId,
  onMoveNode, onSelect, onClearSelection, onSelectAll,
  onDeleteSelected, onDuplicateSelected,
  onEdgeClick, onEdgeDelete,
  onNodeDelete, onNodeDuplicate,
  onConnect, onCanvasDrop, onTitleCommit,
  onViewportRef, libraryWidth,
  validation,
}) {
  const wrapRef = useRef(null);
  const [viewport, setViewport] = useState({ x: 80, y: 80, zoom: 0.82 });
  const [spaceDown, setSpaceDown] = useState(false);
  const [hoverEdgeId, setHoverEdgeId] = useState(null);
  const [ghostEdge, setGhostEdge] = useState(null);
  const [quickAdd, setQuickAdd] = useState(null);
  const [marquee, setMarquee] = useState(null);

  const dragRef = useRef(null);
  const panRef = useRef(null);
  const marqueeRef = useRef(null);
  const connectRef = useRef(null);

  // Space key for pan
  useEffect(() => {
    const dn = (e) => { if (e.key === " " && !e.target.matches("input,textarea")) { e.preventDefault(); setSpaceDown(true); } };
    const up = (e) => { if (e.key === " ") setSpaceDown(false); };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // Fit to view
  const fitView = useCallback((nodeList) => {
    const ns = nodeList || nodes;
    if (!ns.length || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const xs = ns.map((n) => n.position.x);
    const ys = ns.map((n) => n.position.y);
    const minX = Math.min(...xs) - 60;
    const maxX = Math.max(...xs) + NODE_W + 60;
    const minY = Math.min(...ys) - 60;
    const maxY = Math.max(...ys) + 140 + 60;
    const wW = maxX - minX || 1;
    const wH = maxY - minY || 1;
    const availW = rect.width - 80;
    const availH = rect.height - 80;
    const zoom = clamp(Math.min(availW / wW, availH / wH), CLAMP_MIN, 1);
    setViewport({
      x: (rect.width - wW * zoom) / 2 - minX * zoom,
      y: (rect.height - wH * zoom) / 2 - minY * zoom,
      zoom,
    });
  }, [nodes]);

  useEffect(() => {
    const t = setTimeout(() => fitView(nodes), 120);
    return () => clearTimeout(t);
  }, []);

  const jumpToNode = useCallback((nodeId) => {
    const n = nodes.find((nd) => nd.id === nodeId);
    if (!n || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setViewport((vp) => ({
      ...vp,
      x: rect.width / 2 - (n.position.x + NODE_W / 2) * vp.zoom,
      y: rect.height / 2 - (n.position.y + 70) * vp.zoom,
    }));
  }, [nodes]);

  useEffect(() => {
    if (onViewportRef) onViewportRef.current = { setViewport, fitView, jumpToNode };
  }, [fitView, jumpToNode]);

  // Wheel zoom/pan
  const onWheel = useCallback((e) => {
    e.preventDefault();
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (e.ctrlKey || e.metaKey) {
      setViewport((vp) => {
        const wx = (mx - vp.x) / vp.zoom;
        const wy = (my - vp.y) / vp.zoom;
        const nz = clamp(vp.zoom * (1 - e.deltaY * 0.0015), CLAMP_MIN, CLAMP_MAX);
        return { x: mx - wx * nz, y: my - wy * nz, zoom: nz };
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

  // Canvas pointer events
  const onBgPointerDown = useCallback((e) => {
    if (e.target.closest("[data-handle]") || e.target.closest("[data-no-drag]")) return;
    const rect = wrapRef.current.getBoundingClientRect();

    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      e.preventDefault();
      panRef.current = { startX: e.clientX, startY: e.clientY, vpStart: { ...viewport } };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button === 0) {
      onClearSelection();
      setQuickAdd(null);
      marqueeRef.current = { startX: e.clientX - rect.left, startY: e.clientY - rect.top };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, [spaceDown, viewport, onClearSelection]);

  const onBgPointerMove = useCallback((e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setViewport({ ...panRef.current.vpStart, x: panRef.current.vpStart.x + dx, y: panRef.current.vpStart.y + dy });
      return;
    }
    if (marqueeRef.current) {
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      setMarquee({
        x: Math.min(sx, marqueeRef.current.startX),
        y: Math.min(sy, marqueeRef.current.startY),
        w: Math.abs(sx - marqueeRef.current.startX),
        h: Math.abs(sy - marqueeRef.current.startY),
      });
      return;
    }
    if (connectRef.current) {
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, viewport);
      setGhostEdge({ ...connectRef.current, ex: world.x, ey: world.y });
    }
  }, [viewport]);

  const onBgPointerUp = useCallback((e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (panRef.current) { panRef.current = null; return; }

    if (marqueeRef.current && marquee) {
      const sel = nodes.filter((n) => {
        const ns = worldToScreen(n.position.x, n.position.y, viewport);
        const ne = worldToScreen(n.position.x + NODE_W, n.position.y + 100, viewport);
        return ns.x < marquee.x + marquee.w && ne.x > marquee.x &&
               ns.y < marquee.y + marquee.h && ne.y > marquee.y;
      });
      if (sel.length > 0) onSelect(sel.map((n) => n.id), false);
      marqueeRef.current = null;
      setMarquee(null);
      return;
    }
    marqueeRef.current = null;
    setMarquee(null);

    if (connectRef.current) {
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const world = screenToWorld(cx, cy, viewport);
      setGhostEdge(null);
      const pending = connectRef.current;
      connectRef.current = null;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const inputHandle = target?.closest("[data-handle='input']");
      if (inputHandle) {
        // handled by node's onPointerUp
      } else {
        setQuickAdd({
          screenX: cx, screenY: cy,
          worldX: world.x, worldY: world.y,
          pendingConnect: pending,
        });
      }
    }
  }, [marquee, nodes, viewport, onSelect]);

  // Connect start/end
  const onStartConnect = (e, sourceId, sourceHandle, color) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = wrapRef.current.getBoundingClientRect();
    const startScreen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const startWorld = screenToWorld(startScreen.x, startScreen.y, viewport);
    const origin = { sx: e.clientX, sy: e.clientY };
    let moved = false;

    const move = (ev) => {
      const dx = ev.clientX - origin.sx;
      const dy = ev.clientY - origin.sy;
      if (!moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        moved = true;
        setGhostEdge({ from: startWorld, to: startWorld, color });
      }
      if (!moved) return;
      const cx = ev.clientX - rect.left;
      const cy = ev.clientY - rect.top;
      const w = screenToWorld(cx, cy, viewport);
      setGhostEdge(g => g ? { ...g, to: w } : null);
    };

    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (!moved) {
        setGhostEdge(null);
        return;
      }
      const elTarget = document.elementFromPoint(ev.clientX, ev.clientY);
      const inputEl = elTarget && elTarget.closest("[data-handle-input]");
      if (inputEl) {
        const targetId = inputEl.getAttribute("data-node-id");
        if (targetId && targetId !== sourceId) {
          onConnect({ source: sourceId, sourceHandle, target: targetId });
        }
      } else {
        const onNode = elTarget && elTarget.closest(".cc-canvas-node");
        if (!onNode) {
          const cx = ev.clientX - rect.left;
          const cy = ev.clientY - rect.top;
          const w = screenToWorld(cx, cy, viewport);
          setQuickAdd({ screenX: cx, screenY: cy, worldX: w.x, worldY: w.y, source: sourceId, sourceHandle });
        }
      }
      setGhostEdge(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onQuickAddSelect = useCallback((typeKey) => {
    if (!quickAdd) return;
    const { worldX, worldY, pendingConnect } = quickAdd;
    setQuickAdd(null);
    onCanvasDrop(
      typeKey,
      worldX - NODE_W / 2,
      worldY - 50,
      pendingConnect ? { source: pendingConnect.sourceId, sourceHandle: pendingConnect.sourceHandle } : null,
    );
  }, [quickAdd, onCanvasDrop]);

  // HTML5 library drop
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const typeKey = e.dataTransfer.getData("application/x-node-type");
    if (!typeKey) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, viewport);
    const resultKind = e.dataTransfer.getData("application/x-result-kind") || undefined;
    onCanvasDrop(typeKey, world.x - NODE_W / 2, world.y - 50, null, resultKind ? { result_kind: resultKind } : undefined);
  }, [viewport, onCanvasDrop]);

  const onMinimapRecenter = useCallback((wx, wy) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setViewport((vp) => ({
      ...vp,
      x: rect.width / 2 - wx * vp.zoom,
      y: rect.height / 2 - wy * vp.zoom,
    }));
  }, []);

  const testTraversedSet = new Set(testTraversedNodes || []);
  const { zoom } = viewport;
  const rect = wrapRef.current?.getBoundingClientRect();

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 overflow-hidden cc-canvas-wrap"
      style={{
        cursor: spaceDown ? "grab" : "default",
        background: isLight ? "#f6f5f1" : "#0d0d11",
        backgroundImage: `radial-gradient(${isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.045)"} 1.2px, transparent 1.3px)`,
        backgroundSize: `${22 * zoom}px ${22 * zoom}px`,
        backgroundPosition: `${((viewport.x % 22) + 22) % 22}px ${((viewport.y % 22) + 22) % 22}px`,
      }}
      onPointerDown={onBgPointerDown}
      onPointerMove={onBgPointerMove}
      onPointerUp={onBgPointerUp}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* World transform — edges + nodes share same transform */}
      <div
        className="absolute"
        style={{
          transform: `translate(${viewport.x}px,${viewport.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: 0, height: 0,
        }}
      >
        {/* Edges BEHIND nodes */}
        <DesignEdges
          nodes={nodes}
          edges={edges}
          isLight={isLight}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={onEdgeClick}
          onDeleteEdge={onEdgeDelete}
          hoverEdgeId={hoverEdgeId}
          setHoverEdgeId={setHoverEdgeId}
          ghostEdge={ghostEdge}
        />

        {/* Nodes */}
        {nodes.map((node) => (
          <DesignNode
            key={node.id}
            node={node}
            isLight={isLight}
            selected={selection.includes(node.id)}
            testActive={testNodeId === node.id}
            testTraversed={testTraversedSet.has(node.id)}
            validation={validation}
            scale={zoom}
            onSelect={(id, shift) => onSelect([id], shift)}
            onMove={onMoveNode}
            onStartConnect={onStartConnect}
            onTitleChange={onTitleCommit}
            onDeleteNode={onNodeDelete}
            onDuplicateNode={onNodeDuplicate}
          />
        ))}
      </div>

      {/* Marquee */}
      {marquee && (
        <div
          className="absolute pointer-events-none border border-sky-400/60"
          style={{
            left: marquee.x, top: marquee.y,
            width: marquee.w, height: marquee.h,
            background: "rgba(14,165,233,0.07)",
            zIndex: 15,
          }}
        />
      )}

      {/* QuickAdd popover */}
      {quickAdd && (
        <DesignQuickAdd
          screenX={quickAdd.screenX}
          screenY={quickAdd.screenY}
          isLight={isLight}
          onSelect={onQuickAddSelect}
          onClose={() => setQuickAdd(null)}
        />
      )}

      {/* Minimap */}
      <DesignMinimap
        nodes={nodes}
        viewport={viewport}
        canvasW={rect?.width || 800}
        canvasH={rect?.height || 600}
        isLight={isLight}
        onRecenter={onMinimapRecenter}
      />

      {/* Zoom controls */}
      <DesignZoomControls
        zoom={zoom}
        isLight={isLight}
        onZoomIn={() => setViewport((pv) => {
          const nz = clamp(pv.zoom * 1.2, CLAMP_MIN, CLAMP_MAX);
          if (!wrapRef.current) return pv;
          const r = wrapRef.current.getBoundingClientRect();
          const cx = r.width / 2; const cy = r.height / 2;
          const wx = (cx - pv.x) / pv.zoom; const wy = (cy - pv.y) / pv.zoom;
          return { x: cx - wx * nz, y: cy - wy * nz, zoom: nz };
        })}
        onZoomOut={() => setViewport((pv) => {
          const nz = clamp(pv.zoom / 1.2, CLAMP_MIN, CLAMP_MAX);
          if (!wrapRef.current) return pv;
          const r = wrapRef.current.getBoundingClientRect();
          const cx = r.width / 2; const cy = r.height / 2;
          const wx = (cx - pv.x) / pv.zoom; const wy = (cy - pv.y) / pv.zoom;
          return { x: cx - wx * nz, y: cy - wy * nz, zoom: nz };
        })}
        onFitView={() => fitView()}
      />
    </div>
  );
}