import React from "react";
import LPShell, { LPHero, LPFinalCta } from "@/components/lp/LPShell";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { ArrowRight } from "lucide-react";

const COST_BREAKDOWN = [
  { label: "Medical Treatment", pct: 38, color: "bg-red-500", amount: "$184,860" },
  { label: "Lost Wages & Income", pct: 29, color: "bg-orange-500", amount: "$141,030" },
  { label: "Future Care", pct: 22, color: "bg-yellow-500", amount: "$106,940" },
  { label: "Pain & Suffering", pct: 11, color: "bg-blue-500", amount: "$53,470" },
];

const STORIES = [
  { name: "Robert M.", injury: "Herniated disc (moderate)", initial: "$24,500", actual: "$187,000", diff: "$162,500" },
  { name: "Priya S.", injury: "TBI from rear-end collision", initial: "$45,000", actual: "$380,000", diff: "$335,000" },
  { name: "Carlos D.", injury: "Knee surgery + PT", initial: "$18,000", actual: "$142,000", diff: "$124,000" },
];

export default function TheRealCostOfYourInjury() {
  return (
    <LPShell>
      <LPHero
        eyebrow="The Numbers Most Accident Victims Never See"
        headline='Most Accident Victims Have <span class="text-gradient-blue">NO IDEA</span> What Their Injury Will Actually Cost Them'
        sub="Medical bills are just the start. We calculated the lifetime financial impact of common injuries. The numbers will shock you."
        ctaText="Calculate My Lifetime Cost"
        ctaHref="/tools/lifestyle-cost?s2=LP-realcost&utm_source=lp"
      />

      {/* Hero stat */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <FadeUpOnScroll>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Average Lifetime Cost</p>
            <p className="text-lg text-muted-foreground mb-2">Moderate back injury with surgery</p>
            <div className="text-7xl font-black text-foreground my-4">
              $<AnimatedCounter value={487000} />
            </div>
            <p className="text-muted-foreground">If you accept the first insurance offer, you might walk away with $25,000.</p>
          </FadeUpOnScroll>
        </div>
      </section>

      {/* Breakdown chart */}
      <section className="py-20 bg-surface-soft">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <FadeUpOnScroll className="text-center mb-10">
            <h2 className="text-4xl font-black text-foreground">Where The Money Goes</h2>
          </FadeUpOnScroll>
          <div className="bg-white rounded-2xl border border-border p-8 space-y-6">
            {COST_BREAKDOWN.map((c, i) => (
              <FadeUpOnScroll key={i} delay={i * 0.08}>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-foreground">{c.label}</span>
                    <span className="font-semibold text-foreground">{c.amount}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className={`h-3 rounded-full ${c.color} transition-all`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              </FadeUpOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Underestimation stories */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeUpOnScroll className="text-center mb-10">
            <h2 className="text-4xl font-black text-foreground">Real Underestimation Cases</h2>
            <p className="text-muted-foreground mt-2">People who almost left hundreds of thousands on the table</p>
          </FadeUpOnScroll>
          <div className="grid sm:grid-cols-3 gap-5">
            {STORIES.map((s, i) => (
              <FadeUpOnScroll key={i} delay={i * 0.1}>
                <div className="bg-surface-soft rounded-2xl border border-border p-6">
                  <p className="font-bold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground mb-4">{s.injury}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Insurance offered</span><span className="font-semibold text-red-500">{s.initial}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Actual value</span><span className="font-semibold text-green-600">{s.actual}</span></div>
                    <div className="flex justify-between border-t border-border pt-2"><span className="font-semibold text-foreground">Almost lost</span><span className="font-black text-primary">{s.diff}</span></div>
                  </div>
                </div>
              </FadeUpOnScroll>
            ))}
          </div>
        </div>
      </section>

      <LPFinalCta
        ctaHref="/tools/lifestyle-cost?s2=LP-realcost-final&utm_source=lp"
        skipHref="/Survey?s2=LP-realcost&utm_source=lp"
        skipLabel="Skip — Talk to an Attorney"
      />
    </LPShell>
  );
}