import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { runId, nodeId, phone, code } = await req.json();

    const creds = await getTwilioCreds(base44);
    if (!creds) {
      return Response.json({ error: 'Twilio not configured', configured: false });
    }

    const nodes = await base44.asServiceRole.entities.Question.filter({ id: nodeId });
    const node = nodes[0];
    const config = node?.config || {};
    const verifyServiceSid = creds.verify_service_sid || Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

    const twilioRes = await fetch(
      `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${creds.account_sid}:${creds.auth_token}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: formattedPhone, Code: code }),
      }
    );

    const result = await twilioRes.json();
    const approved = result.status === 'approved';

    if (approved && runId) {
      const runs = await base44.asServiceRole.entities.DecisionTreeRun.filter({ id: runId });
      const run = runs[0];
      if (run) {
        await base44.asServiceRole.entities.DecisionTreeRun.update(runId, {
          field_values: {
            ...(run.field_values || {}),
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
          },
        });
      }
    }

    return Response.json({
      approved,
      status: result.status,
      next_node_id: approved
        ? (config.success_target_node_id || null)
        : (config.failure_target_node_id || null),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getTwilioCreds(base44) {
  try {
    const integrations = await base44.asServiceRole.entities.IntegrationCredential.filter({
      integration_type: 'twilio', enabled: true,
    });
    if (!integrations[0]) return null;
    return JSON.parse(integrations[0].credentials_json || '{}');
  } catch {
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!sid || !token) return null;
    return { account_sid: sid, auth_token: token };
  }
}