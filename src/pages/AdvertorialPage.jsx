import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

// --- Attribution capture ---
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid", "sid", "s2"];

function captureAttribution(slug) {
  const params = new URLSearchParams(window.location.search);
  const stored = JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
  let hasUtm = false;
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) { stored[k] = v; hasUtm = true; }
  });
  if (!hasUtm && !stored.utm_source) {
    stored.utm_source = stored.utm_source || "advertorial";
    stored.utm_medium = stored.utm_medium || "advertorial";
    stored.utm_campaign = stored.utm_campaign || slug;
    stored.utm_content = stored.utm_content || "primary_cta";
  }
  stored.landing_page = stored.landing_page || window.location.pathname;
  stored.captured_at = stored.captured_at || new Date().toISOString();
  sessionStorage.setItem("cac_attribution", JSON.stringify(stored));
  return stored;
}

function appendUtmToUrl(url, attribution) {
  if (!url) return url;
  try {
    const u = new URL(url.startsWith("http") ? url : "https://quiz.checkacase.com" + url);
    if (attribution.utm_source) u.searchParams.set("utm_source", attribution.utm_source);
    if (attribution.utm_medium) u.searchParams.set("utm_medium", attribution.utm_medium);
    if (attribution.utm_campaign) u.searchParams.set("utm_campaign", attribution.utm_campaign);
    if (attribution.utm_content) u.searchParams.set("utm_content", attribution.utm_content);
    if (attribution.s2) u.searchParams.set("s2", attribution.s2);
    if (attribution.gclid) u.searchParams.set("gclid", attribution.gclid);
    if (attribution.fbclid) u.searchParams.set("fbclid", attribution.fbclid);
    return u.toString();
  } catch {
    return url;
  }
}

// --- CTA button styles ---
function CtaButton({ text, url, style }) {
  if (!text || !url) return null;
  const styles = {
    gold_gradient: "inline-flex items-center justify-center w-full max-w-xl px-8 py-5 text-lg font-bold rounded-2xl text-amber-900 shadow-xl shadow-amber-400/30 hover:brightness-110 transition-all",
    cream: "inline-flex items-center justify-center w-full max-w-xl px-8 py-5 text-lg font-bold rounded-2xl bg-amber-50 text-navy border-2 border-navy hover:bg-amber-100 transition-all",
    dark_navy: "inline-flex items-center justify-center w-full max-w-xl px-8 py-5 text-lg font-bold rounded-2xl text-white hover:brightness-110 transition-all",
  };
  const inlineStyles = {
    gold_gradient: { background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
    cream: {},
    dark_navy: { background: "hsl(var(--brand-navy))" },
  };
  return (
    <a href={url} className={styles[style] || styles.gold_gradient} style={inlineStyles[style] || inlineStyles.gold_gradient}>
      {text}
    </a>
  );
}

// --- Inline image injection ---
// Counts H2 occurrences in rendered markdown; we inject after the 2nd one.
function BodyWithInlineImage({ body, inlineImageUrl }) {
  if (!inlineImageUrl) {
    return (
      <ReactMarkdown components={mdComponents}>
        {body || ""}
      </ReactMarkdown>
    );
  }

  // Split the markdown at the second H2
  const h2Regex = /^## /m;
  let count = 0;
  let splitIndex = -1;
  const lines = (body || "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      count++;
      if (count === 2) { splitIndex = i; break; }
    }
  }

  if (splitIndex === -1) {
    return (
      <>
        <ReactMarkdown components={mdComponents}>{body || ""}</ReactMarkdown>
        <img src={inlineImageUrl} alt="" className="w-full rounded-xl my-8 shadow-md" />
      </>
    );
  }

  const before = lines.slice(0, splitIndex).join("\n");
  const after = lines.slice(splitIndex).join("\n");

  return (
    <>
      <ReactMarkdown components={mdComponents}>{before}</ReactMarkdown>
      <img src={inlineImageUrl} alt="" className="w-full rounded-xl my-8 shadow-md" />
      <ReactMarkdown components={mdComponents}>{after}</ReactMarkdown>
    </>
  );
}

// --- Markdown component overrides ---
const mdComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-black tracking-tight text-foreground mt-10 mb-4 font-sans">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold text-foreground mt-10 mb-3 pb-2 font-sans" style={{ borderBottom: "2px solid hsl(var(--primary))", display: "inline-block" }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold text-foreground mt-8 mb-2 font-sans">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[1.0625rem] leading-[1.85] text-foreground/85 mb-5">{children}</p>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 pl-5 border-l-4 border-primary bg-primary/5 py-4 pr-4 rounded-r-xl italic text-foreground/75 text-base leading-relaxed">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-2 text-foreground/85">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-2 text-foreground/85">{children}</ol>,
  li: ({ children }) => <li className="text-[1.0625rem] leading-[1.75]">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} className="text-primary underline underline-offset-2 hover:text-primary/80">{children}</a>
  ),
  hr: () => <hr className="my-8 border-border" />,
};

// --- Main page ---
export default function AdvertorialPage() {
  const { slug: pathSlug } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const isPreview = searchParams.get("preview") === "1";

  const [state, setState] = useState("loading"); // loading | found | redirect | notfound
  const [adv, setAdv] = useState(null);
  const [attribution, setAttribution] = useState({});

  useEffect(() => {
    if (!pathSlug) { setState("notfound"); return; }

    async function load() {
      // Try direct slug match
      const all = await base44.entities.Advertorial.list("slug", 500);

      const direct = all.find((a) => a.slug === pathSlug && (isPreview || a.status === "published"));
      if (direct) {
        setAdv(direct);
        const attr = captureAttribution(direct.slug);
        setAttribution(attr);
        setState("found");
        return;
      }

      // Check slug_redirects
      const redirectTarget = all.find((a) =>
        Array.isArray(a.slug_redirects) && a.slug_redirects.includes(pathSlug) && (isPreview || a.status === "published")
      );
      if (redirectTarget) {
        window.location.replace(`/a/${redirectTarget.slug}`);
        return;
      }

      setState("notfound");
    }
    load();
  }, [pathSlug, isPreview]);

  // Update document head
  useEffect(() => {
    if (!adv) return;
    document.title = adv.seo_title || adv.title || "CheckACase";
    const desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", adv.seo_description || "");
    const ogImg = adv.og_image_url || adv.hero_image_url || "";
    const ogImgTag = document.querySelector("meta[property='og:image']");
    if (ogImgTag) ogImgTag.setAttribute("content", ogImg);
    const canonical = document.querySelector("link[rel='canonical']") || (() => {
      const l = document.createElement("link"); l.rel = "canonical"; document.head.appendChild(l); return l;
    })();
    canonical.href = `https://checkacase.com/a/${adv.slug}`;
  }, [adv]);

  const finalCtaUrl = adv ? appendUtmToUrl(adv.final_cta_url, attribution) : "";

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
          <p className="text-7xl font-black text-foreground/10 mb-4">404</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Article not found</h1>
          <p className="text-muted-foreground mb-6">This advertorial doesn't exist or has been removed.</p>
          <a href="/" className="text-primary underline">Go home</a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal top bar for advertorial pages */}
      <div className="border-b border-border/60 bg-white sticky top-0 z-40">
        <div className="max-w-[680px] mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/">
            <img src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png" alt="Check A Case" className="h-7 w-auto" />
          </a>
          <a
            href={finalCtaUrl || "https://quiz.checkacase.com/s/mva?sid=LEADFLOW"}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white btn-gradient shadow-sm"
          >
            Free Case Review →
          </a>
        </div>
      </div>

      <article className="max-w-[680px] mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* Hero image */}
        {adv.hero_image_url && (
          <div className="mb-8 -mx-4 sm:-mx-6">
            <img src={adv.hero_image_url} alt={adv.title} className="w-full max-h-[440px] object-cover" />
          </div>
        )}

        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          Consumer Advocacy · Sponsored
        </p>

        {/* Headline */}
        <h1
          className="font-black text-foreground leading-tight mb-4"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", letterSpacing: "-0.025em", lineHeight: 1.15 }}
        >
          {adv.title}
        </h1>

        {/* Pull quote / subhead */}
        {adv.pull_quote && (
          <p
            className="text-xl italic text-foreground/70 mb-5 leading-relaxed"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {adv.pull_quote}
          </p>
        )}

        {/* Byline */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-brand-blue-dark flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            CA
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">By CheckACase Editorial Desk, Consumer Advocacy</p>
            <p className="text-xs text-muted-foreground">
              {adv.updated_date ? new Date(adv.updated_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
            </p>
          </div>
        </div>

        {/* Body with inline image injection */}
        <div
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1.0625rem", lineHeight: "1.85" }}
        >
          <BodyWithInlineImage body={adv.body} inlineImageUrl={adv.inline_image_url} />
        </div>

        {/* Primary CTA */}
        {adv.final_cta_text && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <CtaButton
              text={adv.final_cta_text}
              url={finalCtaUrl}
              style={adv.cta_style}
            />
            <p className="text-xs text-muted-foreground">Free, no obligation. Takes 60 seconds.</p>
          </div>
        )}

        {/* Footer disclaimer */}
        <div className="mt-14 pt-8 border-t border-border space-y-4 text-xs text-muted-foreground leading-relaxed">
          <p>
            <strong>DISCLAIMER:</strong> checkacase.com is not a law firm or an attorney referral service. This advertisement is not legal advice and is not a guarantee or prediction of the outcome of your legal matter. Every case is different, and the outcome depends on the laws, facts, and circumstances unique to each case. Hiring an attorney is an important decision that should not be based solely on advertising. Request free information about your attorney's background and experience.
          </p>
          <p>
            <strong>CA RESIDENTS:</strong> Paid attorney advertising on behalf of jointly advertising independent attorneys. CheckACase is not a law firm and does not provide legal services. You can request an attorney by name. This advertising does not imply a higher quality of legal services than that provided by other attorneys, nor does it imply that the attorneys are certified specialists or experts in any area of law. Past results showcased in advertisements do not dictate future results. If you live in AL, FL, MO, NY, or WY, additional state-specific advertising disclosures apply.
          </p>
          <p className="font-medium text-foreground/40">
            © 2026 CheckACase. All rights reserved. | checkacase.com
          </p>
        </div>
      </article>
    </div>
  );
}