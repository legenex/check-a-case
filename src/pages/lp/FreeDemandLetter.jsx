import React from "react";
import LPShell, { LPHero, LPFinalCta } from "@/components/lp/LPShell";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { FileText, ArrowRight } from "lucide-react";

const REASONS = [
  { title: "Establishes You're Serious", desc: "A formal demand letter signals to the insurance company that you know your rights and won't be pushed around." },
  { title: "Sets The Anchor High", desc: "Your demand becomes the starting point for negotiation — not their lowball offer. Starting high gives you room to settle at fair value." },
  { title: "Creates A Paper Trail", desc: "A documented demand protects you legally and creates accountability. If they ignore it, it strengthens your case in court." },
  { title: "Forces A Response", desc: "Insurance companies are legally obligated to respond to formal demands in writing. It starts the clock on their obligation to resolve." },
];

const SAMPLE_LETTER = `RE: Personal Injury Demand — MVA on [Date]

Dear Claims Adjuster,

I am writing on behalf of [Claimant Name] to formally demand compensation for injuries sustained in the motor vehicle accident on [Date] in [State].

SUMMARY OF DAMAGES:
• Medical Expenses (to date): $18,500
• Future Medical Treatment: $12,000  
• Lost Wages: $6,400
• Pain & Suffering: $95,000

TOTAL DEMAND: $131,900

Please respond within 30 days. Failure to respond will result in escalation.

[Attorney Name]
CheckACase Legal Network`;

export default function FreeDemandLetter() {
  return (
    <LPShell>
      <LPHero
        eyebrow="12,000+ Letters Generated This Year"
        headline='Get A Free <span class="text-gradient-blue">Attorney-Drafted Demand Letter</span> For Your Insurance Claim'
        sub="In 2 minutes, our AI generates a professional demand letter you can send to the insurance company today. Used by 12,000+ accident victims this year."
        ctaText="Generate My Letter (Free)"
        ctaHref="/tools/demand-letter?s2=LP-letter&utm_source=lp"
      />

      {/* Sample letter preview */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <FadeUpOnScroll>
              <div className="relative">
                <div className="bg-white rounded-2xl border-2 border-border p-8 font-mono text-sm text-foreground/70 leading-relaxed shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-7xl font-black text-muted/10 rotate-[-25deg] select-none">SAMPLE</span>
                  </div>
                  <pre className="whitespace-pre-wrap relative z-10 text-xs leading-relaxed">{SAMPLE_LETTER}</pre>
                </div>
                <a href="/tools/demand-letter?s2=LP-letter-unlock&utm_source=lp" className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-white via-white/80 to-transparent pt-12 pb-4">
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-primary border-2 border-primary/30 bg-white hover:bg-primary/5 transition-colors text-sm">
                    <FileText className="w-4 h-4" /> Generate My Full Letter →
                  </span>
                </a>
              </div>
            </FadeUpOnScroll>
            <FadeUpOnScroll delay={0.1}>
              <div className="space-y-5">
                <h2 className="text-3xl font-black text-foreground">4 Reasons Demand Letters Force Higher Settlements</h2>
                {REASONS.map((r, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{i + 1}</span>
                    <div><h3 className="font-bold text-foreground">{r.title}</h3><p className="text-muted-foreground text-sm mt-0.5">{r.desc}</p></div>
                  </div>
                ))}
              </div>
            </FadeUpOnScroll>
          </div>
        </div>
      </section>

      <LPFinalCta
        ctaHref="/tools/demand-letter?s2=LP-letter-final&utm_source=lp"
        skipHref="/Survey?s2=LP-letter&utm_source=lp"
        skipLabel="Skip — Connect With An Attorney"
      />
    </LPShell>
  );
}