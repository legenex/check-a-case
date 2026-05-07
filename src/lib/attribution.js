const PARAM_KEYS = ["s2", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "event_id", "gclid", "fbclid", "ttclid"];

export function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const existing = JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
  
  let updated = false;
  PARAM_KEYS.forEach((key) => {
    const val = params.get(key);
    if (val) {
      existing[key] = val;
      updated = true;
    }
  });

  // Also capture any other utm_ params
  params.forEach((val, key) => {
    if (key.startsWith("utm_") && !existing[key]) {
      existing[key] = val;
      updated = true;
    }
  });

  if (updated || !sessionStorage.getItem("cac_attribution")) {
    existing.landing_page = existing.landing_page || window.location.pathname;
    existing.captured_at = existing.captured_at || new Date().toISOString();
    sessionStorage.setItem("cac_attribution", JSON.stringify(existing));
  }
}

export function getAttribution() {
  return JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
}