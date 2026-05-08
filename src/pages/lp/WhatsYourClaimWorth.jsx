import React from "react";
import LPShell, { LPHero, LPFinalCta } from "@/components/lp/LPShell";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { CheckCircle2, ArrowRight } from "lucide-react";

const HOW_IT_WORKS = [
  { step: "01", title: "Answer 7 quick questions", desc: "About your accident, injuries, and expenses. Takes 60 seconds." },
  { step: "02", title: "Get your estimate", desc: "We calculate your claim range using real settlement data from all 50 states." },
  { step: "03", title: "Connect with an attorney", desc: "A qualified attorney in your state reviews your case for free — no obligation." },
];

const SETTLEMENTS = [
  { name: "Maria T.", state: "CA", amount: "$284,000", type: "Auto accident — rear-end collision" },
  { name: "James R.", state: "TX", amount: "$127,500", type: "Workplace injury — forklift accident" },
  { name: "Sandra K.", state: "FL", amount: "$412,000", type: "Medical malpractice — surgical error" },
];

export default function WhatsYourClaimWorth() {
  return (
    <LPShell>
      <LPHero
        eyebrow="Free Claim Calculator — No Signup Required"
        headline='Find Out What Your Accident Claim Is <span class="text-gradient-blue">REALLY Worth</span> — In 60 Seconds'
        sub="Most accident victims accept the first insurance offer. They walk away with 25% of what their case is actually worth. Don't be one of them."
        ctaText="Calculate My Claim Value"
        ctaHref="/tools/claim-estimator?s2=LP-claimworth&utm_source=lp&utm_medium=lp-claimworth"
      />

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUpOnScroll className="text-center mb-12">
            <h2 className="text-4xl font-black text-foreground">How It Works</h2>
          </FadeUpOnScroll>
          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((s, i) => (
              <FadeUpOnScroll key={i} delay={i * 0.1}>
                <div className="bg-surface-soft rounded-2xl p-8">
                  <span className="text-5xl font-black text-primary/10">{s.step}</span>
                  <h3 className="text-xl font-bold text-foreground mt-3 mb-2">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              </FadeUpOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Real settlements */}
      <section className="py-20 bg-surface-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeUpOnScroll className="text-center mb-10">
            <h2 className="text-4xl font-black text-foreground">Real Settlements. Real People.</h2>
            <p className="text-muted-foreground mt-2">These are actual settlement examples from cases like yours.</p>
          </FadeUpOnScroll>
          <div className="grid sm:grid-cols-3 gap-5">
            {SETTLEMENTS.map((s, i) => (
              <FadeUpOnScroll key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl border border-border p-6 text-center">
                  <p className="text-3xl font-black text-primary mb-1">{s.amount}</p>
                  <p className="text-sm font-semibold text-foreground">{s.name} · {s.state}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.type}</p>
                </div>
              </FadeUpOnScroll>
            ))}
          </div>
        </div>
      </section>

      <LPFinalCta
        ctaHref="/tools/claim-estimator?s2=LP-claimworth-final&utm_source=lp"
        skipHref="/Survey?s2=LP-claimworth&utm_source=lp"
        skipLabel="Skip Calculator — Talk to an Attorney"
      />
    </LPShell>
  );
}