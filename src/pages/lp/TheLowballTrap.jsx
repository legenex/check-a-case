import React from "react";
import LPShell, { LPHero, LPFinalCta } from "@/components/lp/LPShell";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { ShieldAlert, ArrowRight } from "lucide-react";

const TACTICS = [
  { num: "01", title: "Anchoring Low", desc: "The adjuster's first offer is designed to anchor your perception of what's fair. Studies show people rarely negotiate more than 15-20% above the opening number — regardless of what the case is actually worth." },
  { num: "02", title: "Recorded Statement Traps", desc: "They ask you to give a recorded statement 'for their records.' Your words will be used to minimize your injuries and find inconsistencies in your story." },
  { num: "03", title: "Quick Settlement Pressure", desc: "They push you to settle before you understand the full extent of your injuries. Once you sign, there's no going back — even if your condition worsens." },
  { num: "04", title: "Downplaying Your Injuries", desc: "Adjusters are trained to find evidence that your injuries were pre-existing or less severe than you claim. They pull medical records looking for ammunition." },
  { num: "05", title: "Denying Causation", desc: "Even when liability is clear, they dispute that your injuries were caused by the accident. This creates doubt and reduces what they're willing to pay." },
];

export default function TheLowballTrap() {
  return (
    <LPShell>
      <LPHero
        eyebrow="Insurance Industry Exposé"
        headline='5 Tricks Insurance Adjusters Use To Pay You <span class="text-gradient-blue">25% Of What You Deserve</span>'
        sub="We pulled back the curtain on the playbook insurance companies use against unrepresented accident victims. Read this before you accept any offer."
        ctaText="Run The Adjuster Simulation"
        ctaHref="/tools/adjuster-simulator?s2=LP-lowball&utm_source=lp"
      />

      {/* Tactics */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeUpOnScroll className="text-center mb-12">
            <h2 className="text-4xl font-black text-foreground">The 5 Tactics They Use Against You</h2>
          </FadeUpOnScroll>
          <div className="space-y-5">
            {TACTICS.map((t, i) => (
              <FadeUpOnScroll key={i} delay={i * 0.07}>
                <div className="bg-surface-soft rounded-2xl p-7 flex gap-5">
                  <span className="text-5xl font-black text-primary/15 leading-none flex-shrink-0 -mt-1">{t.num}</span>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              </FadeUpOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Stats comparison */}
      <section className="py-20 bg-surface-soft">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeUpOnScroll>
            <h2 className="text-4xl font-black text-foreground mb-10">Represented vs. Unrepresented</h2>
          </FadeUpOnScroll>
          <div className="grid grid-cols-2 gap-6">
            <FadeUpOnScroll delay={0.1}>
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
                <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">Without Attorney</p>
                <p className="text-5xl font-black text-red-600 mb-2">$31K</p>
                <p className="text-sm text-red-500">Avg settlement, unrepresented</p>
              </div>
            </FadeUpOnScroll>
            <FadeUpOnScroll delay={0.15}>
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8">
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">With Attorney</p>
                <p className="text-5xl font-black text-green-700 mb-2">$77K</p>
                <p className="text-sm text-green-600">Avg settlement, represented</p>
              </div>
            </FadeUpOnScroll>
          </div>
          <FadeUpOnScroll delay={0.2} className="mt-8">
            <a href="/tools/adjuster-simulator?s2=LP-lowball-mid&utm_source=lp" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white btn-gradient shadow-lg hover:brightness-110 transition-all">
              See The Simulation For Your Case <ArrowRight className="w-5 h-5" />
            </a>
          </FadeUpOnScroll>
        </div>
      </section>

      <LPFinalCta
        ctaHref="/tools/adjuster-simulator?s2=LP-lowball-final&utm_source=lp"
        skipHref="/Survey?s2=LP-lowball&utm_source=lp"
        skipLabel="Skip — Talk to an Attorney"
      />
    </LPShell>
  );
}