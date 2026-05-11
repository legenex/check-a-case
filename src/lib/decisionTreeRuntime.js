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
 * Evaluate a decision_node config. Returns target_node_id string (back-compat signature).
 * New code should use evaluateDecisionNodeFull for side effects and matched path info.
 */
export function evaluateDecisionNode(nodeConfig, fieldValues, tags) {
  return evaluateDecisionNodeFull(nodeConfig, fieldValues, tags).target_node_id;
}

/**
 * Full evaluator. Returns { target_node_id, matched_path_ids, side_effects }.
 *
 * Reads the NEW structured format (paths[]) produced by DecisionNodeEditor.
 * Falls back to legacy rules[] with string condition_expression if paths is empty.
 *
 * Sentinel '__USE_PATH_ELSE_EDGE__' means: look up the outgoing edge with
 * source_handle === 'path-else' in the canvas adjacency map.
 */
export function evaluateDecisionNodeFull(nodeConfig, fieldValues, tags) {
  const paths = Array.isArray(nodeConfig?.paths) ? nodeConfig.paths : [];
  const legacyRules = Array.isArray(nodeConfig?.rules) ? nodeConfig.rules : [];
  const evaluateAll = !!nodeConfig?.evaluate_all_paths;
  const fallthrough = nodeConfig?.fallthrough_on_no_match !== false;
  const applySideEffects = nodeConfig?.apply_side_effects !== false;

  const sideEffects = { tags_to_add: [], tags_to_remove: [], field_assignments: [] };
  const matchedPaths = [];

  // 1) New-format paths[]
  for (const path of paths) {
    if (!path) continue;
    let matched = false;
    try {
      matched = evaluateConditionGroup(path.conditions, fieldValues, tags);
    } catch (err) {
      console.warn('Path evaluation error:', err?.message, 'path', path.path_id);
    }
    if (matched) {
      matchedPaths.push(path);
      if (applySideEffects) {
        if (Array.isArray(path.tags_to_add)) sideEffects.tags_to_add.push(...path.tags_to_add);
        if (Array.isArray(path.tags_to_remove)) sideEffects.tags_to_remove.push(...path.tags_to_remove);
        if (Array.isArray(path.custom_field_assignments)) sideEffects.field_assignments.push(...path.custom_field_assignments);
      }
      if (!evaluateAll) break;
    }
  }

  // 2) Legacy rules[] fallback
  if (paths.length === 0 && legacyRules.length > 0) {
    for (const rule of legacyRules) {
      try {
        if (rule?.condition_expression && legacyEvalExpression(rule.condition_expression, fieldValues, tags)) {
          return { target_node_id: rule.target_node_id || null, matched_path_ids: [], side_effects: sideEffects };
        }
      } catch (err) {
        console.warn('Legacy rule eval error:', err?.message);
      }
    }
    return { target_node_id: nodeConfig?.else_target_node_id || null, matched_path_ids: [], side_effects: sideEffects };
  }

  // 3) Matched
  if (matchedPaths.length > 0) {
    return {
      target_node_id: matchedPaths[0].target_node_id || null,
      matched_path_ids: matchedPaths.map((p) => p.path_id),
      side_effects: sideEffects,
    };
  }

  // 4) No match - sentinel for else edge
  if (fallthrough) {
    return { target_node_id: '__USE_PATH_ELSE_EDGE__', matched_path_ids: [], side_effects: sideEffects };
  }

  return { target_node_id: null, matched_path_ids: [], side_effects: sideEffects };
}

/**
 * Evaluate a ConditionGroup recursively.
 * group: { logic: 'AND' | 'OR', conditions: [Condition | ConditionGroup] }
 */
export function evaluateConditionGroup(group, fieldValues, tags) {
  if (!group || !Array.isArray(group.conditions) || group.conditions.length === 0) return false;
  const logic = group.logic === 'OR' ? 'OR' : 'AND';
  const results = group.conditions.map((item) => {
    if (item && item.logic && Array.isArray(item.conditions)) {
      return evaluateConditionGroup(item, fieldValues, tags);
    }
    return evaluateCondition(item, fieldValues, tags);
  });
  return logic === 'OR' ? results.some(Boolean) : results.every(Boolean);
}

/**
 * Evaluate a single Condition: { field, operator, value } or { field_key, operator, value }.
 */
export function evaluateCondition(c, fieldValues, tags) {
  if (!c) return false;
  const fieldKey = c.field_key || c.field;
  const op = (c.operator || '').toString();
  const value = c.value;

  const tagSet = tags instanceof Set ? tags : new Set(Array.isArray(tags) ? tags : []);
  const fv = fieldValues || {};
  const raw = fieldKey === '__tags' ? Array.from(tagSet) : fv[fieldKey];

  const toNum = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
  const toStr = (v) => (v === null || v === undefined ? '' : String(v));
  const toArr = (v) => (Array.isArray(v) ? v : (v === null || v === undefined ? [] : [v]));

  switch (op) {
    case 'eq': case 'equals': case '==':
      return toStr(raw) === toStr(value);
    case 'ne': case 'not_equals': case '!=':
      return toStr(raw) !== toStr(value);
    case 'gt': case '>':
      return toNum(raw) > toNum(value);
    case 'lt': case '<':
      return toNum(raw) < toNum(value);
    case 'gte': case '>=':
      return toNum(raw) >= toNum(value);
    case 'lte': case '<=':
      return toNum(raw) <= toNum(value);
    case 'in':
      return toArr(value).map(toStr).includes(toStr(raw));
    case 'not_in':
      return !toArr(value).map(toStr).includes(toStr(raw));
    case 'contains':
      return toStr(raw).toLowerCase().includes(toStr(value).toLowerCase());
    case 'not_contains':
      return !toStr(raw).toLowerCase().includes(toStr(value).toLowerCase());
    case 'starts_with':
      return toStr(raw).toLowerCase().startsWith(toStr(value).toLowerCase());
    case 'ends_with':
      return toStr(raw).toLowerCase().endsWith(toStr(value).toLowerCase());
    case 'is_empty':
      if (raw === null || raw === undefined) return true;
      if (Array.isArray(raw)) return raw.length === 0;
      return toStr(raw).trim() === '';
    case 'is_not_empty':
      if (raw === null || raw === undefined) return false;
      if (Array.isArray(raw)) return raw.length > 0;
      return toStr(raw).trim() !== '';
    case 'has_tag':
      return tagSet.has(toStr(value));
    case 'not_has_tag':
      return !tagSet.has(toStr(value));
    case 'matches_regex': {
      try { return new RegExp(toStr(value)).test(toStr(raw)); } catch { return false; }
    }
    default:
      console.warn('Unknown operator:', op);
      return false;
  }
}

/**
 * Legacy string-expression evaluator. Only used as fallback for old rules[] nodes.
 */
function legacyEvalExpression(expr, fieldValues, tags) {
  const FORBIDDEN = ['function', 'Function', 'eval', '__proto__', 'constructor', '=>', '`'];
  if (FORBIDDEN.some((p) => expr.includes(p))) throw new Error('Forbidden expression pattern');
  const tagArr = tags instanceof Set ? Array.from(tags) : (Array.isArray(tags) ? tags : []);
  let processed = expr.replace(/fields\.(\w+)/g, (_, key) => {
    const val = (fieldValues || {})[key];
    if (val === undefined || val === null) return 'null';
    if (typeof val === 'string') return JSON.stringify(val);
    return String(val);
  });
  processed = processed.replace(/tags\.has\((['"])([^'"]+)\1\)/g, (_, _q, tag) =>
    tagArr.includes(tag) ? 'true' : 'false'
  );
  if (!/^[\s\d"'.\w|&!<>=+\-*?:(),[\]]+$/.test(processed)) return false;
  try { return new Function(`"use strict"; return (${processed});`)(); } catch { return false; }
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