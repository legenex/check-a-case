import React, { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import GradientButton from "@/components/ui/GradientButton";
import GradientMesh from "@/components/ui/GradientMesh";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { captureAttribution } from "@/lib/attribution";
import { buildQuizUrl } from "@/lib/quizUrl";

const STATS = [
  { label: "Recovered", value: 847, prefix: "$", suffix: "M+" },
  { label: "Cases Handled", value: 85000, prefix: "", suffix: "+" },
  { label: "Avg Rating", value: 4.9, prefix: "", suffix: "★" },
  { label: "Win Rate", value: 97, prefix: "", suffix: "%" },
];

const HOME_DEFAULTS = { utm_source: "CAC-Website", utm_medium: "Home_Page" };

export default function HeroSection() {
  useEffect(() => { captureAttribution(); }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-navy pt-16">
      <GradientMesh />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center w-full">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
          <span className="text-sm font-medium text-white/90">Trusted by 85,000+ injury victims</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-hero font-black text-white leading-[1.05] tracking-tight mb-6"
        >
          Here to Help You Get The{" "}
          <span className="text-gradient-blue">Compensation</span>{" "}
          You Deserve…
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-4"
        >
          We'll take care of everything and make sure you get the maximum compensation possible!
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-3 mb-16"
        >
          <p className="text-sm text-white/50">Free, no obligation, takes 60 seconds</p>
          <a href={buildQuizUrl({ defaults: HOME_DEFAULTS, ctaContent: "hero_primary_cta" })} rel="noopener">
            <GradientButton size="lg" className="group">
              START YOUR INJURY CLAIM NOW
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </GradientButton>
          </a>
        </motion.div>

        {/* Stat counters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-white mb-1">
                <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}