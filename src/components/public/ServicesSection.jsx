import React from "react";
import { Car, AlertTriangle, HardHat, Stethoscope, ArrowRight } from "lucide-react";

const SERVICES = [
  {
    icon: Car,
    title: "Auto Accidents",
    desc: "Getting paid for your injury shouldn't be an accident.",
  },
  {
    icon: AlertTriangle,
    title: "Slip & Fall",
    desc: "Don't get tripped up by a subpar legal team.",
  },
  {
    icon: HardHat,
    title: "Work Accidents",
    desc: "Filing an injury claim shouldn't feel like working another job.",
  },
  {
    icon: Stethoscope,
    title: "Medical Malpractice",
    desc: "It's never been easier to start your injury case.",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-16 sm:py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            We're Accident Compensation Specialists
          </h2>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
            Every case is special. Our team is large and diverse, but our
            mission is singular: To deliver the best results for you and your
            family.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((s, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {s.title}
              </h3>
              <p className="text-muted-foreground mb-4">{s.desc}</p>
              <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}