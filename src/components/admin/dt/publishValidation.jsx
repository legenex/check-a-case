/**
 * Runs pre-publish validation on the decision tree.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateTree(quiz, questions, edges) {
  const errors = [];

  // 1. At least one start_page
  const startNodes = questions.filter((q) => q.node_type === "start_page");
  if (startNodes.length === 0) errors.push("No start_page node found. Add a Start Page.");
  if (startNodes.length > 1) errors.push(`Multiple start_page nodes found (${startNodes.length}). Keep exactly one.`);

  const nodeIds = new Set(questions.map((q) => q.node_id));

  // 3. Reachability check (BFS from start)
  if (startNodes.length === 1) {
    const startId = startNodes[0].node_id;
    const adj = {};
    for (const q of questions) adj[q.node_id] = [];
    for (const e of edges) {
      if (adj[e.source_node_id]) adj[e.source_node_id].push(e.target_node_id);
    }
    const visited = new Set();
    const queue = [startId];
    while (queue.length) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const next of (adj[cur] || [])) queue.push(next);
    }
    const unreachable = questions.filter((q) => !visited.has(q.node_id));
    if (unreachable.length > 0) {
      errors.push(`${unreachable.length} unreachable node(s): ${unreachable.map((n) => n.label || n.node_type).join(", ")}`);
    }
  }

  // 4. Decision nodes need 2+ rules and else_target
  const decisionNodes = questions.filter((q) => q.node_type === "decision_node");
  for (const dn of decisionNodes) {
    const rules = dn.config?.rules || [];
    if (rules.length < 2) errors.push(`Decision node "${dn.label || dn.node_id}" needs at least 2 rules.`);
    if (!dn.config?.else_target_node_id) errors.push(`Decision node "${dn.label || dn.node_id}" missing an else target.`);
  }

  // 5. Non-terminal nodes need at least one outgoing edge.
  //    Answer-bearing nodes must have EITHER a per-answer edge OR a default edge.
  const ANSWER_TYPES = new Set(["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"]);
  const terminalTypes = new Set(["results_page"]);

  // Build outgoing edge map: nodeId -> edges[]
  const outgoingEdges = {};
  for (const e of edges) {
    if (!outgoingEdges[e.source_node_id]) outgoingEdges[e.source_node_id] = [];
    outgoingEdges[e.source_node_id].push(e);
  }

  for (const q of questions) {
    if (terminalTypes.has(q.node_type)) continue;

    const nodeEdges = outgoingEdges[q.node_id] || [];

    if (ANSWER_TYPES.has(q.node_type)) {
      // Must have either a per-answer edge or a default edge
      const hasDefault = nodeEdges.some((e) => !e.source_handle || e.source_handle === "default");
      const hasAnyAnswerEdge = nodeEdges.some((e) => e.source_handle && e.source_handle !== "default");
      if (!hasDefault && !hasAnyAnswerEdge) {
        errors.push(
          `Node "${q.label || q.node_type}" has answers but no routing. Connect each answer to its next step, or add a default fallback connection.`
        );
      }
    } else {
      if (nodeEdges.length === 0) {
        errors.push(`Node "${q.label || q.node_type}" has no outgoing edge.`);
      }
    }
  }

  // 9. Webhook nodes need a URL
  const webhooks = questions.filter((q) => q.node_type === "webhook_api");
  for (const w of webhooks) {
    if (!w.config?.url) errors.push(`Webhook node "${w.label || w.node_id}" has no URL.`);
  }

  // 10. Notification nodes need recipient + body
  const notifTypes = ["notification_sms","notification_email","notification_whatsapp","notification_messenger","notification_telegram"];
  const notifs = questions.filter((q) => notifTypes.includes(q.node_type));
  for (const n of notifs) {
    if (!n.config?.recipient_template) errors.push(`Notification node "${n.label || n.node_type}" missing recipient.`);
    if (!n.config?.template_body) errors.push(`Notification node "${n.label || n.node_type}" missing message body.`);
  }

  return { valid: errors.length === 0, errors };
}