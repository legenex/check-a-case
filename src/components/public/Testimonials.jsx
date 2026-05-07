import React, { useState } from "react";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";

const TESTIMONIALS = [
  {
    name: "Sarah S.",
    location: "Sacramento, CA",
    text: "My 27-year-old daughter was in a head-on collision and was paralyzed from the waist down. Check A Case was so easy to work with and made it so simple for us to get the compensation we needed. Highly recommend.",
  },
  {
    name: "Akshay H.",
    location: "Portland, OR",
    text: "Check A Case proved to be an invaluable resource following my devastating car accident. Through their assistance, I was connected with an exceptional lawyer, who skillfully secured a settlement that fully covered all my medical expenses and lost income. I cannot express my gratitude enough.",
  },
  {
    name: "Ajay S.",
    location: "Memphis, TN",
    text: "Check A Case proved to be an invaluable resource following my devastating car accident. Through their assistance, I was connected with an exceptional lawyer who skillfully secured a settlement that fully covered my medical expenses and lost income. I cannot express my gratitude enough.",
  },
  {
    name: "Amanda H",
    location: "Tampa, FL",
    text: "After my accident, I was completely overwhelmed with the daunting task of finding a suitable attorney. Thanks to Check A Case, this process became effortless. They connected me with an outstanding lawyer, conveniently located just 15 minutes away from my home, eliminating any added stress.",
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-20 sm:py-28 bg-surface-soft overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUpOnScroll className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Client Stories</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            What Our Clients Say About Us
          </h2>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
            We've helped thousands of clients from all around the country. Here are a few success stories…
          </p>
        </FadeUpOnScroll>

        <div className="relative max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="backdrop-blur-md bg-white/80 border border-white/60 rounded-3xl p-8 sm:p-12 shadow-xl shadow-blue-500/5"
            >
              {/* Big quote SVG */}
              <svg className="w-12 h-12 text-primary/10 mb-4" viewBox="0 0 40 40" fill="currentColor">
                <path d="M12 4C7.6 4 4 7.6 4 12v12h12V12H8c0-2.2 1.8-4 4-4V4zm16 0c-4.4 0-8 3.6-8 8v12h12V12h-8c0-2.2 1.8-4 4-4V4z" />
              </svg>

              <div className="flex gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg sm:text-xl text-foreground/80 italic leading-relaxed mb-8">
                "{TESTIMONIALS[active].text}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-brand-blue-dark flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {TESTIMONIALS[active].name[0]}
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{TESTIMONIALS[active].name}</p>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{TESTIMONIALS[active].location}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all duration-300 ${
                  active === i ? "w-8 h-2 bg-primary" : "w-2 h-2 bg-border hover:bg-primary/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}