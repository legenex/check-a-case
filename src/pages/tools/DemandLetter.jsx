import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { calculateEstimate, STATE_FACTORS } from "@/lib/claimCalc";
import { ArrowRight, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const US_STATES = Object.keys(STATE_FACTORS).sort();
const steps = ["accident", "other_party", "injuries", "financials", "pain", "lead"];

function OptionBtn({ selected, onClick, children }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium transition-all ${selected ? "border-primary bg-primary/5 text-primary" : "border-border bg-white hover:border-primary/40 text-foreground"}`}>
      {children}
    </button>
  );
}

export default function DemandLetter() {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({
    accident_type: "", accident_date: "", state: "",
    other_name: "", insurance_company: "",
    injuries: "", medical_expenses: "", lost_wages: "", pain_description: "",
    first_name: "", phone: "", email: "",
  });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setAnswers(a => ({ ...a, [k]: v }));
  const next = () => setStepIdx(i => Math.min(i + 1, steps.length - 1));
  const step = steps[stepIdx];

  const handleSubmit = async () => {
    setSubmitting(true);
    const attribution = JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
    const calc = calculateEstimate({ medical_bills: Number(answers.medical_expenses) || 10000, missed_work_days: Math.round((Number(answers.lost_wages) || 0) / 300), ongoing_treatment: "yes", injury_severity: "moderate", state: answers.state || "CA", fault: "yes" });
    const demandAmount = Math.round(calc.displayHigh * 1.10 / 100) * 100; // bias per spec

    const prompt = `You are a professional personal injury attorney drafting a formal demand letter.

Client details:
- Name: ${answers.first_name}
- Accident type: ${answers.accident_type}
- Accident date: ${answers.accident_date}
- State: ${answers.state}
- Injuries: ${answers.injuries}
- Total medical expenses: $${answers.medical_expenses}
- Lost wages: $${answers.lost_wages}
- Pain description: ${answers.pain_description}
- Other party/insurance: ${answers.other_name || "Unknown"} / ${answers.insurance_company || "Unknown Insurance"}

Draft a professional, formal demand letter. Include: opening paragraph establishing facts, summary of injuries and treatment, economic damages breakdown, non-economic damages argument, demand amount of $${demandAmount.toLocaleString()}, and deadline for response (30 days). Use formal legal tone. Address it to the insurance company's claims department. Keep it under 600 words. Mark it "DRAFT".`;

    const llmResult = await base44.integrations.Core.InvokeLLM({ prompt });

    const lead = await base44.entities.Lead.create({ first_name: answers.first_name, phone: answers.phone, email: answers.email, state: answers.state, accident_type: answers.accident_type, accident_date: answers.accident_date, source: "tool-demand-letter", attribution });
    setResult({ letter: typeof llmResult === "string" ? llmResult : llmResult?.content || "", demandAmount });
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <div className="bg-white border-b border-border px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <a href="/"><img src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png" alt="Check A Case" className="h-9 w-auto" /></a>
        <span className="text-sm font-semibold text-muted-foreground">AI Demand Letter Generator</span>
      </div>
      {result ? (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full space-y-6">
          <div className="text-center">
            <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-black text-foreground">Your Demand Letter Is Ready</h2>
            <p className="text-muted-foreground text-sm mt-1">Demanding <strong>${result.demandAmount.toLocaleString()}</strong> on your behalf.</p>
          </div>
          <div className="bg-white border-2 border-border rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-8xl font-black text-muted/10 rotate-[-30deg] select-none">DRAFT</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm text-foreground/80 leading-relaxed relative z-10">{result.letter}</pre>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => { const blob = new Blob([result.letter], {type:"text/plain"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download="demand-letter-draft.txt"; a.click(); }} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-border font-semibold hover:bg-muted transition-colors">
              <Download className="w-4 h-4" /> Download Draft
            </button>
            <a href="/Survey?s2=TOOL-demand&utm_source=tool&utm_medium=demand-letter" className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white btn-gradient shadow-lg hover:brightness-110 transition-all">
              Have An Attorney Send This For Me <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="text-center text-xs text-muted-foreground">This draft is for informational purposes only. Have an attorney review before sending.</p>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            {stepIdx === 0 && <div className="text-center mb-8"><h1 className="text-3xl font-black text-foreground mb-2">Free AI Demand Letter Generator</h1><p className="text-muted-foreground">Answer 5 quick questions and get a professional demand letter in 60 seconds.</p></div>}
            <AnimatePresence mode="wait">
              {step === "accident" && <motion.div key="acc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
                <h2 className="text-xl font-bold mb-4">Accident Details</h2>
                {[["auto","Auto / Car Accident"],["slip_fall","Slip & Fall"],["work","Workplace Injury"],["other","Other"]].map(([v,l]) => <OptionBtn key={v} selected={answers.accident_type===v} onClick={() => set("accident_type", v)}>{l}</OptionBtn>)}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">Date of Accident</label><Input type="date" value={answers.accident_date} onChange={e => set("accident_date", e.target.value)} className="rounded-xl" /></div>
                  <div><label className="text-sm font-medium mb-1 block">State</label>
                    <select className="w-full border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-ring text-sm" value={answers.state} onChange={e => set("state", e.target.value)}>
                      <option value="">State…</option>{US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <Button onClick={next} disabled={!answers.accident_type} className="w-full mt-2 rounded-xl">Next →</Button>
              </motion.div>}
              {step === "other_party" && <motion.div key="op" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
                <h2 className="text-xl font-bold mb-4">Other Party Information</h2>
                <Input placeholder="Other party name (optional)" value={answers.other_name} onChange={e => set("other_name", e.target.value)} className="rounded-xl" />
                <Input placeholder="Insurance company name" value={answers.insurance_company} onChange={e => set("insurance_company", e.target.value)} className="rounded-xl" />
                <Button onClick={next} className="w-full mt-2 rounded-xl">Next →</Button>
              </motion.div>}
              {step === "injuries" && <motion.div key="inj" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-xl font-bold mb-4">Describe Your Injuries</h2>
                <textarea value={answers.injuries} onChange={e => set("injuries", e.target.value)} placeholder="e.g. Herniated disc at L4-L5, whiplash, soft tissue damage to neck and shoulder…" className="w-full border border-border rounded-xl p-4 text-sm resize-y bg-white focus:outline-none focus:ring-2 focus:ring-ring" rows={4} />
                <Button onClick={next} disabled={!answers.injuries} className="w-full mt-3 rounded-xl">Next →</Button>
              </motion.div>}
              {step === "financials" && <motion.div key="fin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
                <h2 className="text-xl font-bold mb-4">Financial Damages</h2>
                <Input type="number" placeholder="Total medical expenses ($)" value={answers.medical_expenses} onChange={e => set("medical_expenses", e.target.value)} className="rounded-xl" />
                <Input type="number" placeholder="Lost wages ($)" value={answers.lost_wages} onChange={e => set("lost_wages", e.target.value)} className="rounded-xl" />
                <Button onClick={next} className="w-full mt-2 rounded-xl">Next →</Button>
              </motion.div>}
              {step === "pain" && <motion.div key="pain" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-xl font-bold mb-2">Pain & Suffering</h2>
                <p className="text-sm text-muted-foreground mb-4">Briefly describe how your injuries have affected your daily life (max 200 chars).</p>
                <textarea value={answers.pain_description} onChange={e => set("pain_description", e.target.value.slice(0, 200))} placeholder="e.g. I am unable to sleep, cannot care for my children, and have severe anxiety when driving…" className="w-full border border-border rounded-xl p-4 text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-ring" rows={4} />
                <p className="text-xs text-muted-foreground mt-1 text-right">{answers.pain_description.length}/200</p>
                <Button onClick={next} className="w-full mt-3 rounded-xl">Next →</Button>
              </motion.div>}
              {step === "lead" && <motion.div key="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-2xl font-black mb-1">Generate Your Letter</h2>
                <p className="text-muted-foreground text-sm mb-5">Our AI will draft a professional demand letter in seconds.</p>
                <div className="space-y-3">
                  <Input placeholder="First Name *" value={answers.first_name} onChange={e => set("first_name", e.target.value)} className="rounded-xl" />
                  <Input type="tel" placeholder="Phone *" value={answers.phone} onChange={e => set("phone", e.target.value)} className="rounded-xl" />
                  <Input type="email" placeholder="Email" value={answers.email} onChange={e => set("email", e.target.value)} className="rounded-xl" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !answers.first_name || !answers.phone} className="w-full mt-4 h-14 text-lg font-bold rounded-2xl btn-gradient border-0">
                  {submitting ? "Generating Letter…" : "Generate My Demand Letter →"}
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