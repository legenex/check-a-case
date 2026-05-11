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
      trusted_form_cert_url: mergedFields.trusted_form_cert_url || '',
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function interpolateTemplate(template, data) {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? '');
}