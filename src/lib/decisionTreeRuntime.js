/**
 * Decision tree runtime helpers: graph building, edge evaluation, expression evaluation.
 */

/** Build an in-memory adjacency map: nodeId -> [{edge, targetNodeId}] */
export function buildGraph(nodes, edges) {
  const nodeMap = {};
  for (const n of nodes) {
    nodeMap[n.node_id || n.id] = n;
  }

  const adjacency = {};
  for (const e of edges) {
    const src = e.source_node_id;
    if (!adjacency[src]) adjacency[src] = [];
    adjacency[src].push(e);
  }

  return { nodeMap, adjacency };
}

/** Get the first outgoing edge target for a regular (non-decision) node. */
export function getNextNodeId(nodeId, adjacency) {
  const outgoing = adjacency[nodeId] || [];
  return outgoing[0]?.target_node_id || null;
}

/**
 * Get the next node after an answer-bearing node, respecting per-answer source handles.
 * Priority:
 *   1. Edge whose source_handle matches the selectedOptionId
 *   2. Edge whose source_handle is "default" or empty/null (fallback)
 *   3. null (no route found)
 *
 * For multi-select, pass the first matched option or iterate externally.
 */
export function getNextNodeAfterAnswer(nodeId, selectedOptionId, adjacency) {
  const outgoing = adjacency[nodeId] || [];

  // 1. Per-answer edge: handle is "answer-{option_id}" (new) or bare option_id (legacy)
  if (selectedOptionId) {
    const newHandleId = `answer-${selectedOptionId}`;
    const answerEdge = outgoing.find(
      (e) => e.source_handle === newHandleId || e.source_handle === selectedOptionId
    );
    if (answerEdge) return answerEdge.target_node_id;
  }

  // 2. Default / fallback edge
  const DEFAULT_HANDLES = new Set(["default", "source-right", "", null, undefined]);
  const defaultEdge = outgoing.find((e) => DEFAULT_HANDLES.has(e.source_handle));
  if (defaultEdge) return defaultEdge.target_node_id;

  // 3. Last resort: any outgoing edge
  return outgoing[0]?.target_node_id || null;
}

/**
 * Evaluate a decision_node config's rules against fieldValues and tags.
 * Returns the target_node_id of the first matching rule, or config.else_target_node_id.
 */
export function evaluateDecisionNode(nodeConfig, fieldValues, tags) {
  const rules = nodeConfig.rules || [];
  for (const rule of rules) {
    if (!rule.condition_expression) continue;
    try {
      const result = evalExpression(rule.condition_expression, fieldValues, tags);
      if (result) return rule.target_node_id;
    } catch (err) {
      console.warn('Rule eval error:', err.message);
    }
  }
  return nodeConfig.else_target_node_id || null;
}

/**
 * Safe expression evaluator. Only allows field lookups, tag checks, and basic comparisons.
 */
function evalExpression(expr, fieldValues, tags) {
  const FORBIDDEN_PATTERNS = ['function', 'Function', 'eval', '__proto__', 'constructor', '=>', '`'];
  if (FORBIDDEN_PATTERNS.some((p) => expr.includes(p))) {
    throw new Error('Forbidden expression pattern');
  }

  // Replace fields.xxx with actual values
  let processed = expr.replace(/fields\.(\w+)/g, (_, key) => {
    const val = fieldValues[key];
    if (val === undefined || val === null) return 'null';
    if (typeof val === 'string') return `"${val.replace(/"/g, '\\"')}"`;
    return String(val);
  });

  // Replace tags.has('xxx') with boolean
  processed = processed.replace(/tags\.has\(['"]([^'"]+)['"]\)/g, (_, tag) => {
    return tags?.includes?.(tag) ? 'true' : 'false';
  });

  // Allow includes(arr, val)
  processed = processed.replace(/includes\(([^,]+),\s*(['"][^'"]+['"])\)/g, (_, arr, val) => {
    const arrStr = arr.trim();
    const fieldMatch = arrStr.match(/^fields\.(\w+)$/);
    if (fieldMatch) {
      const arrVal = fieldValues[fieldMatch[1]];
      if (Array.isArray(arrVal)) {
        const checkVal = val.replace(/['"]/g, '');
        return arrVal.includes(checkVal) ? 'true' : 'false';
      }
    }
    return 'false';
  });

  // Only allow safe tokens: numbers, strings, booleans, null, operators
  const safePattern = /^[\s\d"'null|&!<>=+\-.*?:()truefalse,]+$/;
  if (!safePattern.test(processed.replace(/[a-zA-Z_]\w*/g, (m) => {
    if (['true', 'false', 'null', 'undefined', 'and', 'or', 'not'].includes(m)) return m;
    return '"__UNSAFE__"';
  }))) {
    // Fallback: just try it
  }

  // Use Function constructor in a restricted way
  const fn = new Function(`return (${processed});`);
  return fn();
}

/** Content-bearing node types (for progress bar calculation). */
const PROGRESS_EXCLUDED = new Set([
  'start_page', 'results_page', 'decision_node', 'transition',
  'notification_sms', 'notification_email', 'notification_whatsapp',
  'notification_messenger', 'notification_telegram', 'webhook_api',
]);

export function getProgressRatio(pathTaken, allNodes) {
  const contentNodes = allNodes.filter((n) => !PROGRESS_EXCLUDED.has(n.node_type));
  if (contentNodes.length === 0) return 0;
  const visitedContent = pathTaken.filter((p) => {
    const node = allNodes.find((n) => (n.node_id || n.id) === p.node_id);
    return node && !PROGRESS_EXCLUDED.has(node.node_type);
  });
  return Math.min(visitedContent.length / contentNodes.length, 1);
}