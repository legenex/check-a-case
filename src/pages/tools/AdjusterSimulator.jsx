import React, { useState, useEffect, useRef } from "react";
import { buildQuizUrl } from "@/lib/quizUrl";
import { base44 } from "@/api/base44Client";
import { calculateEstimate, formatMoney, STATE_FACTORS } from "@/lib/claimCalc";
import { ArrowRight, AlertTriangle, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CASE_TYPES = [
  { value: "auto", label: "🚗 Auto / Car Accident" },
  { value: "slip_fall", label: "🏥 Slip & Fall" },
  { value: "work", label: "🔧 Workplace Injury" },
  { value: "medical_malpractice", label: "⚕️ Medical Malpractice" },
];
const SEVERITY = [
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "serious", label: "Serious" },
  { value: "severe", label: "Severe" },
  { value: "catastrophic", label: "Catastrophic" },
];

function Counter({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0; const duration = 1800; const step = 16;
    const inc = target / (duration / step);
    const t = setInterval(() => {
      start += inc;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, step);
    return () => clearInterval(t);
  }, [target]);
  return <span>{formatMoney(val)}</span>;
}

function OptionBtn({ selected, onClick, children }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium transition-all ${selected ? "border-primary bg-primary/5 text-primary" : "border-border bg-white hover:border-primary/40 text-foreground"}`}>
      {children}
    </button>
  );
}

export default function AdjusterSimulator() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ case_type: "", severity: "", had_attorney: "no", first_name: "", phone: "", email: "" });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const set = (k, v) => setAnswers(a => ({ ...a, [k]: v }));
  const next = () => setStep(s => s + 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    const attribution = JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
    const calc = calculateEstimate({ medical_bills: 15000, missed_work_days: 20, ongoing_treatment: "yes", injury_severity: answers.severity || "moderate", state: "CA", fault: "yes" });
    const adjusterOffer = Math.round(calc.displayHigh * (0.22 + Math.random() * 0.06) / 100) * 100;
    const attorneyValue = Math.round(calc.displayHigh * 1.15 / 100) * 100;
    await base44.entities.Lead.create({ first_name: answers.first_name, phone: answers.phone, email: answers.email, accident_type: answers.case_type, source: "tool-adjuster-simulator", attribution });
    setResult({ adjusterOffer, attorneyValue, gap: attorneyValue - adjusterOffer });
    setSubmitting(false);
  };

  const surveyUrl = buildQuizUrl({ defaults: { utm_source: "CAC-Site", utm_medium: "adjuster-simulator", utm_campaign: "Tool" }, ctaContent: "tool_results_cta" });

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <div className="bg-white border-b border-border px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <a href="/"><img src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png" alt="Check A Case" className="h-9 w-auto" /></a>
        <span className="text-sm font-semibold text-muted-foreground">Adjuster Lowball Simulator</span>
      </div>

      {result ? (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full space-y-6">
          <div className="text-center mb-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Simulation Complete</p>
            <h2 className="text-3xl font-black text-foreground">Here's What Would Happen To Your Claim</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">Insurance Adjuster's Offer</p>
              <p className="text-4xl font-black text-red-600"><Counter target={result.adjusterOffer} /></p>
              <p className="text-xs text-red-500 mt-2">Typical opening offer</p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">With An Attorney</p>
              <p className="text-4xl font-black text-green-700"><Counter target={result.attorneyValue} /></p>
              <p className="text-xs text-green-600 mt-2">Typical represented settlement</p>
            </div>
          </div>
          <div className="bg-foreground text-background rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-background/60 uppercase tracking-wide mb-1">You'd Be Leaving On The Table</p>
            <p className="text-5xl font-black text-amber-400"><Counter target={result.gap} /></p>
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <button onClick={() => setWhyOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4 font-semibold text-foreground">
              Why is there such a big difference?
              {whyOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {whyOpen && (
              <div className="px-6 pb-5 text-sm text-muted-foreground space-y-3">
                <p>Insurance adjusters are trained negotiators whose job is to minimize payouts. Studies show unrepresented claimants receive on average <strong>25–35% of what represented claimants receive</strong> for the same injuries.</p>
                <p>Tactics include: anchoring low, recorded statement traps, quick settlement pressure before injuries are fully diagnosed, and downplaying long-term impact.</p>
                <p>An attorney levels the playing field — and since they work on contingency, you pay nothing unless you win.</p>
              </div>
            )}
          </div>

          <a href={surveyUrl} className="flex items-center justify-center gap-2 w-full py-5 rounded-2xl text-lg font-bold text-white btn-gradient shadow-xl hover:brightness-110 transition-all group">
            Don't Let This Happen — Get An Attorney Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <p className="text-center text-xs text-muted-foreground">Estimates are illustrative. Actual settlements vary. Not legal advice.</p>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            {step === 0 && <div className="text-center mb-8"><h1 className="text-3xl font-black text-foreground mb-2">Insurance Adjuster Lowball Simulator</h1><p className="text-muted-foreground">See exactly how much an insurance company would try to underpay you — and what an attorney would get instead.</p></div>}
            <AnimatePresence mode="wait">
              {step === 0 && <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-2.5">
                <h2 className="text-xl font-bold text-foreground mb-4">What type of case?</h2>
                {CASE_TYPES.map(o => <OptionBtn key={o.value} selected={answers.case_type === o.value} onClick={() => { set("case_type", o.value); setTimeout(next, 120); }}>{o.label}</OptionBtn>)}
              </motion.div>}
              {step === 1 && <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-2.5">
                <h2 className="text-xl font-bold text-foreground mb-4">Injury severity?</h2>
                {SEVERITY.map(o => <OptionBtn key={o.value} selected={answers.severity === o.value} onClick={() => { set("severity", o.value); setTimeout(next, 120); }}>{o.label}</OptionBtn>)}
              </motion.div>}
              {step === 2 && <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-2.5">
                <h2 className="text-xl font-bold text-foreground mb-4">Did you have an attorney?</h2>
                {[["no","No, I handled it myself"],["yes","Yes, I had an attorney"]].map(([v, l]) => <OptionBtn key={v} selected={answers.had_attorney === v} onClick={() => { set("had_attorney", v); setTimeout(next, 120); }}>{l}</OptionBtn>)}
              </motion.div>}
              {step === 3 && <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-2xl font-black text-foreground mb-1">Unlock Your Simulation Results</h2>
                <p className="text-muted-foreground text-sm mb-5">See the real numbers side by side.</p>
                <div className="space-y-3">
                  <Input placeholder="First Name *" value={answers.first_name} onChange={e => set("first_name", e.target.value)} className="rounded-xl" />
                  <Input type="tel" placeholder="Phone *" value={answers.phone} onChange={e => set("phone", e.target.value)} className="rounded-xl" />
                  <Input type="email" placeholder="Email" value={answers.email} onChange={e => set("email", e.target.value)} className="rounded-xl" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !answers.first_name || !answers.phone} className="w-full mt-4 rounded-xl h-14 text-lg font-bold btn-gradient border-0">
                  {submitting ? "Running Simulation…" : "Run My Simulation →"}
                </Button>
              </motion.div>}
            </AnimatePresence>
            {step > 0 && step < 3 && <button onClick={() => setStep(s => s - 1)} className="mt-6 text-sm text-muted-foreground hover:text-foreground">← Back</button>}
          </div>
        </div>
      )}
    </div>
  );
}