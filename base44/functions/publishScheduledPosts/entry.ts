import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const scheduledPosts = await base44.asServiceRole.entities.BlogPost.filter({ status: 'scheduled' });

  const due = scheduledPosts.filter((p) => p.scheduled_at && p.scheduled_at <= now);

  const results = [];
  for (const post of due) {
    await base44.asServiceRole.entities.BlogPost.update(post.id, {
      status: 'published',
      published_date: now,
    });
    results.push({ id: post.id, title: post.title });
  }

  return Response.json({ published: results.length, posts: results });
});