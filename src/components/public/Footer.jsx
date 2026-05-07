import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Footer() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", state: "", zip_code: "", accident_type: "", details: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await base44.entities.Submission.create({
      ...form,
      type: "footer_form",
      page_source: window.location.pathname,
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <footer id="contact" className="bg-[hsl(210,49%,13%)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
          {/* About */}
          <div className="space-y-6">
            <img
              src="https://checkacase.com/wp-content/uploads/2023/11/CAC-Logo-Light.png"
              alt="Check A Case"
              className="h-10 w-auto"
            />
            <p className="text-white/70 leading-relaxed">
              Check A Case is here to help you get the compensation you deserve
              after a vehicle or work related accident.
            </p>
            <div className="space-y-3">
              <a
                href="mailto:help@checkacase.com"
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
                help@checkacase.com
              </a>
              <a
                href="tel:+18884546304"
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5" />
                (888) 454-6304
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-3">
              <Link to="/PrivacyPolicy" className="block text-white/70 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/TermsOfService" className="block text-white/70 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/AdvertisingDisclosure" className="block text-white/70 hover:text-white transition-colors">
                Advertising Disclosure
              </Link>
              <Link to="/PartnerList" className="block text-white/70 hover:text-white transition-colors">
                Partner List
              </Link>
            </div>
          </div>

          {/* Contact Form */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            {submitted ? (
              <p className="text-white/80">Thank you! We'll be in touch soon.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 rounded-lg"
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 rounded-lg"
                />
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Accident State"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 rounded-lg"
                  />
                  <Input
                    placeholder="Zip Code"
                    value={form.zip_code}
                    onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 rounded-lg"
                  />
                </div>
                <Select
                  value={form.accident_type}
                  onValueChange={(v) => setForm({ ...form, accident_type: v })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-11 rounded-lg">
                    <SelectValue placeholder="Accident Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Accident Details"
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg min-h-[80px]"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl h-12 font-bold"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-white/50 text-sm">
          2025 © checkacase.com | All Rights Reserved
        </div>
      </div>
    </footer>
  );
}