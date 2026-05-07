import React from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import GradientMesh from "@/components/ui/GradientMesh";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Sorry() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden min-h-[80vh] flex items-center py-24" style={{ background: "hsl(var(--brand-navy))" }}>
        <GradientMesh />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
            className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-white/60" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Thanks for sharing your story.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="text-lg text-white/60 max-w-lg mx-auto">
            Based on your answers, we may not be the right match for your case right now. Here are some other resources that might help.
          </motion.p>
        </div>
      </section>
      <Footer />
    </div>
  );
}