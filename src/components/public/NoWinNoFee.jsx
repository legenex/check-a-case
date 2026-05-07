import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import GradientMesh from "@/components/ui/GradientMesh";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";

export default function NoWinNoFee({ ctaText, ctaUrl }) {
  return (
    <section className="relative overflow-hidden bg-brand-navy py-20 sm:py-28">
      <GradientMesh />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <FadeUpOnScroll>
          <div className="inline-flex items-center gap-2 bg-brand-amber/20 border border-brand-amber/40 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-amber animate-pulse-dot" />
            <span className="text-sm font-semibold text-brand-amber">NO WIN, NO FEE GUARANTEE</span>
          </div>
        </FadeUpOnScroll>
        <FadeUpOnScroll delay={0.1}>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            WE DON'T GET PAID UNLESS YOU DO
          </h2>
        </FadeUpOnScroll>
        <FadeUpOnScroll delay={0.15}>
          <div className="text-lg text-white/70 leading-relaxed max-w-3xl mx-auto text-left sm:text-center">
            <p>
              <strong className="text-white">OUR NO WIN, NO FEE GUARANTEE</strong> — We guarantee every client that we will not charge you a cent if we do not secure a positive outcome in your case. If you do win, the bulk of our fees are usually paid by the opposing counsel's client, who was responsible for the accident. We will discuss and agree upon the fee breakdown upfront and in detail, so there will be complete transparency and no disappointment once we win your case… Which is our guarantee to you!{" "}
              <strong className="text-white">YOU HAVE NOTHING TO LOSE!</strong>
            </p>
          </div>
        </FadeUpOnScroll>
        <FadeUpOnScroll delay={0.2}>
          <Link to={ctaUrl || "/Survey?s2=CAC-NoWin&utm_source=Website"}>
            <GradientButton variant="amber" size="lg" className="group">
              {ctaText || "FIND OUT HOW MUCH YOUR CLAIM COULD BE WORTH"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </GradientButton>
          </Link>
        </FadeUpOnScroll>
      </div>
    </section>
  );
}