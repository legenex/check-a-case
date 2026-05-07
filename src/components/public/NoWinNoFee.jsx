import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function NoWinNoFee({ ctaText, ctaUrl }) {
  return (
    <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <ShieldCheck className="w-12 h-12 mx-auto opacity-80" />
        <h2 className="text-3xl sm:text-4xl font-bold">
          WE DON'T GET PAID UNLESS YOU DO
        </h2>
        <div className="text-lg opacity-90 leading-relaxed max-w-3xl mx-auto text-left sm:text-center">
          <p>
            <strong>OUR NO WIN, NO FEE GUARANTEE</strong> — We guarantee every
            client that we will not charge a you a cent if we do not secure a
            positive outcome in your case. If you do win, the bulk of our fees
            are usually paid by the opposing counsel's client, who was responsible
            for the accident. We will discuss and agree upon the fee breakdown
            upfront and in detail, so there will be complete transparency and no
            disappointment once we win your case… Which is our guarantee to you!{" "}
            <strong>YOU HAVE NOTHING TO LOSE!</strong>
          </p>
        </div>
        <Link to={ctaUrl || "/Survey?s2=CAC-Home&utm_source=Website"}>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-xl h-14 px-8 text-base font-bold text-primary hover:bg-white mt-4"
          >
            {ctaText || "FIND OUT HOW MUCH YOUR CLAIM COULD WORTH"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}