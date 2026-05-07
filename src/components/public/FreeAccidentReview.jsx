import React from "react";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { motion } from "framer-motion";

const ITEMS = [
  {
    num: "01",
    text: "Speaking with a professional in your area will help you have realistic expectations about your case. They will review the facts about your accident which could be included on an accident report along with any witness of the accident and photographs if applicable.",
  },
  {
    num: "02",
    text: "They will also review any injuries you have as a result and how this impacts your day to day life. This includes medical expenses, missed or lost wages, loss of enjoyment and overall pain and suffering.",
  },
  {
    num: "03",
    text: "If you hire a personal injury lawyer to fight for your claim, there is no upfront cost and the attorney is only paid if they win. Statistically, accident victims walk away with more when employing an attorney because on average settlements awarded by represented claimants are 3.5 times higher.",
  },
];

export default function FreeAccidentReview() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUpOnScroll className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Free Review</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Advantages you will get with your FREE accident review
          </h2>
        </FadeUpOnScroll>

        <div className="grid sm:grid-cols-3 gap-6">
          {ITEMS.map((item, i) => (
            <FadeUpOnScroll key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-surface-soft rounded-2xl p-8 flex gap-4 hover:shadow-xl hover:shadow-blue-500/5 transition-shadow"
              >
                <span className="text-6xl font-black text-primary/10 leading-none select-none flex-shrink-0 -mt-2">
                  {item.num}
                </span>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.text}</p>
              </motion.div>
            </FadeUpOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}