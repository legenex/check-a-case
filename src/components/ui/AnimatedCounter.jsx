import React, { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export default function AnimatedCounter({ value, prefix = "", suffix = "", className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (shouldReduce) { setDisplay(value); return; }

    const controls = animate(0, value, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return controls.stop;
  }, [isInView, value, shouldReduce]);

  const formatted = value >= 1000000
    ? (display / 1000000).toFixed(1) + "M"
    : value >= 1000
    ? display.toLocaleString()
    : display.toString();

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}