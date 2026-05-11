import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { runId, nodeId, fieldValues, sessionId } = body;

    // Load run + node
    const runs = await base44.asServiceRole.entities.DecisionTreeRun.filter({ id: runId });
    const run = runs[0];
    if (!run) return Response.json({ error: 'Run not found' }, { status: 404 });

    const nodes = await base44.asServiceRole.entities.Question.filter({ id: nodeId });
    const node = nodes[0];
    if (!node) return Response.json({ error: 'Node not found' }, { status: 404 });

    // Load ContactForm
    let contactForm = null;
    if (node.contact_form_id) {
      const forms = await base44.asServiceRole.entities.ContactForm.filter({ id: node.contact_form_id });
      contactForm = forms[0] || null;
    }

    // Merge field values into run
    const mergedFields = { ...(run.field_values || {}), ...fieldValues };

    // ── TrustedForm: Retain existing cert or log missing ──────────────────────
    let trustedFormCertUrl = mergedFields.trusted_form_cert_url || '';

    if (trustedFormCertUrl) {
      // Retain the cert via TrustedForm API
      try {
        const tfConfigs = await base44.asServiceRole.entities.IntegrationConfig.filter({ type: 'trusted_form' });
        const tfConfig = tfConfigs.find((c) => c.enabled);
        const tfApiKey = tfConfig?.credentials?.api_key;
        const tfAccountId = tfConfig?.credentials?.account_id;

        if (tfApiKey && tfAccountId) {
          // Extract the cert token from the URL (last path segment)
          const certToken = trustedFormCertUrl.split('/').pop();
          const retainUrl = `https://api.trustedform.com/trustedform/certs/${certToken}`;

          const retainRes = await fetch(retainUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${tfAccountId}:${tfApiKey}`),
              'Content-Type': 'application/json',
              'Api-Version': '4.0',
            },
            body: JSON.stringify({
              retain: { reference: mergedFields.email || mergedFields.phone || runId },
            }),
          });

          if (retainRes.ok) {
            const retainData = await retainRes.json();
            // Use the retained cert URL if returned
            trustedFormCertUrl = retainData?.cert?.retain_for || trustedFormCertUrl;
            console.log('TrustedForm cert retained:', trustedFormCertUrl);
          } else {
            const errText = await retainRes.text();
            console.warn('TrustedForm retain failed:', retainRes.status, errText);
          }
        } else {
          console.warn('TrustedForm enabled but API key/account ID not configured. Cert URL saved as-is.');
        }
      } catch (err) {
        console.error('TrustedForm retain error:', err.message);
        // Non-fatal: still save the cert URL we have
      }
    } else {
      // No cert URL — TrustedForm certs are browser-generated so we cannot create one server-side.
      // Log a warning so the issue is visible in function logs.
      console.warn('TrustedForm cert URL missing for lead. Ensure the TrustedForm script is loaded on the form page.');
    }

    // ── HLR Lookup: validate phone number (non-blocking — lead always captured) ─
    let hlrResult = null;
    const phone = mergedFields.phone || mergedFields.phone_number || '';

    if (phone) {
      try {
        const hlrConfigs = await base44.asServiceRole.entities.IntegrationConfig.filter({ type: 'hlr_lookup' });
        const hlrConfig = hlrConfigs.find((c) => c.enabled);
        const hlrApiKey = hlrConfig?.credentials?.api_key;
        const hlrProvider = hlrConfig?.credentials?.provider || '';
        const hlrEndpoint = hlrConfig?.credentials?.endpoint || '';

        if (hlrApiKey && hlrEndpoint) {
          // Normalize phone: strip non-digits, ensure leading +
          const normalizedPhone = phone.replace(/\D/g, '');
          const e164Phone = normalizedPhone.startsWith('1') ? `+${normalizedPhone}` : `+1${normalizedPhone}`;

          const hlrRes = await Promise.race([
            fetch(`${hlrEndpoint.replace(/\/$/, '')}?number=${encodeURIComponent(e164Phone)}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${hlrApiKey}`,
                'Content-Type': 'application/json',
              },
            }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('HLR timeout')), 8000)),
          ]);

          if (hlrRes.ok) {
            hlrResult = await hlrRes.json();
            console.log('HLR result:', JSON.stringify(hlrResult));
          } else {
            const errText = await hlrRes.text();
            console.warn('HLR lookup failed:', hlrRes.status, errText);
            hlrResult = { error: `HTTP ${hlrRes.status}`, raw: errText.slice(0, 200) };
          }
        } else if (hlrConfig) {
          console.warn('HLR integration enabled but endpoint/api_key not configured.');
        }
        // If no HLR config at all, silently skip
      } catch (err) {
        console.error('HLR lookup error:', err.message);
        hlrResult = { error: err.message };
        // Non-fatal: lead is still captured
      }
    }

    // Create Lead record
    const lead = await base44.asServiceRole.entities.Lead.create({
      quiz_id: run.quiz_id,
      run_id: runId,
      session_id: sessionId || run.session_id,
      first_name: mergedFields.first_name || '',
      last_name: mergedFields.last_name || '',
      email: mergedFields.email || '',
      phone: mergedFields.phone || '',
      zip_code: mergedFields.zip_code || '',
      state: mergedFields.state || mergedFields.accident_state || '',
      field_values: mergedFields,
      trusted_form_cert_url: trustedFormCertUrl,
      hlr_result: hlrResult,
      status: 'new',
      qualification_tier: run.qualification_tier || null,
      utm_source: run.utm_source || mergedFields.utm_source || '',
      utm_medium: run.utm_medium || mergedFields.utm_medium || '',
      utm_campaign: run.utm_campaign || mergedFields.utm_campaign || '',
      brand_id: run.brand_id || '',
      created_at: new Date().toISOString(),
    });

    // Update run with contact info + lead_id
    await base44.asServiceRole.entities.DecisionTreeRun.update(runId, {
      field_values: mergedFields,
      last_activity_at: new Date().toISOString(),
    });

    // Fire ContactForm webhook if configured
    if (contactForm?.submit_webhook_url) {
      try {
        const body = interpolateTemplate(
          JSON.stringify({ field_values: mergedFields, form_id: node.contact_form_id, lead_id: lead.id }),
          { ...mergedFields, lead_id: lead.id, form_id: node.contact_form_id }
        );
        await Promise.race([
          fetch(contactForm.submit_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('Webhook timeout')), 10000)),
        ]);
      } catch (err) {
        console.error('Webhook failed:', err.message);
      }
    }

    return Response.json({
      success: true,
      lead_id: lead.id,
      next_node_id: node.config?.on_success_target_node_id || null,
      hlr_result: hlrResult,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function interpolateTemplate(template, data) {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? '');
}