import React from "react";
import Navbar from "@/components/public/Navbar";
import NoWinNoFee from "@/components/public/NoWinNoFee";
import Footer from "@/components/public/Footer";
import GradientMesh from "@/components/ui/GradientMesh";
import GradientButton from "@/components/ui/GradientButton";
import { CheckCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function Thanks() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden min-h-[80vh] flex items-center py-24" style={{ background: "hsl(var(--brand-navy))" }}>
        <GradientMesh />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Thank You! We Have Received Your Details!
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="text-lg text-white/70 mb-3">
            One of our trusted advisors will call you in the next few minutes! Please Make Sure To Answer your Phone!
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-base font-semibold text-white/90 mb-10">
            PLEASE NOTE: We cannot proceed with your case without talking to you on the phone and confirming your case details…
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-md mx-auto">
            <p className="text-lg font-bold text-white mb-5">
              Don't Wanna Wait? Click the button below to call now, and fast track your claim..
            </p>
            <GradientButton href="tel:+18884546304" className="w-full justify-center">
              <Phone className="w-5 h-5" />
              (888) 454-6304
            </GradientButton>
          </motion.div>
        </div>
      </section>

      <NoWinNoFee />
      <Footer />
    </div>
  );
}