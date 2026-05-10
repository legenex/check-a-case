import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `You are a senior decision-tree architect for legal lead generation. Output ONLY valid JSON matching this schema exactly:

{
  "quiz": {
    "title": "string",
    "slug": "string (kebab-case)",
    "campaign_type": "mva|mass_tort|workers_comp|slip_and_fall|med_mal|custom",
    "settings": {}
  },
  "nodes": [
    { "node_id": "uuid", "node_type": "start_page|single_select|multiple_choice|checkbox_multi_select|dropdown|text_field|text_block|information|slider|address|date_picker|datetime_picker|decision_node|form|transition|notification_sms|notification_email|notification_whatsapp|notification_messenger|notification_telegram|phone_verification|webhook_api|results_page", "label": "string", "title_display": "string", "position_x": 0, "position_y": 0, "answer_options": [], "custom_field_assignments": [], "tags_to_add": [], "config": {} }
  ],
  "edges": [
    { "source_node_id": "uuid", "target_node_id": "uuid", "source_handle": "default", "label": "" }
  ],
  "new_custom_fields": [
    { "field_key": "snake_case", "display_label": "string", "field_type": "string|email|phone|enum|boolean|number|date", "category": "string" }
  ]
}

CONVERSION PRINCIPLES:
- Open with a low-friction visual question (not state, not date).
- Front-load high-converting questions (incident type, fault, injury). Defer date, address to later.
- Place lead-capture form at step 5-7 of a 10-12 step tree.
- Branch DQ paths early. If a key disqualifier is hit, route to soft-DQ or hard-DQ results page before the form.
- single_select with auto-advance is fastest. Use for binary and 3-option questions.
- Reserve text_field and address for the form node.
- For MVA: incident_date, accident_state, at_fault, injury_severity, received_treatment, has_attorney are mandatory.

CUSTOM FIELDS: Never duplicate an existing field. Reuse existing field_key for matching fields.

Output ONLY the JSON object. No markdown fences, no commentary.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { inputs, refinement } = await req.json();

    // Load existing custom fields for context
    const customFields = await base44.asServiceRole.entities.CustomField.list('-created_date', 500);
    const fieldsList = customFields.map((f) => `${f.field_key} (${f.display_label}, ${f.field_type})`).join('\n');

    const prompt = `${SYSTEM_PROMPT}

EXISTING CUSTOM FIELDS (DO NOT DUPLICATE):
${fieldsList}

USER INPUTS:
Campaign Type: ${inputs.campaign_type}
Niche / Sub-vertical: ${inputs.niche || 'General'}
Brand Voice: ${inputs.brand_voice}
Tone Goals: ${(inputs.tone_goals || []).join(', ')}
Qualification Path: ${inputs.qualification_path}
Required Custom Fields: ${(inputs.required_fields || []).join(', ')}
Optional Context: ${inputs.context || 'None'}
${refinement ? `Refinement instruction: ${refinement}` : ''}

Generate a complete decision tree JSON for the above inputs.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          quiz: { type: 'object' },
          nodes: { type: 'array', items: { type: 'object' } },
          edges: { type: 'array', items: { type: 'object' } },
          new_custom_fields: { type: 'array', items: { type: 'object' } },
        },
        required: ['quiz', 'nodes', 'edges', 'new_custom_fields'],
      },
    });

    // Ensure all nodes have UUIDs
    const plan = result;
    const idMap = {};
    plan.nodes = (plan.nodes || []).map((n) => {
      const newId = n.node_id && n.node_id.length > 10 ? n.node_id : crypto.randomUUID();
      idMap[n.node_id] = newId;
      return { ...n, node_id: newId };
    });
    plan.edges = (plan.edges || []).map((e) => ({
      ...e,
      source_node_id: idMap[e.source_node_id] || e.source_node_id,
      target_node_id: idMap[e.target_node_id] || e.target_node_id,
    }));

    return Response.json({ success: true, plan });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});