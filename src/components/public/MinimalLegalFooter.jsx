import React from "react";
import { Link } from "react-router-dom";

export default function MinimalLegalFooter({ phone = "(888) 454-6304", phoneTel = "tel:+18884546304" }) {
  return (
    <footer style={{ background: "hsl(var(--brand-navy))" }} className="text-white">
      {/* Gradient accent bar */}
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(208,98%,46%), transparent)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Three-column row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center mb-8">
          {/* Logo */}
          <div className="flex justify-center sm:justify-start">
            <img
              src="https://checkacase.com/wp-content/uploads/2023/11/CAC-Logo-Light.png"
              alt="Check A Case"
              className="h-16 w-auto"
            />
          </div>

          {/* Phone */}
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Prefer to call us?</p>
            <a href={phoneTel} className="text-2xl font-bold text-white hover:text-white/80 transition-colors">
              {phone}
            </a>
          </div>

          {/* Copyright + legal links */}
          <div className="text-center sm:text-right space-y-1">
            <p className="text-white/60 text-sm">2026 ©checkacase.com | All Rights Reserved</p>
            <div className="flex gap-3 justify-center sm:justify-end text-sm">
              <Link to="/TermsOfService" className="text-white/60 hover:text-white transition-colors">Terms & Conditions</Link>
              <span className="text-white/30">|</span>
              <Link to="/PrivacyPolicy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-6" />

        {/* Disclaimer */}
        <p className="text-white/50 text-xs leading-relaxed mb-6">
          <strong className="text-white/70">DISCLAIMER:</strong> Checkacase.com is not a law firm or an attorney referral service. This advertisement is not legal advice and is not a guarantee or prediction of the outcome of your legal matter. Every case is different, and the outcome depends on the laws, facts, and circumstances unique to each case. Hiring an attorney is an important decision that should not be based solely on advertising. Request free information about your attorney's background and experience. Advertising paid for by participating attorneys in a joint advertising program, including Kevin Danesh, licensed to practice law only in California. A complete list of joint advertising attorneys can be found{" "}
          <Link to="/PartnerList" className="underline hover:text-white/70">at this link</Link>
          . You can request an attorney by name. This advertising does not imply a higher quality of legal services than that provided by other attorneys, nor does it imply that the attorneys are certified specialists or experts in any area of law. Please note that past results showcased in advertisements do not dictate future results. If you live in AL, FL, MO, NY, or WY,{" "}
          <Link to="/PartnerList" className="underline hover:text-white/70">click here</Link>
          {" "}to see additional information about attorney advertising in your state.
        </p>

        {/* Divider */}
        <div className="border-t border-white/10 mb-6" />

        {/* Cookie notice */}
        <p className="text-white/40 text-xs leading-relaxed text-center">
          We use cookies to personalize content and to analyze our traffic. We also share information about your use of our site with our analytics partners who may combine it with other information that you've provided to them or that they've collected from your use of their services. You consent to our cookies if you continue to use our website.{" "}
          <Link to="/PrivacyPolicy" className="underline hover:text-white/60">Request access to your data.</Link>
        </p>
      </div>
    </footer>
  );
}