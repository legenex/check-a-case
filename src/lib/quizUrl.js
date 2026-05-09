const QUIZ_BASE = "https://quiz.checkacase.com/s/mva";
const DEFAULT_SID = "LGNX";

export function buildQuizUrl({ defaults = {}, ctaContent } = {}) {
  let stored = {};
  try {
    stored = JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
  } catch {}

  const params = new URLSearchParams();

  // sid: stored > default
  params.set("sid", stored.sid || DEFAULT_SID);

  // utm_source: stored incoming campaign wins, else page default
  if (stored.utm_source) params.set("utm_source", stored.utm_source);
  else if (defaults.utm_source) params.set("utm_source", defaults.utm_source);

  // utm_medium
  if (stored.utm_medium) params.set("utm_medium", stored.utm_medium);
  else if (defaults.utm_medium) params.set("utm_medium", defaults.utm_medium);

  // utm_campaign
  if (stored.utm_campaign) params.set("utm_campaign", stored.utm_campaign);
  else if (defaults.utm_campaign) params.set("utm_campaign", defaults.utm_campaign);

  // utm_content: ctaContent (button id) takes priority, then stored, then default
  if (ctaContent) params.set("utm_content", ctaContent);
  else if (stored.utm_content) params.set("utm_content", stored.utm_content);
  else if (defaults.utm_content) params.set("utm_content", defaults.utm_content);

  // utm_term passthrough
  if (stored.utm_term) params.set("utm_term", stored.utm_term);

  // click IDs passthrough
  ["gclid", "fbclid", "ttclid"].forEach((k) => {
    if (stored[k]) params.set(k, stored[k]);
  });

  return `${QUIZ_BASE}?${params.toString()}`;
}