import React from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { buildQuizUrl } from "@/lib/quizUrl";

const COPY = [
  { headline: "See If You Qualify in 60 Seconds", body: "Free case review — no obligation, no upfront fees." },
  { headline: "Free Case Review — No Obligation", body: "Our attorneys only get paid if you win." },
  { headline: "Don't Wait — Your Claim Window Closes Soon", body: "Every state has a strict deadline. Check yours now." },
];

export default function InlineMiniCta({ position = 0, href, slug = "" }) {
  const copy = COPY[position % COPY.length];
  const resolvedHref = href || buildQuizUrl({ defaults: { utm_source: "CAC-Site", utm_medium: slug, utm_campaign: "Advertorial" }, ctaContent: `link_${position + 1}` });
  return (
    <div className="my-8 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20"
      style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%)" }}>
      <div className="flex flex-col sm:flex-row items-center gap-4 p-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-bold text-white text-lg leading-tight">{copy.headline}</p>
          <p className="text-blue-100 text-sm mt-0.5">{copy.body}</p>
        </div>
        <a
          href={resolvedHref}
          rel="noopener"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg group"
        >
          Check Your Claim
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}