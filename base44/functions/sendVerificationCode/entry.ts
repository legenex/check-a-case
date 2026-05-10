import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { runId, nodeId, phone } = await req.json();

    // Load Twilio credentials
    const creds = await getTwilioCreds(base44);
    if (!creds) {
      return Response.json({ error: 'Twilio not configured. Contact support.', configured: false }, { status: 200 });
    }

    const nodes = await base44.asServiceRole.entities.Question.filter({ id: nodeId });
    const node = nodes[0];
    const verifyServiceSid = creds.verify_service_sid || Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!verifyServiceSid) {
      return Response.json({ error: 'Twilio Verify Service SID not configured', configured: false }, { status: 200 });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;

    const twilioRes = await fetch(
      `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${creds.account_sid}:${creds.auth_token}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: formattedPhone, Channel: 'sms' }),
      }
    );

    const result = await twilioRes.json();

    if (!twilioRes.ok) {
      return Response.json({ error: result.message || 'Failed to send code', configured: true }, { status: 200 });
    }

    return Response.json({ success: true, status: result.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getTwilioCreds(base44) {
  try {
    const integrations = await base44.asServiceRole.entities.IntegrationCredential.filter({
      integration_type: 'twilio',
      enabled: true,
    });
    if (!integrations[0]) return null;
    const cred = integrations[0];
    const parsed = JSON.parse(cred.credentials_json || '{}');
    return parsed;
  } catch {
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!sid || !token) return null;
    return { account_sid: sid, auth_token: token };
  }
}