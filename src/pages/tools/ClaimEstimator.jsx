import React, { useState } from "react";
import { buildQuizUrl } from "@/lib/quizUrl";
import { base44 } from "@/api/base44Client";
import { calculateEstimate, formatMoney, STATE_FACTORS } from "@/lib/claimCalc";
import { ArrowRight, ChevronLeft, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const US_STATES = Object.keys(STATE_FACTORS).sort();

const ACCIDENT_TYPES = [
  { value: "auto", label: "🚗 Auto / Car Accident" },
  { value: "slip_fall", label: "🏥 Slip & Fall" },
  { value: "work", label: "🔧 Work / Workplace Injury" },
  { value: "medical_malpractice", label: "⚕️ Medical Malpractice" },
  { value: "other", label: "📋 Other Injury" },
];

const INJURY_LEVELS = [
  { value: "minor", label: "Minor", desc: "Sprains, bruises, minor cuts — no surgery" },
  { value: "moderate", label: "Moderate", desc: "Soft tissue, short-term physical therapy" },
  { value: "serious", label: "Serious", desc: "Broken bones, surgery, 3-6 months recovery" },
  { value: "severe", label: "Severe", desc: "Permanent limitation, long-term treatment" },
  { value: "catastrophic", label: "Catastrophic", desc: "Permanent disability / life-altering" },
];

const MEDICAL_CHIPS = [
  { label: "Under $5K", value: 4000 },
  { label: "$5K–$15K", value: 10000 },
  { label: "$15K–$50K", value: 32500 },
  { label: "$50K–$100K", value: 75000 },
  { label: "$100K+", value: 150000 },
];

const steps = ["accident", "state", "injury", "medical", "work", "ongoing", "fault", "lead"];

function ProgressBar({ current }) {
  const pct = Math.round(((current) / (steps.length - 1)) * 100);
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mb-8">
      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "hsl(var(--primary))" }} />
    </div>
  );
}

function StepCard({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-xl mx-auto"
    >
      {children}
    </motion.div>
  );
}

function OptionBtn({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium transition-all ${
        selected
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-white hover:border-primary/40 text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function ClaimEstimator() {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({
    accident_type: "", state: "", injury_severity: "", medical_bills: "",
    missed_work_days: 0, ongoing_treatment: "", fault: "",
    first_name: "", email: "", phone: "", zip: "",
  });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const step = steps[stepIdx];
  const set = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const selectAndAdvance = (k, v) => {
    set(k, v);
    setTimeout(next, 120);
  };

  const handleSubmit = async () => {
    if (!answers.first_name || !answers.phone) return;
    setSubmitting(true);
    const attribution = JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
    const calc = calculateEstimate({
      medical_bills: Number(answers.medical_bills),
      missed_work_days: Number(answers.missed_work_days),
      ongoing_treatment: answers.ongoing_treatment,
      injury_severity: answers.injury_severity,
      state: answers.state,
      fault: answers.fault,
    });

    // Create Lead
    const lead = await base44.entities.Lead.create({
      first_name: answers.first_name,
      email: answers.email,
      phone: answers.phone,
      zip_code: answers.zip,
      state: answers.state,
      accident_type: answers.accident_type,
      source: "tool-claim-estimator",
      attribution,
    });

    // Create ClaimEstimate
    await base44.entities.ClaimEstimate.create({
      lead_id: lead.id,
      accident_type: answers.accident_type,
      state: answers.state,
      injury_severity: answers.injury_severity,
      medical_bills: Number(answers.medical_bills),
      missed_work_days: Number(answers.missed_work_days),
      ongoing_treatment: answers.ongoing_treatment,
      fault: answers.fault,
      estimate_low: calc.displayLow,
      estimate_high: calc.displayHigh,
      economic_damages: calc.economic,
      state_factor: calc.stateFactor,
      tool_source: "claim-estimator",
      attribution,
    });

    setResult(calc);
    setSubmitting(false);
  };

  const surveyUrl = buildQuizUrl({ defaults: { utm_source: "CAC-Site", utm_medium: "claim-estimator", utm_campaign: "Tool" }, ctaContent: "tool_results_cta" });

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <a href="/">
          <img src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png" alt="Check A Case" className="h-9 w-auto" />
        </a>
        <span className="text-sm font-semibold text-muted-foreground">Free Claim Estimator</span>
      </div>

      {result ? (
        <ResultScreen result={result} answers={answers} surveyUrl={surveyUrl} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            {stepIdx === 0 && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Free Case Estimator</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-2">What's Your Claim Worth?</h1>
                <p className="text-muted-foreground">Answer 7 quick questions to see your personalized estimate.</p>
              </div>
            )}

            <ProgressBar current={stepIdx} />

            <AnimatePresence mode="wait">
              {step === "accident" && (
                <StepCard key="accident">
                  <h2 className="text-xl font-bold text-foreground mb-5">What type of accident were you in?</h2>
                  <div className="space-y-2.5">
                    {ACCIDENT_TYPES.map((o) => (
                      <OptionBtn key={o.value} selected={answers.accident_type === o.value} onClick={() => selectAndAdvance("accident_type", o.value)}>
                        {o.label}
                      </OptionBtn>
                    ))}
                  </div>
                </StepCard>
              )}

              {step === "state" && (
                <StepCard key="state">
                  <h2 className="text-xl font-bold text-foreground mb-5">Which state did the accident happen in?</h2>
                  <select
                    className="w-full border border-border rounded-2xl px-4 py-4 text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-ring text-base"
                    value={answers.state}
                    onChange={(e) => { set("state", e.target.value); if (e.target.value) setTimeout(next, 120); }}
                  >
                    <option value="">Select a state…</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </StepCard>
              )}

              {step === "injury" && (
                <StepCard key="injury">
                  <h2 className="text-xl font-bold text-foreground mb-5">How would you describe your injuries?</h2>
                  <div className="space-y-2.5">
                    {INJURY_LEVELS.map((o) => (
                      <OptionBtn key={o.value} selected={answers.injury_severity === o.value} onClick={() => selectAndAdvance("injury_severity", o.value)}>
                        <span className="font-semibold">{o.label}</span>
                        <span className="block text-sm text-muted-foreground font-normal">{o.desc}</span>
                      </OptionBtn>
                    ))}
                  </div>
                </StepCard>
              )}

              {step === "medical" && (
                <StepCard key="medical">
                  <h2 className="text-xl font-bold text-foreground mb-2">What were your total medical bills so far?</h2>
                  <p className="text-muted-foreground text-sm mb-5">Include ER visits, imaging, physical therapy, surgery.</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {MEDICAL_CHIPS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => { set("medical_bills", c.value); setTimeout(next, 120); }}
                        className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                          answers.medical_bills === c.value ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-foreground hover:border-primary/40"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Or enter exact amount…"
                      value={answers.medical_bills || ""}
                      onChange={(e) => set("medical_bills", e.target.value)}
                      className="rounded-xl"
                    />
                    <Button onClick={next} className="rounded-xl">Next</Button>
                  </div>
                </StepCard>
              )}

              {step === "work" && (
                <StepCard key="work">
                  <h2 className="text-xl font-bold text-foreground mb-5">How many days of work have you missed?</h2>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={answers.missed_work_days || ""}
                    onChange={(e) => set("missed_work_days", e.target.value)}
                    className="rounded-xl text-lg py-4 text-center"
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-center">We estimate $300/day in lost wages (adjust after).</p>
                  <Button onClick={next} className="w-full mt-4 rounded-xl">Next →</Button>
                </StepCard>
              )}

              {step === "ongoing" && (
                <StepCard key="ongoing">
                  <h2 className="text-xl font-bold text-foreground mb-5">Will you need ongoing medical treatment?</h2>
                  <div className="space-y-2.5">
                    {[["yes","Yes — I'll need continued care"],["no","No — I've recovered"],["unsure","Unsure / Still being diagnosed"]].map(([v, l]) => (
                      <OptionBtn key={v} selected={answers.ongoing_treatment === v} onClick={() => selectAndAdvance("ongoing_treatment", v)}>
                        {l}
                      </OptionBtn>
                    ))}
                  </div>
                </StepCard>
              )}

              {step === "fault" && (
                <StepCard key="fault">
                  <h2 className="text-xl font-bold text-foreground mb-5">Was the other party clearly at fault?</h2>
                  <div className="space-y-2.5">
                    {[["yes","Yes — they were 100% at fault"],["partially","Partially — fault is shared"],["no","No — I'm not sure / disputed"]].map(([v, l]) => (
                      <OptionBtn key={v} selected={answers.fault === v} onClick={() => selectAndAdvance("fault", v)}>
                        {l}
                      </OptionBtn>
                    ))}
                  </div>
                </StepCard>
              )}

              {step === "lead" && (
                <StepCard key="lead">
                  <div className="text-center mb-6">
                    <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h2 className="text-2xl font-black text-foreground">Get Your Detailed Estimate</h2>
                    <p className="text-muted-foreground text-sm mt-1">Your personalized breakdown is ready. Enter your info to unlock it.</p>
                  </div>
                  <div className="space-y-3">
                    <Input placeholder="First Name *" value={answers.first_name} onChange={(e) => set("first_name", e.target.value)} className="rounded-xl" />
                    <Input type="tel" placeholder="Phone Number *" value={answers.phone} onChange={(e) => set("phone", e.target.value)} className="rounded-xl" />
                    <Input type="email" placeholder="Email Address" value={answers.email} onChange={(e) => set("email", e.target.value)} className="rounded-xl" />
                    <Input placeholder="Zip Code" value={answers.zip} onChange={(e) => set("zip", e.target.value)} className="rounded-xl" />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !answers.first_name || !answers.phone}
                    className="w-full mt-4 rounded-xl h-14 text-lg font-bold btn-gradient border-0"
                  >
                    {submitting ? "Calculating…" : "Show My Estimate →"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">By continuing, you agree to be contacted by an attorney. No spam.</p>
                </StepCard>
              )}
            </AnimatePresence>

            {stepIdx > 0 && step !== "lead" && (
              <button onClick={back} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-6 mx-auto">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
        </div>
      )}

      <div className="py-4 px-4 text-center text-xs text-muted-foreground border-t border-border">
        Estimates are illustrative and based on general case data. Actual settlements vary. Not legal advice.
      </div>
    </div>
  );
}

function ResultScreen({ result, answers, surveyUrl }) {
  const gap = result.displayHigh - result.insuranceOffer;
  return (
    <div className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Your Estimated Claim Value</p>
          <div className="flex items-end justify-center gap-2 mb-1">
            <span className="text-4xl font-bold text-foreground/70">{formatMoney(result.displayLow)}</span>
            <span className="text-2xl text-muted-foreground mb-1">–</span>
            <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--brand-blue)) 0%, hsl(var(--brand-cyan)) 100%)" }}>
              {formatMoney(result.displayHigh)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">with legal representation in {answers.state || "your state"}</p>
        </div>

        {/* Breakdown */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-6 space-y-3">
          <h3 className="font-bold text-foreground mb-4">Estimate Breakdown</h3>
          {[
            ["Medical Expenses", formatMoney(Number(answers.medical_bills) || 0)],
            ["Lost Wages Estimate", formatMoney((Number(answers.missed_work_days) || 0) * 300)],
            ["Future Medical (est.)", answers.ongoing_treatment === "yes" ? "$18,000" : answers.ongoing_treatment === "unsure" ? "$9,000" : "$0"],
            ["Pain & Suffering (non-economic)", `${formatMoney(result.displayLow)} – ${formatMoney(result.displayHigh)}`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-center border-b border-border/50 pb-3 last:border-0 last:pb-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{val}</span>
            </div>
          ))}
        </div>

        {/* Insurance anchor panel */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-orange-800 mb-1">Insurance Company's Likely Opening Offer</p>
              <p className="text-3xl font-black text-orange-600 mb-2">{formatMoney(result.insuranceOffer)}</p>
              <p className="text-sm text-orange-700">That's approximately 25% of what an attorney typically negotiates. You could be leaving <strong>{formatMoney(gap)}</strong> on the table.</p>
            </div>
          </div>
        </div>

        <a
          href={surveyUrl}
          className="flex items-center justify-center gap-2 w-full py-5 rounded-2xl text-lg font-bold text-white btn-gradient shadow-xl shadow-blue-500/20 hover:brightness-110 transition-all group"
        >
          Get Connected With An Attorney Now
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </a>
        <p className="text-center text-xs text-muted-foreground mt-3">Free. No obligation. No upfront fees.</p>
      </motion.div>
    </div>
  );
}