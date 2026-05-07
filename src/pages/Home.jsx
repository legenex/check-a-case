import React from "react";
import Navbar from "@/components/public/Navbar";
import HeroSection from "@/components/public/HeroSection";
import TrustBanner from "@/components/public/TrustBanner";
import RecentWins from "@/components/public/RecentWins";
import HowItWorks from "@/components/public/HowItWorks";
import Testimonials from "@/components/public/Testimonials";
import ServicesSection from "@/components/public/ServicesSection";
import LegalTeam from "@/components/public/LegalTeam";
import NoWinNoFee from "@/components/public/NoWinNoFee";
import FreeAccidentReview from "@/components/public/FreeAccidentReview";
import FinalCTA from "@/components/public/FinalCTA";
import FAQSection from "@/components/public/FAQSection";
import Footer from "@/components/public/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <TrustBanner />
      <RecentWins />
      <HowItWorks />
      <Testimonials />
      <ServicesSection />
      <LegalTeam />
      <NoWinNoFee />
      <FreeAccidentReview />
      <FinalCTA />
      <FAQSection />
      <Footer />
    </div>
  );
}