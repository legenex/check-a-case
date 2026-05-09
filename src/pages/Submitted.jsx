import React from "react";
import Navbar from "@/components/public/Navbar";
import NoWinNoFee from "@/components/public/NoWinNoFee";
import MinimalLegalFooter from "@/components/public/MinimalLegalFooter";
import GradientMesh from "@/components/ui/GradientMesh";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { CheckCircle, Phone, FileSearch, Briefcase, HandCoins } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { icon: Phone, title: "Verification Process", desc: "We'll contact you to confirm your information, connect you with your attorney, and gather cost details!", num: "01" },
  { icon: FileSearch, title: "Attorney Review", desc: "Your attorney will conduct a thorough review based on the information you've supplied.", num: "02" },
  { icon: Briefcase, title: "Case Initiation", desc: "Your case is started by your attorney at no upfront cost, as they work on a no win, no fee basis and only get paid when you do.", num: "03" },
  { icon: HandCoins, title: "Settlement Options", desc: "Your attorney will present your various settlement options and then proceed with the case at no cost to you!", num: "04" },
];

export default function Submitted() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden min-h-[60vh] flex items-center py-24" style={{ background: "hsl(var(--brand-navy))" }}>
        <GradientMesh />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Congrats! Based On Your Answers, It Appears You May Have A High Value Claim!
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="text-lg text-white/70 mb-3">
            One of our trusted advisors will call you in the next few minutes! Please Make Sure To Answer your Phone!
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-base font-semibold text-white/90">
            PLEASE NOTE: We cannot proceed with your case without talking to you on the phone and confirming your case details…
          </motion.p>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-surface-soft">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUpOnScroll className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Here's What To Expect Next:
            </h2>
          </FadeUpOnScroll>
          <div className="grid sm:grid-cols-2 gap-5">
            {STEPS.map((s, i) => (
              <FadeUpOnScroll key={i} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-8 flex gap-4 hover:shadow-xl hover:shadow-blue-500/5 transition-shadow">
                  <span className="text-5xl font-black text-primary/10 leading-none select-none flex-shrink-0 -mt-1">{s.num}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-foreground">{s.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm">{s.desc}</p>
                  </div>
                </div>
              </FadeUpOnScroll>
            ))}
          </div>
        </div>
      </section>

      <NoWinNoFee />
      <MinimalLegalFooter />
    </div>
  );
}