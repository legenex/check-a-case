import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/public/Navbar";
import NoWinNoFee from "@/components/public/NoWinNoFee";
import Footer from "@/components/public/Footer";
import { CheckCircle, Phone, FileSearch, Briefcase, HandCoins } from "lucide-react";

const STEPS = [
  {
    icon: Phone,
    title: "Verification Process",
    desc: "We'll contact you to confirm your information, connect you with your attorney, and gather cost details!",
  },
  {
    icon: FileSearch,
    title: "Attorney Review",
    desc: "Your attorney will conduct a thorough review based on the information you've supplied.",
  },
  {
    icon: Briefcase,
    title: "Case Initiation",
    desc: "Your case is started by your attorney at no upfront cost, as they work on a no win, no fee basis and only get paid when you do.",
  },
  {
    icon: HandCoins,
    title: "Settlement Options",
    desc: "Your attorney will present your various settlement options and then proceed with the case at no cost to you!",
  },
];

export default function Submitted() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="py-16 sm:py-24 bg-gradient-to-br from-background via-secondary/30 to-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Congrats! Based On Your Answers, It Appears You May Have A High Value Claim!
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            One of our trusted advisors will call you in the next few minutes!
            Please Make Sure To Answer your Phone!
          </p>
          <p className="text-base font-semibold text-foreground">
            PLEASE NOTE: We cannot proceed with your case without talking to you
            on the phone and confirming your case details…
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
            Here's What To Expect Next:
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {i + 1}
                  </div>
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {s.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NoWinNoFee />
      <Footer />
    </div>
  );
}