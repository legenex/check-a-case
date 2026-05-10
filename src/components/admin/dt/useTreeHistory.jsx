import { useRef, useState, useCallback } from "react";

const MAX_HISTORY = 50;

export function useTreeHistory(initialNodes, initialEdges) {
  const past = useRef([]);
  const future = useRef([]);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const pushHistory = useCallback((curNodes, curEdges) => {
    past.current.push({ nodes: curNodes, edges: curEdges });
    if (past.current.length > MAX_HISTORY) past.current.shift();
    future.current = [];
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const prev = past.current.pop();
    future.current.push({ nodes, edges });
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }, [nodes, edges]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop();
    past.current.push({ nodes, edges });
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [nodes, edges]);

  return { nodes, edges, setNodes, setEdges, pushHistory, undo, redo };
}