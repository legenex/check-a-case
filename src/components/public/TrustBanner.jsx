import React from "react";
import { Shield } from "lucide-react";

export default function TrustBanner() {
  return (
    <section className="bg-primary text-primary-foreground py-14 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <Shield className="w-10 h-10 mx-auto opacity-80" />
        <h2 className="text-3xl sm:text-4xl font-bold">
          We'll Never Stop Fighting For You
        </h2>
        <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto">
          We work with only the best attorneys to get you the compensation you
          deserve.
        </p>
      </div>
    </section>
  );
}