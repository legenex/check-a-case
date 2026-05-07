import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Linkedin, Facebook, Twitter } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Footer() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", state: "", zip_code: "", accident_type: "", details: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await base44.entities.Submission.create({ ...form, type: "footer_form", page_source: window.location.pathname });
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      {/* Gradient hairline */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(208,98%,46%), transparent)" }} />

      <footer id="contact" style={{ background: "hsl(var(--brand-navy))" }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-4 gap-10 lg:gap-8">
            {/* Brand */}
            <div className="space-y-5">
              <img src="https://checkacase.com/wp-content/uploads/2023/11/CAC-Logo-Light.png" alt="Check A Case" className="h-10 w-auto" />
              <p className="text-white/60 leading-relaxed text-sm">
                Check A Case is here to help you get the compensation you deserve after a vehicle or work related accident.
              </p>
              <div className="space-y-2">
                <a href="mailto:help@checkacase.com" className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
                  <Mail className="w-4 h-4" /> help@checkacase.com
                </a>
                <a href="tel:+18884546304" className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
                  <Phone className="w-4 h-4" /> (888) 454-6304
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">Quick Links</h3>
              <nav className="space-y-2">
                {[["Home", "/"], ["About Us", "/#about"], ["Services", "/#services"], ["FAQ", "/#faq"]].map(([l, h]) => (
                  <a key={l} href={h} className="block text-sm text-white/60 hover:text-white transition-colors">{l}</a>
                ))}
              </nav>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">Legal</h3>
              <nav className="space-y-2">
                {[["Privacy Policy", "/PrivacyPolicy"], ["Terms of Service", "/TermsOfService"], ["Advertising Disclosure", "/AdvertisingDisclosure"], ["Partner List", "/PartnerList"]].map(([l, h]) => (
                  <Link key={l} to={h} className="block text-sm text-white/60 hover:text-white transition-colors">{l}</Link>
                ))}
              </nav>
            </div>

            {/* Contact Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">Contact Us</h3>
              {submitted ? (
                <p className="text-white/70 text-sm">Thank you! We'll be in touch soon.</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {[["name", "Name", "text", true], ["email", "Email", "email", true], ["phone", "Phone", "tel", true]].map(([field, ph, type, req]) => (
                    <Input key={field} type={type} placeholder={ph} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required={req} className="bg-white/8 border-white/15 text-white placeholder:text-white/40 h-10 rounded-xl text-sm focus:border-primary" />
                  ))}
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="bg-white/8 border-white/15 text-white placeholder:text-white/40 h-10 rounded-xl text-sm" />
                    <Input placeholder="Zip" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} className="bg-white/8 border-white/15 text-white placeholder:text-white/40 h-10 rounded-xl text-sm" />
                  </div>
                  <Textarea placeholder="Accident Details" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} className="bg-white/8 border-white/15 text-white placeholder:text-white/40 rounded-xl text-sm min-h-[60px]" />
                  <button type="submit" disabled={submitting} className="w-full h-11 rounded-xl font-semibold text-sm text-white btn-gradient shadow-lg shadow-blue-500/20 transition-all hover:brightness-110 disabled:opacity-60">
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">2025 © checkacase.com | All Rights Reserved</p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}