import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import MinimalLegalFooter from "@/components/public/MinimalLegalFooter";
import AdvNavbar from "@/components/advertorial/AdvNavbar";
import InlineMiniCta from "@/components/advertorial/InlineMiniCta";
import MidSplitBlock from "@/components/advertorial/MidSplitBlock";
import AdvFinalCta from "@/components/advertorial/AdvFinalCta";
import { Facebook, Twitter, Link as LinkIcon, Clock, Calendar } from "lucide-react";

// ---------- Attribution ----------
const UTM_KEYS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","gclid","fbclid","ttclid","sid","s2"];

function captureAttribution(slug) {
  const params = new URLSearchParams(window.location.search);
  const stored = JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
  let hasUtm = false;
  UTM_KEYS.forEach((k) => { const v = params.get(k); if (v) { stored[k] = v; hasUtm = true; } });
  if (!hasUtm && !stored.utm_source) {
    stored.utm_source = "advertorial";
    stored.utm_medium = "advertorial";
    stored.utm_campaign = slug;
    stored.utm_content = "primary_cta";
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
  } catch { return url; }
}

// ---------- Drop-cap style injected once ----------
const DROP_CAP_STYLE = `
  .adv-body > p:first-of-type::first-letter,
  .adv-segment:first-child p:first-of-type::first-letter {
    float: left;
    font-size: 4em;
    line-height: 0.8;
    padding-right: 8px;
    font-weight: 800;
    color: hsl(var(--foreground));
    font-family: Georgia, serif;
  }
`;

// ---------- Markdown components (stateless) ----------
const MD_COMPONENTS = {
  h1: ({ children }) => <h1 className="text-3xl font-black tracking-tight text-foreground mt-10 mb-4">{children}</h1>,
  h2: ({ children }) => (
    <div className="mt-10 mb-4">
      <h2 className="text-2xl font-bold text-foreground pb-1 inline-block border-b-2 border-primary">{children}</h2>
    </div>
  ),
  h3: ({ children }) => <h3 className="text-xl font-semibold text-foreground mt-7 mb-2">{children}</h3>,
  p: ({ children }) => <p className="text-[1.0625rem] leading-[1.8] text-foreground/85 mb-5">{children}</p>,
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
  a: ({ href, children }) => <a href={href} className="text-primary underline underline-offset-2 hover:text-primary/80">{children}</a>,
  hr: () => <hr className="my-8 border-border" />,
};

// ---------- Marker-based body renderer ----------
// Splits body on [INLINE_CTA_0], [INLINE_CTA_1], [MID_SPLIT] markers
// Falls back to rendering whole body if no markers present
function AdvBody({ body, adv, slug, ctaHref }) {
  const MARKER_RE = /\[(INLINE_CTA_0|INLINE_CTA_1|MID_SPLIT)\]/g;
  const parts = [];
  let last = 0;
  let match;
  const hasMarkers = MARKER_RE.test(body);

  if (!hasMarkers) {
    // Legacy: render as one block
    return (
      <div className="adv-body adv-segment" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <ReactMarkdown components={MD_COMPONENTS}>{body}</ReactMarkdown>
      </div>
    );
  }

  // Reset and re-run
  MARKER_RE.lastIndex = 0;
  while ((match = MARKER_RE.exec(body)) !== null) {
    const segment = body.slice(last, match.index).trim();
    if (segment) parts.push({ type: "md", content: segment });
    parts.push({ type: "marker", marker: match[1] });
    last = match.index + match[0].length;
  }
  const tail = body.slice(last).trim();
  if (tail) parts.push({ type: "md", content: tail });

  return (
    <div className="adv-body" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {parts.map((part, i) => {
        if (part.type === "md") {
          return (
            <div key={i} className={i === 0 ? "adv-segment" : ""}>
              <ReactMarkdown components={MD_COMPONENTS}>{part.content}</ReactMarkdown>
            </div>
          );
        }
        if (part.marker === "INLINE_CTA_0") {
          return <InlineMiniCta key={i} position={0} href={ctaHref} slug={slug} />;
        }
        if (part.marker === "INLINE_CTA_1") {
          return <InlineMiniCta key={i} position={1} href={ctaHref} slug={slug} />;
        }
        if (part.marker === "MID_SPLIT") {
          return <MidSplitBlock key={i} adv={adv} slug={slug} />;
        }
        return null;
      })}
    </div>
  );
}

// ---------- Main Page ----------
export default function AdvertorialPage() {
  const { slug: pathSlug } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const isPreview = searchParams.get("preview") === "1";

  const [pageState, setPageState] = useState("loading");
  const [adv, setAdv] = useState(null);
  const [attribution, setAttribution] = useState({});

  useEffect(() => {
    if (!pathSlug) { setPageState("notfound"); return; }
    async function load() {
      const all = await base44.entities.Advertorial.list("slug", 500);
      const direct = all.find((a) => a.slug === pathSlug && (isPreview || a.status === "published"));
      if (direct) {
        setAdv(direct);
        setAttribution(captureAttribution(direct.slug));
        setPageState("found");
        return;
      }
      const redirect = all.find((a) =>
        Array.isArray(a.slug_redirects) && a.slug_redirects.includes(pathSlug) && (isPreview || a.status === "published")
      );
      if (redirect) { window.location.replace(`/a/${redirect.slug}`); return; }
      setPageState("notfound");
    }
    load();
  }, [pathSlug, isPreview]);

  useEffect(() => {
    if (!adv) return;
    document.title = adv.seo_title || adv.title || "CheckACase";
    const desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", adv.seo_description || "");
    const ogImg = adv.og_image_url || adv.hero_image_url || "";
    const ogImgTag = document.querySelector("meta[property='og:image']");
    if (ogImgTag) ogImgTag.setAttribute("content", ogImg);
  }, [adv]);

  if (pageState === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  if (pageState === "notfound") {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafafa]">
        <AdvNavbar slug={pathSlug} finalCtaUrl={null} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-32 mt-20">
          <p className="text-7xl font-black text-foreground/10 mb-4">404</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Article not found</h1>
          <p className="text-muted-foreground mb-6">This advertorial doesn't exist or has been removed.</p>
          <a href="/" className="text-primary underline">Go home</a>
        </div>
        <MinimalLegalFooter />
      </div>
    );
  }

  const finalCtaUrl = appendUtmToUrl(adv.final_cta_url, attribution);
  const surveyHref = `/Survey?s2=ADV-${adv.slug}&utm_source=advertorial&utm_medium=advertorial-${adv.slug}`;
  const ctaHref = finalCtaUrl || surveyHref;
  const readTime = adv.read_time_minutes || 4;
  const authorName = adv.author_name || "Sarah Mitchell, Staff Writer";
  const publishDate = adv.updated_date
    ? new Date(adv.updated_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "2026";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <style>{DROP_CAP_STYLE}</style>
      <AdvNavbar slug={adv.slug} finalCtaUrl={finalCtaUrl} />

      {/* Spacer for fixed navbar */}
      <div className="h-20" />

      <article className="pb-16">
        {/* Header block — max-w-3xl */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            <span className="text-primary">{adv.campaign_id || "Legal Alert"}</span>
            <span>·</span>
            <Clock className="w-3 h-3" />
            <span>{readTime} min read</span>
            <span>·</span>
            <Calendar className="w-3 h-3" />
            <span>{publishDate}</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#111" }} className="mb-5">
            {adv.title}
          </h1>

          {/* Pull quote / dek */}
          {adv.pull_quote && (
            <p className="text-xl italic text-foreground/65 mb-6 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
              {adv.pull_quote}
            </p>
          )}

          {/* Byline */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-brand-blue-dark flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                SM
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">By {authorName}</p>
                <p className="text-xs text-muted-foreground">Reviewed by an attorney · CheckACase Editorial</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-[#1877f2] flex items-center justify-center text-white hover:opacity-80 transition-opacity" title="Share on Facebook">
                <Facebook className="w-3.5 h-3.5" />
              </button>
              <button className="w-8 h-8 rounded-full bg-[#1da1f2] flex items-center justify-center text-white hover:opacity-80 transition-opacity" title="Share on Twitter">
                <Twitter className="w-3.5 h-3.5" />
              </button>
              <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-border transition-colors" title="Copy link">
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Hero image — full-bleed max-w-5xl, AFTER byline */}
        {adv.hero_image_url && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-xl shadow-black/10">
              <img src={adv.hero_image_url} alt={adv.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Body — max-w-3xl */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <AdvBody body={adv.body || ""} adv={adv} slug={adv.slug} ctaHref={ctaHref} />

        {/* Final CTA block */}
        <AdvFinalCta finalCtaUrl={ctaHref} slug={adv.slug} />

        {/* Legal disclaimer */}
        <div className="mt-10 pt-8 border-t border-border space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p><strong>DISCLAIMER:</strong> checkacase.com is not a law firm or an attorney referral service. This advertisement is not legal advice and is not a guarantee or prediction of the outcome of your legal matter. Every case is different, and the outcome depends on the laws, facts, and circumstances unique to each case. Hiring an attorney is an important decision that should not be based solely on advertising. Request free information about your attorney's background and experience.</p>
          <p><strong>CA RESIDENTS:</strong> Paid attorney advertising on behalf of jointly advertising independent attorneys. CheckACase is not a law firm and does not provide legal services. You can request an attorney by name. This advertising does not imply a higher quality of legal services than that provided by other attorneys, nor does it imply that the attorneys are certified specialists or experts in any area of law. Past results showcased in advertisements do not dictate future results. If you live in AL, FL, MO, NY, or WY, additional state-specific advertising disclosures apply.</p>
        </div>
        </div>{/* end max-w-3xl body wrapper */}
      </article>

      <MinimalLegalFooter />
    </div>
  );
}