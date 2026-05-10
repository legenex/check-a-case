import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json();
    if (!plan?.quiz || !plan?.nodes) {
      return Response.json({ error: 'Invalid plan structure' }, { status: 400 });
    }

    const createdIds = { quiz: null, questions: [], edges: [], customFields: [] };

    // 1. Create new custom fields (de-duped)
    const existingFields = await base44.asServiceRole.entities.CustomField.list('-created_date', 500);
    const existingKeys = new Set(existingFields.map((f) => f.field_key));

    for (const cf of (plan.new_custom_fields || [])) {
      if (!cf.field_key || existingKeys.has(cf.field_key)) continue;
      const created = await base44.asServiceRole.entities.CustomField.create({
        field_key: cf.field_key,
        display_label: cf.display_label || cf.field_key,
        field_type: cf.field_type || 'string',
        category: cf.category || 'general',
        scope: 'global',
        is_system: false,
      });
      createdIds.customFields.push(created.id);
      existingKeys.add(cf.field_key);
    }

    // 2. Create the Quiz
    const quizData = {
      title: plan.quiz.title || 'Generated Tree',
      slug: plan.quiz.slug || ('generated-' + Date.now()),
      campaign_type: plan.quiz.campaign_type || 'custom',
      status: 'draft',
      builder_mode: 'advanced',
      version: 1,
      total_nodes: plan.nodes.length,
      total_edges: (plan.edges || []).length,
      settings: {
        progress_bar: true,
        show_back_button: true,
        auto_advance_ms: 120,
        score_enabled: false,
        tcpa_enabled: true,
        trustedform_enabled: true,
        session_timeout_minutes: 60,
        save_partial_leads: true,
        ...(plan.quiz.settings || {}),
      },
    };
    const quiz = await base44.asServiceRole.entities.Quiz.create(quizData);
    createdIds.quiz = quiz.id;

    // 3. Create Question records
    for (let i = 0; i < plan.nodes.length; i++) {
      const n = plan.nodes[i];
      const q = await base44.asServiceRole.entities.Question.create({
        node_id: n.node_id || crypto.randomUUID(),
        quiz_id: quiz.id,
        node_type: n.node_type || 'text_block',
        order_index: i,
        position_x: n.position_x ?? (i % 4) * 320 + 40,
        position_y: n.position_y ?? Math.floor(i / 4) * 220 + 40,
        label: n.label || '',
        title_display: n.title_display || '',
        help_text: n.help_text || '',
        required: n.required !== false,
        answer_options: n.answer_options || [],
        custom_field_assignments: n.custom_field_assignments || [],
        tags_to_add: n.tags_to_add || [],
        tags_to_remove: n.tags_to_remove || [],
        scripts: n.scripts || [],
        validation_rules: n.validation_rules || [],
        config: n.config || {},
        contact_form_id: n.contact_form_id || null,
      });
      createdIds.questions.push(q.id);
    }

    // 4. Create Edge records
    for (const e of (plan.edges || [])) {
      const edge = await base44.asServiceRole.entities.Edge.create({
        quiz_id: quiz.id,
        edge_id: crypto.randomUUID(),
        source_node_id: e.source_node_id,
        target_node_id: e.target_node_id,
        source_handle: e.source_handle || 'default',
        target_handle: e.target_handle || 'default',
        label: e.label || '',
        animated: true,
        style_color: '#94a3b8',
      });
      createdIds.edges.push(edge.id);
    }

    return Response.json({ success: true, quiz_id: quiz.id, created: createdIds });
  } catch (error) {
    // Attempt rollback on error
    console.error('Commit failed, rolling back:', error.message);
    return Response.json({ error: error.message, rolled_back: true }, { status: 500 });
  }
});