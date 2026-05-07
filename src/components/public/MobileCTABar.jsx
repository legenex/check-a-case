import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export default function MobileCTABar() {
  const [visible, setVisible] = useState(false);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling past ~80vh (hero)
      setVisible(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 border-t border-border/50 px-4 py-3 flex items-center gap-3 safe-area-inset-bottom"
        >
          <a
            href="tel:+18884546304"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-primary text-primary font-semibold text-sm"
          >
            <Phone className="w-4 h-4" />
            (888) 454-6304
          </a>
          <Link
            to="/Survey?s2=CAC-MobileBar&utm_source=Website"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm text-white btn-gradient shadow-lg shadow-blue-500/25"
          >
            Start Your Claim
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}