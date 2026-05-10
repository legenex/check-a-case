import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { runId, nodeId, testMode, sampleData } = body;

    // Load node
    const nodes = await base44.asServiceRole.entities.Question.filter({ id: nodeId });
    const node = nodes[0];
    if (!node) return Response.json({ error: 'Node not found' }, { status: 404 });

    const config = node.config || {};

    // Load field values
    let fieldValues = sampleData || {};
    if (!testMode && runId) {
      const runs = await base44.asServiceRole.entities.DecisionTreeRun.filter({ id: runId });
      const run = runs[0];
      if (run) fieldValues = run.field_values || {};
    }

    // Interpolate body template
    const bodyStr = config.body_template
      ? interpolate(config.body_template, fieldValues)
      : JSON.stringify(fieldValues);

    // Build headers
    const headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };

    const method = config.method || 'POST';
    const url = config.url;
    if (!url) return Response.json({ error: 'No webhook URL configured' }, { status: 400 });

    const timeoutMs = config.timeout_ms || 10000;

    let responseData = null;
    let responseStatus = null;
    let success = false;

    try {
      const fetchOpts = {
        method,
        headers,
        ...(method !== 'GET' ? { body: bodyStr } : {}),
      };
      const result = await Promise.race([
        fetch(url, fetchOpts),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), timeoutMs)),
      ]);
      responseStatus = result.status;
      const text = await result.text();
      try { responseData = JSON.parse(text); } catch { responseData = { raw: text }; }
      success = result.status >= 200 && result.status < 300;
    } catch (err) {
      if (!testMode && runId) {
        await appendError(base44, runId, nodeId, err.message);
      }
      return Response.json({
        success: false,
        error: err.message,
        next_node_id: config.failure_target_node_id || null,
      });
    }

    if (!testMode && success && runId && config.response_field_mapping?.length) {
      // Map response fields to run field_values
      const runs = await base44.asServiceRole.entities.DecisionTreeRun.filter({ id: runId });
      const run = runs[0];
      if (run) {
        const updated = { ...(run.field_values || {}) };
        for (const mapping of config.response_field_mapping) {
          const val = getPath(responseData, mapping.response_path);
          if (val !== undefined && mapping.target_custom_field_id) {
            updated[mapping.target_custom_field_id] = val;
          }
        }
        await base44.asServiceRole.entities.DecisionTreeRun.update(runId, { field_values: updated });
      }
    }

    return Response.json({
      success,
      status: responseStatus,
      response: responseData,
      request_body: testMode ? bodyStr : undefined,
      request_url: testMode ? url : undefined,
      next_node_id: success
        ? (config.success_target_node_id || null)
        : (config.failure_target_node_id || null),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function interpolate(str, data) {
  return str.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? '');
}

function getPath(obj, path) {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

async function appendError(base44, runId, nodeId, message) {
  try {
    const runs = await base44.asServiceRole.entities.DecisionTreeRun.filter({ id: runId });
    const run = runs[0];
    if (!run) return;
    const errors = run.errors || [];
    errors.push({ node_id: nodeId, error_message: message, occurred_at: new Date().toISOString() });
    await base44.asServiceRole.entities.DecisionTreeRun.update(runId, { errors });
  } catch (_) {}
}