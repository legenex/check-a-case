import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INCOME_TIERS = [
  { label: "Under $30K/yr", value: 25000 },
  { label: "$30K–$60K/yr", value: 45000 },
  { label: "$60K–$100K/yr", value: 80000 },
  { label: "$100K–$200K/yr", value: 150000 },
  { label: "$200K+/yr", value: 250000 },
];
const SEVERITY_DOLLARS = { minor: 50000, moderate: 150000, serious: 350000, severe: 600000, catastrophic: 1200000 };
const WORK_LOSS = { none: 0, partial: 0.35, full: 0.80 };
const CARE_COST = { none: 0, occasional: 3000, regular: 8000, intensive: 18000 };

function formatMoney(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

function OptionBtn({ selected, onClick, children }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium transition-all ${selected ? "border-primary bg-primary/5 text-primary" : "border-border bg-white hover:border-primary/40 text-foreground"}`}>
      {children}
    </button>
  );
}

const steps = ["age", "income", "severity", "work", "care", "lead"];

export default function LifestyleCost() {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({ age: "", income: 0, severity: "", work_loss: "", care: "", first_name: "", phone: "", email: "" });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setAnswers(a => ({ ...a, [k]: v }));
  const next = () => setStepIdx(i => Math.min(i + 1, steps.length - 1));
  const step = steps[stepIdx];

  const handleSubmit = async () => {
    setSubmitting(true);
    const attribution = JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
    const yearsRemaining = Math.max(40, 65 - Number(answers.age || 40));
    const workLossPct = WORK_LOSS[answers.work_loss] || 0;
    const careAnnual = CARE_COST[answers.care] || 0;
    const sevDollars = SEVERITY_DOLLARS[answers.severity] || 150000;
    const lostIncome = answers.income * workLossPct * yearsRemaining;
    const ongoingMedical = careAnnual * yearsRemaining;
    const painQoL = sevDollars * (yearsRemaining / 40);
    const raw = lostIncome + ongoingMedical + painQoL;
    const displayed = Math.round(raw * 1.15 / 1000) * 1000; // 1.15x upper-end bias
    await base44.entities.Lead.create({ first_name: answers.first_name, phone: answers.phone, email: answers.email, source: "tool-lifestyle-cost", attribution });
    setResult({ displayed, lostIncome, ongoingMedical, painQoL });
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <div className="bg-white border-b border-border px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <a href="/"><img src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png" alt="Check A Case" className="h-9 w-auto" /></a>
        <span className="text-sm font-semibold text-muted-foreground">Lifetime Injury Cost Calculator</span>
      </div>
      {result ? (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full space-y-6">
          <div className="text-center">
            <TrendingDown className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-3xl font-black text-foreground leading-tight mb-1">Your Injury Could Cost You</h2>
            <p className="text-6xl font-black text-red-600 my-3">{formatMoney(result.displayed)}</p>
            <p className="text-muted-foreground text-lg">over your lifetime if you don't claim what you're owed.</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">Breakdown</h3>
            {[
              { label: "Lost Lifetime Income", val: result.lostIncome, color: "bg-red-500" },
              { label: "Ongoing Medical Care", val: result.ongoingMedical, color: "bg-orange-500" },
              { label: "Pain & Quality of Life", val: result.painQoL, color: "bg-yellow-500" },
            ].map(({ label, val, color }) => {
              const pct = result.displayed > 0 ? Math.round((val / result.displayed) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{formatMoney(val)}</span></div>
                  <div className="w-full bg-muted rounded-full h-2"><div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
          <a href="/Survey?s2=TOOL-lifestyle&utm_source=tool&utm_medium=lifestyle-cost" className="flex items-center justify-center gap-2 w-full py-5 rounded-2xl text-lg font-bold text-white btn-gradient shadow-xl hover:brightness-110 transition-all group">
            Recover This Now <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <p className="text-center text-xs text-muted-foreground">Estimates are illustrative. Actual costs vary. Not legal advice.</p>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            {stepIdx === 0 && <div className="text-center mb-8"><h1 className="text-3xl font-black text-foreground mb-2">Lifetime Injury Cost Calculator</h1><p className="text-muted-foreground">See the full financial picture of your injury — not just the medical bills.</p></div>}
            <AnimatePresence mode="wait">
              {step === "age" && <motion.div key="age" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-5">How old were you at the time of injury?</h2>
                <Input type="number" min={18} max={80} placeholder="Your age…" value={answers.age} onChange={e => set("age", e.target.value)} className="rounded-xl text-center text-lg" />
                <Button onClick={next} disabled={!answers.age} className="w-full mt-4 rounded-xl">Next →</Button>
              </motion.div>}
              {step === "income" && <motion.div key="income" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-2.5">
                <h2 className="text-xl font-bold text-foreground mb-4">What's your annual income level?</h2>
                {INCOME_TIERS.map(o => <OptionBtn key={o.value} selected={answers.income === o.value} onClick={() => { set("income", o.value); setTimeout(next, 120); }}>{o.label}</OptionBtn>)}
              </motion.div>}
              {step === "severity" && <motion.div key="sev" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-2.5">
                <h2 className="text-xl font-bold text-foreground mb-4">How severe are your injuries?</h2>
                {Object.keys(SEVERITY_DOLLARS).map(v => <OptionBtn key={v} selected={answers.severity === v} onClick={() => { set("severity", v); setTimeout(next, 120); }}>{v.charAt(0).toUpperCase() + v.slice(1)}</OptionBtn>)}
              </motion.div>}
              {step === "work" && <motion.div key="work" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-2.5">
                <h2 className="text-xl font-bold text-foreground mb-4">Will the injury affect your long-term ability to work?</h2>
                {[["none","No impact on work capacity"],["partial","Partial impact — some limitations"],["full","Full impact — unable to work as before"]].map(([v, l]) => <OptionBtn key={v} selected={answers.work_loss === v} onClick={() => { set("work_loss", v); setTimeout(next, 120); }}>{l}</OptionBtn>)}
              </motion.div>}
              {step === "care" && <motion.div key="care" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-2.5">
                <h2 className="text-xl font-bold text-foreground mb-4">How much ongoing care will you need?</h2>
                {[["none","None"],["occasional","Occasional check-ups"],["regular","Regular physical therapy"],["intensive","Intensive ongoing care"]].map(([v, l]) => <OptionBtn key={v} selected={answers.care === v} onClick={() => { set("care", v); setTimeout(next, 120); }}>{l}</OptionBtn>)}
              </motion.div>}
              {step === "lead" && <motion.div key="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-2xl font-black text-foreground mb-1">Get Your Lifetime Cost Breakdown</h2>
                <p className="text-muted-foreground text-sm mb-5">Your personalized calculation is ready.</p>
                <div className="space-y-3">
                  <Input placeholder="First Name *" value={answers.first_name} onChange={e => set("first_name", e.target.value)} className="rounded-xl" />
                  <Input type="tel" placeholder="Phone *" value={answers.phone} onChange={e => set("phone", e.target.value)} className="rounded-xl" />
                  <Input type="email" placeholder="Email" value={answers.email} onChange={e => set("email", e.target.value)} className="rounded-xl" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !answers.first_name || !answers.phone} className="w-full mt-4 h-14 text-lg font-bold rounded-2xl btn-gradient border-0">
                  {submitting ? "Calculating…" : "Show My Lifetime Cost →"}
                </Button>
              </motion.div>}
            </AnimatePresence>
            {stepIdx > 0 && step !== "lead" && <button onClick={() => setStepIdx(i => i - 1)} className="mt-6 text-sm text-muted-foreground hover:text-foreground">← Back</button>}
          </div>
        </div>
      )}
    </div>
  );
}