import React from "react";
import { Zap, FileText, DollarSign } from "lucide-react";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { motion } from "framer-motion";

const STEPS = [
  {
    icon: Zap,
    title: "Fast approval",
    desc: "Other law firms can take weeks to return your calls and emails. Simply answer a few questions about your injury to see if we can help.",
  },
  {
    icon: FileText,
    title: "Simple case management",
    desc: "Check in and see how your case is progressing, message your legal care team, or upload documents right from your phone.",
  },
  {
    icon: DollarSign,
    title: "Transparent pricing",
    desc: "When we win a case, our fee ranges between 15-40% of the verdict or settlement we obtain. If we don't win, you'll never see a bill.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUpOnScroll className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Why Choose Us</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            We Make Injury Claims Easy
          </h2>
        </FadeUpOnScroll>

        <div className="grid sm:grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <FadeUpOnScroll key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative group"
              >
                {/* Gradient border wrapper */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-100 via-blue-50 to-transparent">
                  <div className="bg-white rounded-2xl p-8 h-full">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-brand-blue-dark flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:rotate-3 transition-transform">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            </FadeUpOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}