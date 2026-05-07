import React from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { Heart } from "lucide-react";

export default function Sorry() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="py-20 sm:py-32 bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Thanks for sharing your story.
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Based on your answers, we may not be the right match for your case
            right now. Here are some other resources that might help.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}