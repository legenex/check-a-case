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

    const recipient = interpolate(config.recipient_template || '{phone}', fieldValues);
    const body = interpolate(config.template_body || '', fieldValues);

    const creds = await getTwilioCreds(base44);
    if (!creds) {
      await logNotification(base44, runId, 'sms', recipient, 'failed', 'Twilio not configured');
      return Response.json({ success: false, error: 'Twilio not configured' });
    }

    const formattedPhone = recipient.startsWith('+') ? recipient : `+1${recipient.replace(/\D/g, '')}`;

    const twilioRes = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + creds.account_sid + '/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${creds.account_sid}:${creds.auth_token}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: formattedPhone, From: creds.from_number || '', Body: body }),
    });

    const result = await twilioRes.json();
    const success = twilioRes.ok;

    await logNotification(base44, runId, 'sms', formattedPhone, success ? 'sent' : 'failed', result.message);

    return Response.json({ success, sid: result.sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function interpolate(str, data) {
  return str.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? '');
}

async function getTwilioCreds(base44) {
  try {
    const list = await base44.asServiceRole.entities.IntegrationCredential.filter({ integration_type: 'twilio', enabled: true });
    if (!list[0]) return null;
    return JSON.parse(list[0].credentials_json || '{}');
  } catch { return null; }
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