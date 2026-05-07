import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/public/Navbar";
import NoWinNoFee from "@/components/public/NoWinNoFee";
import Footer from "@/components/public/Footer";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const PARTNERS = [
  "Car Accident Helpline", "Los Defensores", "4LegalLeads", "1800TheLaw2",
  "My Lawsuit Help", "Action Legal", "The Injury Help Network", "Inbounds.com",
  "Auto Accident Team", "Accident Helpline",
];

export default function PartnerList() {
  const [search, setSearch] = useState("");

  const { data: sponsors = [] } = useQuery({
    queryKey: ["sponsors"],
    queryFn: () => base44.entities.Sponsor.filter({ status: "active" }, "display_order", 500),
  });

  const filteredSponsors = sponsors.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <FadeUpOnScroll>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-3">Affiliated Partners</h1>
          <p className="text-muted-foreground mb-10">Organizations we work with to help connect injury victims with qualified legal representation.</p>
        </FadeUpOnScroll>

        <FadeUpOnScroll delay={0.1}>
          <div className="grid sm:grid-cols-2 gap-3 mb-16">
            {PARTNERS.map((p) => (
              <div key={p} className="bg-card rounded-xl border border-border px-6 py-4 font-medium text-foreground hover:border-primary/30 hover:shadow-sm transition-all">
                {p}
              </div>
            ))}
          </div>
        </FadeUpOnScroll>

        {/* Sponsors section */}
        <FadeUpOnScroll delay={0.15}>
          <div className="border-t border-border pt-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-2">Sponsors</h2>
            <p className="text-muted-foreground mb-6">Attorney sponsors and legal professionals in our network.</p>

            <div className="relative mb-6 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {filteredSponsors.length === 0 ? (
              <div className="bg-surface-soft rounded-2xl p-10 text-center text-muted-foreground">
                {search ? "No sponsors match your search." : "Sponsors loading or not yet configured."}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSponsors.map((sponsor) => (
                  <div key={sponsor.id} className="bg-card rounded-xl border border-border px-5 py-4 hover:border-primary/30 hover:shadow-sm transition-all">
                    <p className="font-semibold text-foreground">{sponsor.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Office Location: {sponsor.office_location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeUpOnScroll>
      </div>

      <NoWinNoFee />
      <Footer />
    </div>
  );
}