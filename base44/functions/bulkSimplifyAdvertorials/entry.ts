import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SIMPLIFY_PROMPT = `You are rewriting an advertorial article to be readable by a 12-year-old (6th-grade reading level). Keep the emotional arc and persuasive structure. Make it shorter and simpler. Output in clean markdown.

Target: 800 to 1000 words total. Cut anything that does not move the story forward.

WRITING RULES:
- Sentences: average 12 to 14 words. No sentence over 22 words.
- Paragraph LENGTH: vary it. Most paragraphs are 2 to 4 sentences. Occasionally a single sentence on its own line for a punchline moment. NEVER more than one single-sentence paragraph in a row.
- Use common everyday words. If a 12-year-old would not say it, do not write it.
- Active voice always.
- Use "you", "she", "he", "they". Conversational.
- One clear idea per paragraph.
- No legal jargon. Replace: "tortfeasor" with "the person who caused the crash"; "statute of limitations" with "the deadline to file"; "subsequently" with "then"; "substantial" with "big"; "determined" with "decided".
- No Latin terms ever.
- No em dashes ever. Use commas, periods, or parentheses.

STRUCTURE:
- Use H2 subheadings every 3 to 4 paragraphs (markdown "##"). Subheadings are short (3 to 7 words), intriguing, and read like news pull-quotes. Not academic section labels.
- Format as standard markdown with DOUBLE NEWLINES between paragraphs and between headings and paragraphs.

PLACEHOLDER MARKERS (use these EXACT strings on their own line, with blank lines before and after):
- [CTA_INLINE_1]: place after the first major story beat (around paragraph 4-5)
- [MID_IMAGE]: place around paragraph 7-8, separately from any CTA
- [CTA_INLINE_2]: place around paragraph 10-11
- [CTA_INLINE_3]: place near the end (around paragraph 14-16)

PRESERVE:
- Headline and dek: do not rewrite, do not include them in your output (they are stored separately).
- All names, dates, dollar amounts, locations, concrete facts.
- The story arc: hook, setup, conflict, turn, resolution, lesson, call to action.
- Emotional tone: empathetic for sensitive topics, investigative for exposes, personal for stories.

OUTPUT FORMAT:
- Pure markdown body only. Start at paragraph 1 of the body.
- No commentary, no preamble, no explanation.
- Do not include the headline or byline.

EXAMPLE of correctly-formatted output:

Linda was rear-ended by a delivery van in February of 2023. She was not bleeding. The van had insurance. The cop said the driver was at fault. She thought she was fine.

Eighteen months later, her back still hurt. Her shoulder had not been right since the crash. Her medical bills were piling up because her insurance had stopped covering certain therapies.

In August of 2024 she finally called an attorney. The first phone call told her two things she did not want to hear.

## The News That Stopped Her Cold

Her case, on paper, was worth around 94,000 dollars. But she had already missed her state's deadline by eleven days. It was over before it started.

[CTA_INLINE_1]

## Every State Has a Clock

Every state has a legal cutoff for filing an injury lawsuit. It is called the statute of limitations. If you miss the deadline, you do not have a case. The injury does not matter. The bills do not matter. The fault does not matter.

Most states give you 2 or 3 years from the date of the accident. California is 2 years. Texas is 2 years. Florida is 2 years (cut from 4 in a 2023 reform). New York is 3 years.

[MID_IMAGE]

## What Insurance Companies Already Know

Insurance companies track every state's deadline on every claim file. Documented cases show adjusters slow-walking settlements on purpose, hoping the deadline would pass while the claimant was busy being sick.

The day the clock runs out, the file gets closed. The claim is dead.

Linda's claim was dead. Eleven days late.

[CTA_INLINE_2]

## What You Should Do This Week

If you have been in an accident in the last two years, do not assume you have time. Do not assume the insurance company is moving things forward in good faith. Do not assume your case can wait.

Find out exactly how long you have left in your state. It takes 30 seconds and it is free.

[CTA_INLINE_3]`;

const BROKEN_MARKERS = ["[INLINE_CTA_", "[CTA_INLINE_", "[MID_SPLIT]"];

function hasBrokenMarkers(body) {
  if (!body) return false;
  return BROKEN_MARKERS.some((m) => body.includes(m));
}

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
  const { advertorial_id, list_only, broken_only } = body;

  // Single advertorial rewrite mode
  if (advertorial_id) {
    const adv = await base44.asServiceRole.entities.Advertorial.filter({ id: advertorial_id });
    const record = adv[0];
    if (!record) return Response.json({ error: "Advertorial not found" }, { status: 404 });

    // For broken_only re-runs: start from original backup if available
    const sourceBody = (broken_only && record.body_original_backup)
      ? record.body_original_backup
      : record.body || "";

    const rewritten = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: SIMPLIFY_PROMPT + "\n\n---\n\n" + sourceBody,
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

  // List mode: return IDs to process
  const all = await base44.asServiceRole.entities.Advertorial.list("slug", 500);
  const eligible = all.filter(a => a.status !== "archived" && a.body);

  if (list_only) {
    return Response.json({ ids: eligible.map(a => a.id), total: eligible.length });
  }

  // Broken-only list mode
  if (broken_only) {
    const broken = eligible.filter(a => hasBrokenMarkers(a.body));
    return Response.json({ ids: broken.map(a => a.id), total: broken.length });
  }

  return Response.json({ error: "Use advertorial_id, list_only=true, or broken_only=true" }, { status: 400 });
});