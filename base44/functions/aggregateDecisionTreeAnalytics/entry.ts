import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const quizIdFilter = body.quiz_id || null;
    const isBackfill = body.backfill === true;

    // Find runs to process
    let runs = [];
    if (quizIdFilter) {
      runs = await base44.asServiceRole.entities.DecisionTreeRun.filter({ quiz_id: quizIdFilter }, '-last_activity_at', 5000);
    } else if (isBackfill) {
      runs = await base44.asServiceRole.entities.DecisionTreeRun.list('-last_activity_at', 5000);
    } else {
      // Last hour only
      const cutoff = new Date(Date.now() - 65 * 60 * 1000).toISOString();
      runs = await base44.asServiceRole.entities.DecisionTreeRun.list('-last_activity_at', 2000);
      runs = runs.filter(r => r.last_activity_at && r.last_activity_at > cutoff);
    }

    if (runs.length === 0) {
      return Response.json({ success: true, processed: 0, message: 'No runs to process' });
    }

    // Load existing analytics rows for affected quiz+node+date combos
    const analyticsCache = {};
    const getKey = (quizId, nodeId, date) => `${quizId}||${nodeId}||${date}`;

    const toDateStr = (isoStr) => {
      if (!isoStr) return null;
      return isoStr.slice(0, 10);
    };

    let processed = 0;
    const pendingUpdates = {};

    for (const run of runs) {
      if (!run.path_taken || !run.quiz_id) continue;
      const path = run.path_taken;
      const version = run.version_at_run || 1;

      for (let i = 0; i < path.length; i++) {
        const step = path[i];
        if (!step.node_id || !step.entered_at) continue;

        const date = toDateStr(step.entered_at);
        if (!date) continue;

        const key = getKey(run.quiz_id, step.node_id, date);
        if (!pendingUpdates[key]) {
          pendingUpdates[key] = {
            quiz_id: run.quiz_id,
            node_id: step.node_id,
            date,
            version,
            starts: 0,
            exits: 0,
            completes: 0,
            dwell_sum: 0,
            dwell_count: 0,
          };
        }

        const bucket = pendingUpdates[key];
        bucket.starts++;

        const dwell = step.dwell_seconds || 0;
        if (dwell > 0) {
          bucket.dwell_sum += dwell;
          bucket.dwell_count++;
        }

        // Exit: if next step is not the immediate sequential neighbor, or this is last
        const isLast = i === path.length - 1;
        if (isLast) {
          if (run.is_complete) bucket.completes++;
          else bucket.exits++;
        }
      }
      processed++;
    }

    // Upsert analytics rows
    let created = 0;
    let updated = 0;

    for (const [key, bucket] of Object.entries(pendingUpdates)) {
      // Check if row exists
      const existing = await base44.asServiceRole.entities.DecisionTreeNodeAnalytics.filter({
        quiz_id: bucket.quiz_id,
        node_id: bucket.node_id,
        date: bucket.date,
      });

      const avgDwell = bucket.dwell_count > 0 ? Math.round(bucket.dwell_sum / bucket.dwell_count) : 0;

      if (existing.length > 0) {
        const row = existing[0];
        const newStarts = (row.starts || 0) + bucket.starts;
        const newExits = (row.exits || 0) + bucket.exits;
        const newCompletes = (row.completes || 0) + bucket.completes;
        const dropOff = newStarts > 0 ? Math.round((newExits / newStarts) * 100) : 0;
        await base44.asServiceRole.entities.DecisionTreeNodeAnalytics.update(row.id, {
          starts: newStarts,
          exits: newExits,
          completes: newCompletes,
          drop_off_rate: dropOff,
          avg_dwell_seconds: avgDwell,
        });
        updated++;
      } else {
        const dropOff = bucket.starts > 0 ? Math.round((bucket.exits / bucket.starts) * 100) : 0;
        await base44.asServiceRole.entities.DecisionTreeNodeAnalytics.create({
          quiz_id: bucket.quiz_id,
          node_id: bucket.node_id,
          date: bucket.date,
          version: bucket.version,
          starts: bucket.starts,
          exits: bucket.exits,
          completes: bucket.completes,
          drop_off_rate: dropOff,
          avg_dwell_seconds: avgDwell,
        });
        created++;
      }
    }

    return Response.json({
      success: true,
      processed,
      analytics_rows_created: created,
      analytics_rows_updated: updated,
    });
  } catch (error) {
    console.error('Aggregation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});