import React from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default function AdvertisingDisclosure() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl font-extrabold text-foreground mb-10">Advertising Disclosure</h1>
        <div className="prose prose-lg max-w-none text-foreground/80 space-y-6">
          <p>
            Check A Case (checkacase.com) is owned and operated by NJA-Online LLC. This website is an advertising-supported comparison and information service. We receive compensation from the companies and attorneys whose products and services we review, recommend, or refer users to. This compensation may influence which products, services, or providers appear on this site, including the order in which they appear.
          </p>
          <p>
            The information provided on this site is for general informational purposes only. It is not legal advice and should not be treated as such. You should consult with a qualified attorney before making any decisions related to your legal matter.
          </p>
          <p>
            We strive to provide accurate and up-to-date information, but we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on this site.
          </p>
          <p>
            Our editorial content is not influenced by advertisers or affiliate partnerships. Our opinions are our own and are based on thorough research and analysis.
          </p>
          <p>
            For questions about our advertising practices, please contact us at <a href="mailto:help@checkacase.com" className="text-primary">help@checkacase.com</a>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}