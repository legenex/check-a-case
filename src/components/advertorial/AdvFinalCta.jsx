import React from "react";
import { ArrowRight } from "lucide-react";
import GradientMesh from "@/components/ui/GradientMesh";
import { buildQuizUrl } from "@/lib/quizUrl";

export default function AdvFinalCta({ finalCtaUrl, slug }) {
  const primaryHref = finalCtaUrl || buildQuizUrl({ defaults: { utm_source: "CAC-Site", utm_medium: slug, utm_campaign: "Advertorial" }, ctaContent: "link_cta_section" });
  const estimatorHref = `/tools/claim-estimator?s2=ADV-${slug}-est&utm_source=advertorial`;

  return (
    <section className="relative overflow-hidden rounded-3xl my-12 py-14 px-6 text-center"
      style={{ background: "hsl(var(--brand-navy))" }}>
      <GradientMesh />
      <div className="relative z-10 max-w-xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-dot" />
          <span className="text-sm font-semibold text-amber-300">FREE EVALUATION</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          Find Out What Your Case Could Be Worth
        </h2>
        <p className="text-white/70 text-lg">Takes 60 seconds. No obligation. Confidential.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={primaryHref}
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white btn-gradient shadow-xl shadow-blue-500/30 hover:brightness-110 transition-all group">
            Start My Free Evaluation
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a href={estimatorHref}
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white border-2 border-white/30 hover:bg-white/10 transition-all">
            Estimate My Claim Value
          </a>
        </div>
        <p className="text-white/30 text-xs">© 2026 Check A Case · Verified by NJA-Online LLC</p>
      </div>
    </section>
  );
}