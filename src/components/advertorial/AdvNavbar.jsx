import React, { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import { buildQuizUrl } from "@/lib/quizUrl";

export default function AdvNavbar({ slug, finalCtaUrl }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ctaHref = finalCtaUrl || buildQuizUrl({ defaults: { utm_source: "CAC-Site", utm_medium: slug, utm_campaign: "Advertorial" }, ctaContent: "navbar_cta" });

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 h-20 flex items-center transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl bg-white/90 border-b border-black/8 shadow-sm" : "bg-white border-b border-gray-100"
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
          <a href="/">
            <img
              src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png"
              alt="Check A Case"
              className="h-12 w-auto"
            />
          </a>
          <div className="flex items-center gap-3">
            <a
              href="tel:+18884546304"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" />
              (888) 454-6304
            </a>
            <a
              href={ctaHref}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-gradient shadow-md shadow-blue-500/20 hover:brightness-110 transition-all"
            >
              Check Your Claim →
            </a>
          </div>
        </div>
      </nav>


    </>
  );
}