/**
 * Resolves the active brand for a decision tree run.
 * Priority: param: > host: > referrer:
 * Falls back to quiz.brand_id, then first active brand, then null.
 */
export function resolveBrand(brands, { host, params, referrer, quizBrandId } = {}) {
  const activeBrands = brands.filter((b) => b.is_active);

  // Score each brand
  const scored = activeBrands.map((brand) => {
    let score = 0;
    for (const pattern of (brand.url_match_patterns || [])) {
      if (pattern.startsWith('param:')) {
        const [, rest] = pattern.split('param:');
        const [key, val] = rest.split('=');
        if (params?.get(key) === val) { score = Math.max(score, 3); }
      } else if (pattern.startsWith('host:')) {
        const [, matchHost] = pattern.split('host:');
        if (host && (host === matchHost || host.includes(matchHost))) {
          score = Math.max(score, 2);
        }
      } else if (pattern.startsWith('referrer:')) {
        const [, matchRef] = pattern.split('referrer:');
        if (referrer && referrer.includes(matchRef)) {
          score = Math.max(score, 1);
        }
      }
    }
    return { brand, score };
  });

  // Sort: highest score first, then by created_at ASC
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.brand.created_date || '') < (b.brand.created_date || '') ? -1 : 1;
  });

  const best = scored.find((s) => s.score > 0);
  if (best) return best.brand;

  // Fallback: quiz.brand_id
  if (quizBrandId) {
    const byId = activeBrands.find((b) => b.id === quizBrandId);
    if (byId) return byId;
  }

  // Fallback: first active brand
  return activeBrands[0] || null;
}

/**
 * Build CSS custom properties string from a brand record.
 */
export function buildBrandCss(brand, quizOverrides) {
  const src = { ...quizOverrides, ...brand };
  const lines = [];
  if (src.primary_color) lines.push(`--brand-primary: ${src.primary_color};`);
  if (src.accent_color) lines.push(`--brand-accent: ${src.accent_color};`);
  if (src.background_color) lines.push(`--brand-bg: ${src.background_color};`);
  if (src.text_color) lines.push(`--brand-text: ${src.text_color};`);
  if (src.custom_css) {
    return `:root { ${lines.join(' ')} }\n${src.custom_css}`;
  }
  return lines.length ? `:root { ${lines.join(' ')} }` : '';
}