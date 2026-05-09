import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GradientButton from "@/components/ui/GradientButton";
import { buildQuizUrl } from "@/lib/quizUrl";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-sm shadow-black/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <a href="/" className="flex-shrink-0">
              <img
                src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png"
                alt="Check A Case"
                className={`h-14 md:h-16 lg:h-20 w-auto transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0 absolute"}`}
              />
              <img
                src="https://checkacase.com/wp-content/uploads/2023/11/CAC-Logo-Light.png"
                alt="Check A Case"
                className={`h-14 md:h-16 lg:h-20 w-auto transition-opacity duration-300 ${scrolled ? "opacity-0 absolute" : "opacity-100"}`}
              />
            </a>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    scrolled ? "text-foreground/70 hover:text-primary" : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <a href={buildQuizUrl({ defaults: { utm_source: "CAC-Website", utm_medium: "Home_Page" }, ctaContent: "navbar_cta" })} rel="noopener">
                <GradientButton size="sm">
                  Start Your Claim <ArrowRight className="w-4 h-4" />
                </GradientButton>
              </a>
            </div>

            <button
              onClick={() => setOpen(!open)}
              className={`md:hidden p-2 transition-colors ${scrolled ? "text-foreground" : "text-white"}`}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-brand-navy flex flex-col px-6 pt-24 pb-10"
          >
            <button onClick={() => setOpen(false)} className="absolute top-5 right-5 text-white/60 hover:text-white">
              <X className="w-7 h-7" />
            </button>
            <nav className="flex flex-col gap-6">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="text-2xl font-bold text-white/90 hover:text-white"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-auto">
              <a href={buildQuizUrl({ defaults: { utm_source: "CAC-Website", utm_medium: "Home_Page" }, ctaContent: "navbar_cta" })} rel="noopener" onClick={() => setOpen(false)}>
                <GradientButton className="w-full justify-center">
                  Start Your Claim <ArrowRight className="w-5 h-5" />
                </GradientButton>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}