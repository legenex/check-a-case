import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FadeUpOnScroll from "@/components/ui/FadeUpOnScroll";

const FAQS = [
  {
    q: "How do I know if I have a valid claim?",
    a: "If you were injured in a motor vehicle accident that was caused by another driver's negligence or recklessness, you may have a valid claim. An attorney can help you evaluate your case and determine whether you have a valid claim.",
  },
  {
    q: "What types of damages can I claim?",
    a: "Depending on the specific circumstances of your case, you may be able to claim damages for medical expenses, lost wages, pain and suffering, and property damage. An attorney can help you understand the types of damages that may be available in your case.",
  },
  {
    q: "Can I file a claim if I am partly at fault for the accident?",
    a: "Depending on the laws of your state, you may still be able to file a claim even if you are partly at fault for the accident. An attorney can help you understand the laws in your state and the impact that fault may have on your claim.",
  },
  {
    q: "What is the average claim value for a motor vehicle accident injury?",
    a: "The average claim value for a motor vehicle accident injury can vary widely depending on the severity of the injuries, the cost of medical treatment, and other factors. In some cases you can claim as much as $500,000+ for life threatening injuries. However, It is best to speak with an attorney to get an estimate of the potential value of your claim. Let us help you get started.",
  },
  {
    q: 'What is a "no win, no fee" arrangement?',
    a: 'A "no win, no fee" arrangement is a type of contingency fee arrangement, where an attorney only gets paid if they win your case. This means that you will not have to pay any upfront legal fees, and the attorney will only be paid a percentage of the settlement or award if they are successful in your case.',
  },
  {
    q: "Do I need an attorney for my claim?",
    a: "It is not required to have an attorney for a motor vehicle accident injury claim, but it is highly recommended. Our trusted attorney's can help you navigate the legal process, gather evidence, negotiate with insurance companies, and ensure that your rights are protected throughout the process while ensure you get the highest possible compensation.",
  },
  {
    q: "Can I negotiate a settlement with the insurance company?",
    a: "Yes, you can negotiate a settlement with the insurance company, but it is highly recommended that you have an attorney handle the negotiation process on your behalf. An attorney can help you understand the full value of your claim and negotiate a fair settlement with the insurance company.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-28 bg-surface-soft">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUpOnScroll className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Got Questions?</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Common questions from accident victims considering a claim.
          </p>
        </FadeUpOnScroll>

        <FadeUpOnScroll delay={0.1}>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-white rounded-2xl border border-border overflow-hidden data-[state=open]:shadow-md data-[state=open]:border-primary/30 transition-all"
              >
                <AccordionTrigger className="text-left text-base font-semibold px-6 py-5 hover:no-underline hover:bg-surface-soft transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground px-6 pb-5 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeUpOnScroll>
      </div>
    </section>
  );
}