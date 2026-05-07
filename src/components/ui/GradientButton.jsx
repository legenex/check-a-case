import React from "react";
import { motion } from "framer-motion";

export default function GradientButton({ children, className = "", onClick, href, variant = "blue", size = "lg", ...props }) {
  const base = `inline-flex items-center justify-center font-bold rounded-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    size === "lg" ? "h-14 px-8 text-base gap-2" : "h-11 px-6 text-sm gap-1.5"
  }`;

  const variants = {
    blue: "btn-gradient text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:brightness-110",
    amber: "btn-gradient-amber text-[hsl(30,50%,15%)] shadow-lg shadow-amber-400/30 hover:shadow-amber-400/50 hover:brightness-110",
  };

  const inner = (
    <motion.span
      className={`${base} ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.span>
  );

  if (href) {
    return <a href={href} className="inline-block">{inner}</a>;
  }
  return inner;
}