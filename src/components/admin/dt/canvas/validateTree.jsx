// validateTree.js — comprehensive validation rules for decision trees
// Rules:
// 1. Empty tree is an error
// 2. Exactly one entry node (zero inbound edges)
// 3. All non-entry nodes must have at least one inbound edge
// 4. Terminal nodes (result, submit, note) need no outbound; others must have at least one
// 5. Tree must form one connected graph reachable from entry

export function detectEntryNode(nodes, edges) {
  const hasInbound = new Set(edges.map((e) => e.target));
  const candidates = nodes.filter((n) => !hasInbound.has(n.id));
  return {
    entryId: candidates.length === 1 ? candidates[0].id : null,
    candidates: candidates.map((n) => n.id),
  };
}

export function validateTree(nodes, edges) {
  const issues = [];
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const hasInbound = new Set(edges.map((e) => e.target));
  const hasOutbound = new Set(edges.map((e) => e.source));

  // Empty tree
  if (nodes.length === 0) {
    issues.push({
      severity: "error",
      code: "EMPTY",
      message: "Tree is empty. Add at least one node.",
      nodeId: null,
    });
    return { issues, entryId: null };
  }

  // Entry detection
  const noInbound = nodes.filter((n) => !hasInbound.has(n.id));
  let entryId = null;
  if (noInbound.length === 0) {
    issues.push({
      severity: "error",
      code: "NO_ENTRY",
      message: "No entry node found. Every tree needs exactly one node with no inbound connections.",
      nodeId: null,
    });
  } else if (noInbound.length > 1) {
    for (const n of noInbound) {
      issues.push({
        severity: "error",
        code: "MULTIPLE_ENTRIES",
        message: `Multiple entry points detected. "${n.label || n.id}" has no inbound connection. Connect it or delete it.`,
        nodeId: n.id,
      });
    }
  } else {
    entryId = noInbound[0].id;
  }

  // Terminal types: no outbound required
  const TERMINAL_TYPES = new Set(["results_page", "form", "text_block"]);

  // Per-node checks
  for (const n of nodes) {
    if (n.id === entryId) continue; // entry node is exempt from "needs inbound"

    if (!hasInbound.has(n.id)) {
      issues.push({
        severity: "error",
        code: "DISCONNECTED",
        message: `"${n.label || n.id}" has no inbound connection. Connect it to the flow or delete it.`,
        nodeId: n.id,
      });
    }

    if (!TERMINAL_TYPES.has(n.node_type) && !hasOutbound.has(n.id)) {
      issues.push({
        severity: "warning",
        code: "DEAD_END",
        message: `"${n.label || n.id}" has no outbound connection. The flow ends here without a Result.`,
        nodeId: n.id,
      });
    }
  }

  // Reachability from entry (BFS)
  if (entryId) {
    const reached = new Set([entryId]);
    const queue = [entryId];
    while (queue.length) {
      const cur = queue.shift();
      for (const e of edges) {
        if (e.source === cur && !reached.has(e.target)) {
          reached.add(e.target);
          queue.push(e.target);
        }
      }
    }
    for (const n of nodes) {
      if (!reached.has(n.id)) {
        issues.push({
          severity: "error",
          code: "UNREACHABLE",
          message: `"${n.label || n.id}" is not reachable from the entry node.`,
          nodeId: n.id,
        });
      }
    }
  }

  // Cycle detection (DFS back-edge)
  const adj = {};
  for (const e of edges) {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
  }
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};
  for (const n of nodes) color[n.id] = WHITE;
  const cycleNodes = new Set();
  function dfs(u) {
    color[u] = GRAY;
    for (const v of (adj[u] || [])) {
      if (color[v] === GRAY) {
        cycleNodes.add(v);
      } else if (color[v] === WHITE) {
        dfs(v);
      }
    }
    color[u] = BLACK;
  }
  for (const n of nodes) {
    if (color[n.id] === WHITE) dfs(n.id);
  }
  for (const id of cycleNodes) {
    issues.push({
      severity: "warning",
      code: "CYCLE",
      message: `"${nodeMap[id]?.label || id}" is part of a loop. Flow may not terminate.`,
      nodeId: id,
    });
  }

  return { issues, entryId };
}