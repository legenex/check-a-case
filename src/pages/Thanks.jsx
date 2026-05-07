import React from "react";
import Navbar from "@/components/public/Navbar";
import NoWinNoFee from "@/components/public/NoWinNoFee";
import Footer from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle } from "lucide-react";

export default function Thanks() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="py-16 sm:py-24 bg-gradient-to-br from-background via-secondary/30 to-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Thank You! We Have Received Your Details!
          </h1>
          <p className="text-lg text-muted-foreground">
            One of our trusted advisors will call you in the next few minutes!
            Please Make Sure To Answer your Phone!
          </p>
          <p className="text-base font-semibold text-foreground">
            PLEASE NOTE: We cannot proceed with your case without talking to you
            on the phone and confirming your case details…
          </p>

          <div className="bg-card rounded-xl border border-border p-8 max-w-md mx-auto mt-8">
            <p className="text-lg font-bold text-foreground mb-4">
              Don't Wanna Wait? Click the button below to call now, and fast
              track your claim..
            </p>
            <a href="tel:+18884546304">
              <Button
                size="lg"
                className="w-full rounded-xl h-14 text-lg font-bold"
              >
                <Phone className="w-5 h-5 mr-2" />
                (888) 454-6304
              </Button>
            </a>
          </div>
        </div>
      </section>

      <NoWinNoFee />
      <Footer />
    </div>
  );
}