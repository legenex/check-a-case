import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy } from "lucide-react";

export default function RecentWins() {
  const { data: wins = [] } = useQuery({
    queryKey: ["recentWins"],
    queryFn: () => base44.entities.RecentWin.filter({ status: "published" }, "display_order", 10),
  });

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Recent Wins
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Real Results for Real People
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {wins.map((win) => (
            <div
              key={win.id}
              className="bg-card rounded-xl border border-border p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <p className="text-4xl sm:text-5xl font-extrabold text-primary mb-3">
                ${win.amount?.toLocaleString()}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {win.name}, {win.age}
              </p>
              <p className="text-muted-foreground">
                {win.city}, {win.state}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}