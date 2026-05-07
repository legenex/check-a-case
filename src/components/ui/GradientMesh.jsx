import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function GradientMesh() {
  const shouldReduce = useReducedMotion();

  const blobs = [
    { color: "hsl(208,98%,46%)", size: 600, x: [-60, 60, -30], y: [-40, 40, -20], dur: 22 },
    { color: "hsl(195,95%,55%)", size: 500, x: [80, -40, 60], y: [60, -50, 30], dur: 28 },
    { color: "hsl(38,95%,55%)", size: 400, x: [30, -70, 40], y: [-60, 30, -40], dur: 18 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen"
          style={{
            width: blob.size,
            height: blob.size,
            background: blob.color,
            filter: "blur(120px)",
            opacity: 0.35,
            left: `${20 + i * 25}%`,
            top: `${10 + i * 15}%`,
            translateX: "-50%",
            translateY: "-50%",
          }}
          animate={shouldReduce ? {} : {
            x: blob.x,
            y: blob.y,
          }}
          transition={{
            duration: blob.dur,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}