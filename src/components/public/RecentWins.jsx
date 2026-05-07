import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { Trophy, ArrowRight } from "lucide-react";

function WinTile({ win, large = false }) {
  if (large) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative rounded-3xl overflow-hidden p-8 sm:p-10 flex flex-col justify-end"
        style={{ background: "linear-gradient(135deg, hsl(210,60%,12%) 0%, hsl(208,98%,30%) 100%)" }}
      >
        {/* Glow */}
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 50%, hsl(208,98%,60%), transparent 60%)" }} />
        <div className="relative z-10">
          <Trophy className="w-8 h-8 text-white/40 mb-4" />
          <div className="text-5xl sm:text-6xl font-black text-white mb-2">
            <AnimatedCounter value={win.amount} prefix="$" />
          </div>
          <p className="text-lg font-semibold text-white">{win.name}, {win.age}</p>
          <p className="text-white/60">{win.city}, {win.state}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-card rounded-3xl border border-border p-6 flex flex-col justify-center hover:shadow-xl hover:shadow-blue-500/10 transition-shadow"
    >
      <div className="text-3xl sm:text-4xl font-black text-gradient-blue mb-2">
        <AnimatedCounter value={win.amount} prefix="$" />
      </div>
      <p className="font-semibold text-foreground">{win.name}, {win.age}</p>
      <p className="text-sm text-muted-foreground">{win.city}, {win.state}</p>
    </motion.div>
  );
}

export default function RecentWins() {
  const { data: wins = [] } = useQuery({
    queryKey: ["recentWins"],
    queryFn: () => base44.entities.RecentWin.filter({ status: "published" }, "display_order", 10),
  });

  const [first, ...rest] = wins;

  return (
    <section className="py-20 sm:py-28 bg-surface-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUpOnScroll className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Real Results</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Recent Client Wins
          </h2>
        </FadeUpOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Large tile */}
          {first && (
            <FadeUpOnScroll className="sm:col-span-2 lg:col-span-2 min-h-[260px]" delay={0.05}>
              <WinTile win={first} large />
            </FadeUpOnScroll>
          )}

          {/* Small tiles */}
          {rest.slice(0, 1).map((win, i) => (
            <FadeUpOnScroll key={win.id} delay={0.1 + i * 0.08}>
              <WinTile win={win} />
            </FadeUpOnScroll>
          ))}

          {rest.slice(1, 2).map((win, i) => (
            <FadeUpOnScroll key={win.id} delay={0.18 + i * 0.08}>
              <WinTile win={win} />
            </FadeUpOnScroll>
          ))}

          {/* See more tile */}
          <FadeUpOnScroll delay={0.26}>
            <motion.a
              href="/PartnerList"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-card rounded-3xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:shadow-xl transition-all min-h-[140px] group"
            >
              <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
              <span className="text-sm font-semibold text-primary">See More Wins</span>
            </motion.a>
          </FadeUpOnScroll>
        </div>
      </div>
    </section>
  );
}