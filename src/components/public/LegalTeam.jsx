import React from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import GradientButton from "@/components/ui/GradientButton";
import { buildQuizUrl } from "@/lib/quizUrl";

const PHOTOS = [
  { src: "https://checkacase.com/wp-content/uploads/2023/07/care-team.webp", alt: "Legal care team", large: true },
];

export default function LegalTeam() {
  return (
    <section id="about" className="py-20 sm:py-28 bg-surface-soft overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Asymmetric image side */}
          <FadeUpOnScroll delay={0.05}>
            <div className="relative">
              {/* Decorative blob */}
              <div className="absolute -top-8 -left-8 w-64 h-64 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, hsl(208,98%,60%), transparent)" }} />
              {/* Plus marks */}
              <span className="absolute top-4 right-8 text-3xl text-primary/20 font-black select-none">+</span>
              <span className="absolute bottom-8 left-4 text-2xl text-primary/10 font-black select-none">+</span>
              {/* Circle outline */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full border-2 border-primary/10 opacity-60" />

              <img
                src="https://checkacase.com/wp-content/uploads/2023/07/care-team.webp"
                alt="Your legal care team"
                className="relative rounded-3xl shadow-2xl w-full object-cover"
              />
            </div>
          </FadeUpOnScroll>

          {/* Content */}
          <div className="space-y-6">
            <FadeUpOnScroll delay={0.1}>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                Your Experienced Legal Team!
              </p>
            </FadeUpOnScroll>
            <FadeUpOnScroll delay={0.15}>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                Your legal care team is ready to go to work
              </h2>
            </FadeUpOnScroll>
            <FadeUpOnScroll delay={0.2}>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Once we learn a little more about your needs, we'll build your case team that will take care of the whole process and lead the way. So you can sit back and know that your case will be handled in the best way possible without you having to do anything.
              </p>
            </FadeUpOnScroll>
            <FadeUpOnScroll delay={0.25}>
              <a href={buildQuizUrl({ defaults: { utm_source: "CAC-Website", utm_medium: "Home_Page" }, ctaContent: "legal_team_cta" })} rel="noopener">
                <GradientButton size="lg" className="group">
                  SEE IF YOU QUALIFY
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </GradientButton>
              </a>
            </FadeUpOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}