import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SIMPLIFY_PROMPT = `You are rewriting an advertorial article to be readable by a 12-year-old (6th-grade reading level). Keep the emotional arc and persuasive structure. Make it shorter and simpler.

Target: 800 to 1000 words total. Cut anything that does not move the story forward.

WRITING RULES:
- Short sentences. Average 12 to 14 words. No sentence over 22 words.
- Short paragraphs. 2 to 4 sentences each. Never longer.
- Use common everyday words. If a 12-year-old would not say it, do not write it.
- Active voice always.
- Use "you", "she", "he", "they". Be conversational.
- One clear idea per paragraph.
- No legal jargon. Replace it with plain English. (Example: "tortfeasor" becomes "the person who caused the crash". "Statute of limitations" becomes "the deadline to file".)
- No SAT vocabulary. (Example: "subsequently" becomes "then". "Substantial" becomes "big". "Determined" becomes "decided".)
- No Latin terms ever.
- Never use em dashes. Use commas, periods, or parentheses instead.

PRESERVE:
- The headline and the dek beneath it.
- All names, dates, dollar amounts, locations, and concrete facts.
- The story structure: hook, setup, conflict, the turn, resolution, lesson, call to action.
- CTA placements: mark inline CTA insertion points with [CTA_INLINE_1], [CTA_INLINE_2], [CTA_INLINE_3] on their own lines, roughly evenly spaced. Mark the mid-article image insertion point with [MID_IMAGE] on its own line, roughly halfway through.
- Tone: empathetic for sensitive verticals (mental health, child safety, abuse). Investigative for expose-style. Personal-story for first-person narratives.

STRUCTURE:
- Use H2 subheadings every 2 to 3 paragraphs. Subheadings should be short, intriguing, and read like news pull-quotes (not academic section labels).
- Drop-cap on the first paragraph (let the front-end handle the styling, just write a normal paragraph).

OUTPUT:
- Clean markdown only. No commentary. No preamble.`;

function getUnsplashKeywords(title, slug) {
  const stopWords = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","was","were","are","has","had","have","that","this","it","she","he","they","her","his","their","my","your","our","its","how","what","who","when","why","where","got","get","did","do","does","can","could","would","should","will","been","being","be","not","no","so","if","as","up","out","after","before","about","into","than","then","there","here","also","just","more","most","some","all","any","other","new","old","first","last","one","two","three"]);
  const text = (title + " " + slug.replace(/-/g, " ")).toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  const unique = [...new Set(words)].slice(0, 3);
  return unique.length > 0 ? unique.join(",") : "accident,settlement,legal";
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { advertorial_id } = body;

  // Single advertorial rewrite mode
  if (advertorial_id) {
    const adv = await base44.asServiceRole.entities.Advertorial.filter({ id: advertorial_id });
    const record = adv[0];
    if (!record) return Response.json({ error: "Advertorial not found" }, { status: 404 });

    const rewritten = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: SIMPLIFY_PROMPT + "\n\n---\n\n" + (record.body || ""),
      model: "claude_sonnet_4_6",
    });

    const updates = {
      body: rewritten,
      body_original_backup: record.body_original_backup || record.body || "",
    };

    if (!record.mid_image_url) {
      const keywords = getUnsplashKeywords(record.title || "", record.slug || "");
      updates.mid_image_url = `https://source.unsplash.com/featured/?${keywords}`;
    }
    if (!record.hero_image_url) {
      const keywords = getUnsplashKeywords(record.title || "", record.slug || "");
      updates.hero_image_url = `https://source.unsplash.com/featured/?${keywords},wide`;
    }

    await base44.asServiceRole.entities.Advertorial.update(record.id, updates);
    return Response.json({ success: true, id: record.id });
  }

  // Bulk mode: return list of IDs to process
  const { list_only } = body;
  const all = await base44.asServiceRole.entities.Advertorial.list("slug", 500);
  const eligible = all.filter(a => a.status !== "archived" && a.body);

  if (list_only) {
    return Response.json({ ids: eligible.map(a => a.id), total: eligible.length });
  }

  return Response.json({ error: "Use advertorial_id or list_only=true" }, { status: 400 });
});