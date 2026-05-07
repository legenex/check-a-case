import React from "react";
import { Car, AlertTriangle, HardHat, Stethoscope, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";

const SERVICES = [
  { icon: Car, title: "Auto Accidents", desc: "Getting paid for your injury shouldn't be an accident." },
  { icon: AlertTriangle, title: "Slip & Fall", desc: "Don't get tripped up by a subpar legal team." },
  { icon: HardHat, title: "Work Accidents", desc: "Filing an injury claim shouldn't feel like working another job." },
  { icon: Stethoscope, title: "Medical Malpractice", desc: "It's never been easier to start your injury case." },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUpOnScroll className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Our Practice Areas</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            We're Accident Compensation Specialists
          </h2>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
            Every case is special. Our team is large and diverse, but our mission is singular: To deliver the best results for you and your family.
          </p>
        </FadeUpOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map((s, i) => (
            <FadeUpOnScroll key={i} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-surface-soft rounded-2xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-shadow group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-brand-blue-dark flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform duration-300">
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground mb-5 leading-relaxed">{s.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 group-hover:gap-2.5 transition-all">
                  Read More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </motion.div>
            </FadeUpOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}