import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LegalTeam() {
  return (
    <section id="about" className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" />
            <img
              src="https://checkacase.com/wp-content/uploads/2023/07/care-team.webp"
              alt="Your legal care team"
              className="relative rounded-2xl shadow-xl w-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
              Your Experienced Legal Team!
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Your legal care team is ready to go to work
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Once we learn a little more about your needs, we'll build your
              case team that will take care of the whole process and lead the
              way. So you can sit back and know that your case will be handled in
              the best way possible without you having to do anything.
            </p>
            <Link to="/Survey?s2=CAC-Home&utm_source=Website">
              <Button
                size="lg"
                className="rounded-xl h-14 px-8 text-base font-bold shadow-lg shadow-primary/25 mt-2"
              >
                SEE IF YOU QUALIFY
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}