import React from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import GradientMesh from "@/components/ui/GradientMesh";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import GradientButton from "@/components/ui/GradientButton";
import { ArrowRight } from "lucide-react";

const STATS = [
  { label: "Recovered", value: 847, prefix: "$", suffix: "M+" },
  { label: "Cases Handled", value: 85000, prefix: "", suffix: "+" },
  { label: "Win Rate", value: 97, prefix: "", suffix: "%" },
];

export function LPHero({ headline, sub, ctaText, ctaHref, eyebrow }) {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-brand-navy pt-20">
      <GradientMesh />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center w-full">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-dot" />
            <span className="text-sm font-medium text-white/90">{eyebrow}</span>
          </div>
        )}
        <h1 className="text-hero font-black text-white mb-6 leading-[1.05]" dangerouslySetInnerHTML={{ __html: headline }} />
        <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-8">{sub}</p>
        <a href={ctaHref}>
          <GradientButton size="lg" className="group">
            {ctaText} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </GradientButton>
        </a>
        <p className="text-sm text-white/40 mt-3">Free. No obligation. No upfront fees.</p>
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-14">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-black text-white"><AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} /></div>
              <div className="text-xs text-white/50 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LPFinalCta({ ctaHref, skipHref, skipLabel }) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 text-center" style={{ background: "hsl(var(--brand-navy))" }}>
      <GradientMesh />
      <div className="relative z-10 max-w-3xl mx-auto px-4 space-y-5">
        <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-dot" />
          <span className="text-sm font-semibold text-amber-300">FREE CASE REVIEW</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-white">Start Your Free Claim Review</h2>
        <p className="text-white/70 text-lg">No obligation. No upfront fees. Takes 60 seconds.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={ctaHref} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white btn-gradient shadow-xl hover:brightness-110 transition-all">
            Start My Free Evaluation <ArrowRight className="w-5 h-5" />
          </a>
          {skipHref && (
            <a href={skipHref} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white border-2 border-white/30 hover:bg-white/10 transition-all">
              {skipLabel || "Skip to Survey"}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export default function LPShell({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}