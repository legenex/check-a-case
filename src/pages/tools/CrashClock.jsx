import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { STATE_FACTORS } from "@/lib/claimCalc";
import { ArrowRight, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const US_STATES = Object.keys(STATE_FACTORS).sort();

// State SOL in years (personal injury)
const STATE_SOL = {
  AL:2,AK:2,AZ:2,AR:3,CA:2,CO:3,CT:2,DE:2,FL:2,GA:2,HI:2,ID:2,IL:2,IN:2,IA:2,
  KS:2,KY:1,LA:1,ME:6,MD:3,MA:3,MI:3,MN:2,MS:3,MO:5,MT:3,NE:4,NV:2,NH:3,NJ:2,
  NM:3,NY:3,NC:3,ND:6,OH:2,OK:2,OR:2,PA:2,RI:3,SC:3,SD:3,TN:1,TX:2,UT:4,VT:3,
  VA:2,WA:3,WV:2,WI:3,WY:4,DC:3
};

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) { setRemaining({ expired: true }); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining({ days, hours, mins, secs });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return remaining;
}

function CountdownDisplay({ targetDate, state }) {
  const r = useCountdown(targetDate);
  if (r.expired) return (
    <div className="text-center py-8">
      <p className="text-4xl font-black text-red-600">⚠️ Deadline May Have Passed</p>
      <p className="text-muted-foreground mt-2">Contact an attorney immediately — exceptions may apply.</p>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 text-center">
        {[["Days", r.days], ["Hours", r.hours], ["Minutes", r.mins], ["Seconds", r.secs]].map(([label, val]) => (
          <div key={label} className="bg-foreground rounded-2xl py-4 px-2">
            <p className="text-3xl sm:text-4xl font-black text-white">{String(val || 0).padStart(2, "0")}</p>
            <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Estimated deadline: <strong className="text-foreground">{new Date(targetDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>
      </p>
    </div>
  );
}

export default function CrashClock() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ state: "", accident_date: "", case_type: "auto", first_name: "", phone: "", email: "" });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setAnswers(a => ({ ...a, [k]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    const attribution = JSON.parse(sessionStorage.getItem("cac_attribution") || "{}");
    await base44.entities.Lead.create({ first_name: answers.first_name, phone: answers.phone, email: answers.email, state: answers.state, accident_type: answers.case_type, accident_date: answers.accident_date, source: "tool-crash-clock", attribution });
    const solYears = STATE_SOL[answers.state] || 2;
    const deadline = new Date(answers.accident_date);
    deadline.setFullYear(deadline.getFullYear() + solYears);
    setResult({ deadline: deadline.toISOString(), solYears, state: answers.state });
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <div className="bg-white border-b border-border px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <a href="/"><img src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png" alt="Check A Case" className="h-9 w-auto" /></a>
        <span className="text-sm font-semibold text-muted-foreground">Statute of Limitations Clock</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {!result ? (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5 mb-4">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">Time-Sensitive</span>
                </div>
                <h1 className="text-3xl font-black text-foreground mb-2">How Much Time Do You Have Left?</h1>
                <p className="text-muted-foreground">Every state has a strict filing deadline. Miss it and you lose your right to compensation — forever.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">State of Accident</label>
                  <select className="w-full border border-border rounded-2xl px-4 py-4 bg-white focus:outline-none focus:ring-2 focus:ring-ring" value={answers.state} onChange={e => set("state", e.target.value)}>
                    <option value="">Select state…</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s} — {STATE_SOL[s] || 2} year{(STATE_SOL[s] || 2) !== 1 ? "s" : ""} SOL</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Date of Accident</label>
                  <Input type="date" value={answers.accident_date} onChange={e => set("accident_date", e.target.value)} className="rounded-xl" max={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Your Name</label>
                  <Input placeholder="First Name *" value={answers.first_name} onChange={e => set("first_name", e.target.value)} className="rounded-xl" />
                </div>
                <Input type="tel" placeholder="Phone *" value={answers.phone} onChange={e => set("phone", e.target.value)} className="rounded-xl" />
                <Input type="email" placeholder="Email" value={answers.email} onChange={e => set("email", e.target.value)} className="rounded-xl" />
                <Button onClick={handleSubmit} disabled={submitting || !answers.state || !answers.accident_date || !answers.first_name || !answers.phone} className="w-full h-14 text-lg font-bold rounded-2xl btn-gradient border-0">
                  {submitting ? "Calculating…" : "Show My Deadline →"}
                </Button>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h2 className="text-2xl font-black text-foreground mb-1">Your Estimated Filing Deadline</h2>
                <p className="text-sm text-muted-foreground">{result.state} has a {result.solYears}-year statute of limitations for personal injury</p>
              </div>
              <CountdownDisplay targetDate={result.deadline} state={result.state} />
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 leading-relaxed">
                <strong>If you don't file by {new Date(result.deadline).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}, you forfeit your right to compensation forever in {result.state}.</strong> Courts make no exceptions for missing this deadline.
              </div>
              <div className="space-y-2">
                {["Free case review in under 60 seconds", "No win, no fee — you pay nothing upfront", "Connect with an attorney in your state today"].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className="text-green-500 font-bold">✓</span> {b}
                  </div>
                ))}
              </div>
              <a href="/Survey?s2=TOOL-crash-clock&utm_source=tool&utm_medium=crash-clock" className="flex items-center justify-center gap-2 w-full py-5 rounded-2xl text-lg font-bold text-white btn-gradient shadow-xl hover:brightness-110 transition-all group">
                File Before The Clock Runs Out
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <p className="text-center text-xs text-muted-foreground">Estimates are illustrative. Actual deadlines may vary. Not legal advice.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}