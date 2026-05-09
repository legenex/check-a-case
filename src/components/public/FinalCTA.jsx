import React from "react";
import { ArrowRight } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { buildQuizUrl } from "@/lib/quizUrl";

export default function FinalCTA() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(210,40%,97%) 0%, hsl(205,79%,93%) 100%)" }}>
      {/* Confetti-like decorative SVG corners */}
      <svg className="absolute top-4 left-4 opacity-20 w-20 h-20" viewBox="0 0 80 80" fill="none">
        <circle cx="10" cy="10" r="4" fill="hsl(208,98%,46%)" />
        <circle cx="30" cy="5" r="2.5" fill="hsl(195,95%,55%)" />
        <circle cx="5" cy="35" r="3" fill="hsl(38,95%,55%)" />
        <rect x="45" y="12" width="6" height="6" rx="1" fill="hsl(208,98%,46%)" transform="rotate(30 45 12)" />
        <rect x="18" y="50" width="5" height="5" rx="1" fill="hsl(195,95%,55%)" transform="rotate(15 18 50)" />
      </svg>
      <svg className="absolute bottom-4 right-4 opacity-20 w-20 h-20" viewBox="0 0 80 80" fill="none">
        <circle cx="70" cy="70" r="4" fill="hsl(208,98%,46%)" />
        <circle cx="50" cy="75" r="2.5" fill="hsl(195,95%,55%)" />
        <circle cx="75" cy="45" r="3" fill="hsl(38,95%,55%)" />
        <rect x="35" y="62" width="6" height="6" rx="1" fill="hsl(208,98%,46%)" transform="rotate(30 35 62)" />
        <rect x="60" y="30" width="5" height="5" rx="1" fill="hsl(195,95%,55%)" transform="rotate(15 60 30)" />
      </svg>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <FadeUpOnScroll>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            We Only Get Paid When You Win
          </h2>
        </FadeUpOnScroll>
        <FadeUpOnScroll delay={0.1}>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All of the emails, paperwork, meetings, calls, court appearances… it's all free unless we win your injury case.
          </p>
        </FadeUpOnScroll>
        <FadeUpOnScroll delay={0.2}>
          <a href={buildQuizUrl({ defaults: { utm_source: "CAC-Website", utm_medium: "Home_Page" }, ctaContent: "final_cta" })} rel="noopener">
            <GradientButton size="lg" className="group">
              START YOUR CLAIM NOW
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </GradientButton>
          </a>
        </FadeUpOnScroll>
      </div>
    </section>
  );
}