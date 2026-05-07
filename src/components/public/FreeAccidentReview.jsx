import React from "react";
import { CheckCircle } from "lucide-react";

export default function FreeAccidentReview() {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Advantages you will get with your FREE accident review
            </h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  Speaking with a professional in your area will help you have
                  realistic expectations about your case. They will review the
                  facts about your accident which could be included on an accident
                  report along with any witness of the accident and photographs if
                  applicable.
                </p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  They will also review any injuries you have as a result and how
                  this impacts your day to day life. This includes medical
                  expenses, missed or lost wages, loss of enjoyment and overall
                  pain and suffering.
                </p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  If you hire a personal injury lawyer to fight for your claim,
                  there is no upfront cost and the attorney is only paid if they
                  win. Statistically, accident victims walk away with more when
                  employing an attorney because on average settlements awarded by
                  represented claimants are 3.5 times higher.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" />
            <img
              src="https://checkacase.com/wp-content/uploads/2023/07/img3.webp"
              alt="Free accident review"
              className="relative rounded-2xl shadow-xl w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}