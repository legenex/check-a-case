import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { runId, nodeId } = await req.json();

    const runs = await base44.asServiceRole.entities.DecisionTreeRun.filter({ id: runId });
    const run = runs[0];
    if (!run) return Response.json({ error: 'Run not found' }, { status: 404 });

    const nodes = await base44.asServiceRole.entities.Question.filter({ id: nodeId });
    const node = nodes[0];
    if (!node) return Response.json({ error: 'Node not found' }, { status: 404 });

    const config = node.config || {};
    const fieldValues = run.field_values || {};

    const recipient = interpolate(config.recipient_template || '{email}', fieldValues);
    const subject = interpolate(config.template_subject || 'Message from Check A Case', fieldValues);
    const body = interpolate(config.template_body || '', fieldValues);

    let success = false;
    let errorMsg = null;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient,
        subject,
        body,
      });
      success = true;
    } catch (err) {
      errorMsg = err.message;
    }

    await logNotification(base44, runId, 'email', recipient, success ? 'sent' : 'failed', errorMsg);

    return Response.json({ success, error: errorMsg });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function interpolate(str, data) {
  return str.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? '');
}

async function logNotification(base44, runId, channel, recipient, status, error_message) {
  try {
    const runs = await base44.asServiceRole.entities.DecisionTreeRun.filter({ id: runId });
    const run = runs[0];
    if (!run) return;
    const log = run.notifications_log || [];
    log.push({ channel, recipient, status, error_message, sent_at: new Date().toISOString() });
    await base44.asServiceRole.entities.DecisionTreeRun.update(runId, { notifications_log: log });
  } catch (_) {}
}