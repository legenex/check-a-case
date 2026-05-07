import React from "react";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Sarah S.",
    location: "Sacramento, CA",
    text: "My 27-year-old daughter was in a head-on collision and was paralyzed from the waist down. Check A Case was so easy to work with and made it so simple for us to get the compensation we needed. Highly recommend.",
  },
  {
    name: "Akshay H.",
    location: "Portland, OR",
    text: "Check A Case proved to be an invaluable resource following my devastating car accident. Through their assistance, I was connected with an exceptional lawyer, who skillfully secured a settlement that fully covered all my medical expenses and lost income. I cannot express my gratitude enough.",
  },
  {
    name: "Ajay S.",
    location: "Memphis, TN",
    text: "Check A Case proved to be an invaluable resource following my devastating car accident. Through their assistance, I was connected with an exceptional lawyer who skillfully secured a settlement that fully covered my medical expenses and lost income. I cannot express my gratitude enough.",
  },
  {
    name: "Amanda H",
    location: "Tampa, FL",
    text: "After my accident, I was completely overwhelmed with the daunting task of finding a suitable attorney. Thanks to Check A Case, this process became effortless. They connected me with an outstanding lawyer, conveniently located just 15 minutes away from my home, eliminating any added stress.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            What Our Clients Say About Us
          </h2>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
            We've helped thousands of clients from all around the country. Here
            are a few success stories…
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-8 relative hover:shadow-lg transition-shadow"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-6 right-6" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-foreground/80 italic leading-relaxed mb-6">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}