import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const TRUST_BULLETS = ["100% Free — No Credit Card Required", "No Obligation Whatsoever", "Confidential & Secure"];
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80";

export default function MidSplitBlock({ adv, slug }) {
  const image = adv.mid_image_url || FALLBACK_IMAGE;
  const eyebrow = adv.mid_image_eyebrow || "FREE TOOL";
  const headline = adv.mid_image_headline || "Calculate Your Claim Value in 60 Seconds";
  const body = adv.mid_image_body || "Our claim calculator uses real settlement data from thousands of cases across all 50 states to give you an accurate estimate of what your case could be worth.";
  const ctaLabel = adv.mid_image_cta_label || "Check My Claim Value Now";
  const ctaUrl = adv.mid_image_cta_url || `/tools/claim-estimator?s2=ADV-${slug}&utm_source=advertorial`;

  return (
    <div className="my-12 -mx-4 sm:mx-0 rounded-none sm:rounded-3xl overflow-hidden border border-border/60 shadow-xl" style={{ maxWidth: "none" }}>
      <div className="flex flex-col sm:flex-row">
        {/* Image col */}
        <div className="sm:w-2/5 relative aspect-video sm:aspect-auto min-h-[220px]">
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(30,64,175,0.6) 0%, transparent 60%)" }} />
        </div>
        {/* Text col */}
        <div className="sm:w-3/5 bg-white p-8 sm:p-10 flex flex-col justify-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</span>
          <h3 className="text-2xl font-black text-foreground leading-tight">{headline}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
          <ul className="space-y-2">
            {TRUST_BULLETS.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <a
            href={ctaUrl}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white btn-gradient shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all group self-start"
          >
            {ctaLabel} →
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <p className="text-xs text-muted-foreground">Used by 85,000+ accident victims</p>
        </div>
      </div>
    </div>
  );
}