import React from "react";
import { Zap, FileText, DollarSign } from "lucide-react";

const STEPS = [
  {
    icon: Zap,
    title: "Fast approval",
    desc: "Other law firms can take weeks to return your calls and emails. Simply answer a few questions about your injury to see if we can help.",
    img: "https://checkacase.com/wp-content/uploads/2023/07/hand.webp",
  },
  {
    icon: FileText,
    title: "Simple case management",
    desc: "Check in and see how your case is progressing, message your legal care team, or upload documents right from your phone.",
    img: "https://checkacase.com/wp-content/uploads/2023/07/document.webp",
  },
  {
    icon: DollarSign,
    title: "Transparent pricing",
    desc: "When we win a case, our fee ranges between 15-40% of the verdict or settlement we obtain. If we don't win, you'll never see a bill.",
    img: "https://checkacase.com/wp-content/uploads/2023/07/salary.webp",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-14">
          We Make Injury Claims Easy
        </h2>

        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-8 hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}