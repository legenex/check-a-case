import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-16 sm:py-24 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          We Only Get Paid When You Win
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          All of the emails, paperwork, meetings, calls, court appearances… it's
          all free unless we win your injury case.
        </p>
        <Link to="/Survey?s2=CAC-Home&utm_source=Website">
          <Button
            size="lg"
            className="rounded-xl h-14 px-8 text-base font-bold shadow-lg shadow-primary/25 mt-4"
          >
            START YOUR CLAIM NOW
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}