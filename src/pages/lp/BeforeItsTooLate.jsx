import React from "react";
import LPShell, { LPHero, LPFinalCta } from "@/components/lp/LPShell";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { AlertTriangle } from "lucide-react";

const STATE_SOL_TABLE = [
  { state: "California", years: 2 }, { state: "New York", years: 3 },
  { state: "Texas", years: 2 }, { state: "Florida", years: 2 },
  { state: "Illinois", years: 2 }, { state: "Pennsylvania", years: 2 },
  { state: "Ohio", years: 2 }, { state: "Georgia", years: 2 },
  { state: "Michigan", years: 3 }, { state: "New Jersey", years: 2 },
  { state: "Washington", years: 3 }, { state: "Massachusetts", years: 3 },
];

const STORIES = [
  { headline: "Lisa waited 2 years and 3 months", body: "She thought she had more time. California's 2-year SOL expired before she contacted an attorney. Her $180,000 claim was completely barred — zero recovery." },
  { headline: "David missed by 8 days", body: "Tennessee has only a 1-year SOL for personal injury. He filed 8 days late. The judge dismissed the case immediately." },
  { headline: "Marcus didn't know about the SOL at all", body: "He settled directly with the insurance company for $12,000. An attorney later told him his case was worth over $90,000 — but the deadline had already passed." },
];

export default function BeforeItsTooLate() {
  return (
    <LPShell>
      <LPHero
        eyebrow="Your Deadline Is Counting Down Right Now"
        headline='Your Right To Compensation Is <span class="text-gradient-blue">Disappearing</span> — Day By Day'
        sub="Every state has a strict deadline (statute of limitations). Miss it, and you get nothing. Here's how much time you have left."
        ctaText="Check My State's Deadline"
        ctaHref="/tools/crash-clock?s2=LP-toolate&utm_source=lp&utm_medium=lp-toolate"
      />

      {/* SOL table */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeUpOnScroll className="text-center mb-10">
            <h2 className="text-4xl font-black text-foreground">Deadlines By State</h2>
            <p className="text-muted-foreground mt-2">Personal injury statute of limitations (years)</p>
          </FadeUpOnScroll>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {STATE_SOL_TABLE.map((s, i) => (
              <FadeUpOnScroll key={i} delay={i * 0.04}>
                <div className={`rounded-xl border p-4 text-center ${s.years <= 1 ? "border-red-200 bg-red-50" : s.years === 2 ? "border-orange-200 bg-orange-50" : "border-border bg-surface-soft"}`}>
                  <p className="font-semibold text-foreground text-sm">{s.state}</p>
                  <p className={`text-2xl font-black mt-1 ${s.years <= 1 ? "text-red-600" : s.years === 2 ? "text-orange-600" : "text-foreground"}`}>{s.years}yr</p>
                </div>
              </FadeUpOnScroll>
            ))}
          </div>
          <div className="flex gap-4 mt-6 flex-wrap text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> 1 year or less (critical)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-200 inline-block" /> 2 years</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted inline-block" /> 3+ years</span>
          </div>
        </div>
      </section>

      {/* Stories */}
      <section className="py-20 bg-surface-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeUpOnScroll className="text-center mb-10">
            <h2 className="text-4xl font-black text-foreground">They Waited Too Long</h2>
          </FadeUpOnScroll>
          <div className="space-y-5">
            {STORIES.map((s, i) => (
              <FadeUpOnScroll key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl border border-border p-7 flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div><h3 className="font-bold text-foreground mb-1">{s.headline}</h3><p className="text-muted-foreground text-sm">{s.body}</p></div>
                </div>
              </FadeUpOnScroll>
            ))}
          </div>
        </div>
      </section>

      <LPFinalCta
        ctaHref="/tools/crash-clock?s2=LP-toolate-final&utm_source=lp"
        skipHref="/Survey?s2=LP-toolate&utm_source=lp"
        skipLabel="Skip — Talk to an Attorney Now"
      />
    </LPShell>
  );
}