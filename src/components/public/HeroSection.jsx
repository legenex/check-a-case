import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight text-foreground">
              Here to Help You Get The Compensation You{" "}
              <span className="text-primary">Deserve…</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
              We'll take care of everything and make sure you get the maximum
              compensation possible!
            </p>
            <Link to="/Survey?s2=CAC-Home&utm_source=Website">
              <Button
                size="lg"
                className="rounded-xl h-14 px-8 text-base sm:text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all mt-2"
              >
                START YOUR INJURY CLAIM NOW
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" />
            <img
              src="https://checkacase.com/wp-content/uploads/2023/07/img1.webp"
              alt="Injury claim assistance"
              className="relative rounded-2xl shadow-2xl w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}