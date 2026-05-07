import React from "react";
import Navbar from "@/components/public/Navbar";
import NoWinNoFee from "@/components/public/NoWinNoFee";
import Footer from "@/components/public/Footer";

const PARTNERS = [
  "Car Accident Helpline",
  "Los Defensores",
  "4LegalLeads",
  "1800TheLaw2",
  "My Lawsuit Help",
  "Action Legal",
  "The Injury Help Network",
  "Inbounds.com",
  "Auto Accident Team",
  "Accident Helpline",
];

export default function PartnerList() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl font-extrabold text-foreground mb-10">Affiliated Partners</h1>
        <ul className="space-y-3 mb-16">
          {PARTNERS.map((p) => (
            <li
              key={p}
              className="bg-card rounded-xl border border-border px-6 py-4 font-medium text-foreground"
            >
              {p}
            </li>
          ))}
        </ul>
      </div>
      <NoWinNoFee />
      <Footer />
    </div>
  );
}