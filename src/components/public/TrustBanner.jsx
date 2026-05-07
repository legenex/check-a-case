import React from "react";

const LOGOS = ["ABC News", "Forbes", "USA Today", "NBC", "Yahoo Finance", "MarketWatch", "Reuters", "CNN", "Bloomberg"];

export default function TrustBanner() {
  // Duplicate for seamless loop
  const items = [...LOGOS, ...LOGOS];

  return (
    <section className="bg-surface-soft border-y border-border/60 py-10">
      {/* Marquee */}
      <div className="relative overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
        <div className="animate-marquee">
          {items.map((logo, i) => (
            <span
              key={i}
              className="inline-flex items-center mx-8 text-sm font-semibold text-foreground/25 tracking-widest uppercase whitespace-nowrap"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>

      {/* Headline below */}
      <div className="max-w-3xl mx-auto px-4 text-center mt-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          We'll Never Stop Fighting For You
        </h2>
        <p className="text-muted-foreground mt-2">
          We work with only the best attorneys to get you the compensation you deserve.
        </p>
      </div>
    </section>
  );
}