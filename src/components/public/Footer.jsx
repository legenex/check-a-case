import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Linkedin, Facebook, Twitter, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM",
  "NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
  "WV","WI","WY"
];

const ACCIDENT_TYPES = [
  "Vehicle Accident",
  "Work Accident",
  "Slip & Fall",
  "Medical Malpractice",
  "Other",
];


export default function Footer() {
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [firstName, setFirstName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const fName = (data.name || "").split(" ")[0] || data.name;
    setFirstName(fName);

    try {
      await base44.integrations.Core.SendEmail({
        to: "info@checkacase.com",
        subject: `New Contact Form Submission from ${data.name}`,
        body: `New contact form submission from checkacase.com:\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nState: ${data.state}\nZip: ${data.zip}\nAccident Type: ${data.accident_type}\n\nDetails:\n${data.details}\n\n---\nSubmitted: ${new Date().toLocaleString()}\nPage: ${window.location.pathname}`,
      });

      await base44.entities.Lead.create({
        first_name: fName,
        last_name: (data.name || "").split(" ").slice(1).join(" ") || "",
        email: data.email,
        phone: data.phone,
        state: data.state,
        zip_code: data.zip,
        accident_type: data.accident_type,
        notes: data.details,
        source: "footer_contact_form",
        attribution: JSON.parse(sessionStorage.getItem("cac_attribution") || "{}"),
      });

      setSubmitStatus("success");
      e.currentTarget.reset();
    } catch (err) {
      console.error("Contact form submission failed:", err);
      setSubmitStatus("error");
    } finally {
      setSubmitting(false);
    }
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
              <img src="https://checkacase.com/wp-content/uploads/2023/11/CAC-Logo-Light.png" alt="Check A Case" className="h-16 lg:h-20 w-auto" />
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

              {submitStatus === "success" ? (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-5 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-semibold text-white text-sm">Thanks! We've received your message.</p>
                  <p className="text-xs text-white/70">A team member will reach out within 1 business day.</p>
                  <p className="text-xs text-white/60">Need to talk now? Call <a href="tel:+18884546304" className="text-white underline">(888) 454-6304</a>.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input name="name" type="text" required placeholder="Name*" className="h-12 px-4 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm" />
                  <input name="email" type="email" required placeholder="Email*" className="h-12 px-4 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm" />
                  <input name="phone" type="tel" required placeholder="Phone*" className="h-12 px-4 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm" />
                  <select name="state" required defaultValue="" className="h-12 px-4 rounded-lg bg-white/5 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm">
                    <option value="" disabled>Accident State*</option>
                    {US_STATES.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                  </select>
                  <input name="zip" type="text" required pattern="[0-9]{5}" placeholder="Zipcode*" className="h-12 px-4 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm" />
                  <select name="accident_type" defaultValue="" className="h-12 px-4 rounded-lg bg-white/5 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm">
                    <option value="" disabled>Accident Type</option>
                    {ACCIDENT_TYPES.map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                  </select>
                  <textarea name="details" rows={3} placeholder="Accident Details" className="sm:col-span-2 px-4 py-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none text-sm" />

                  {submitStatus === "error" && (
                    <p className="sm:col-span-2 text-xs text-red-400 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
                      Something went wrong. Please try again or call <a href="tel:+18884546304" className="underline">(888) 454-6304</a>.
                    </p>
                  )}

                  <div className="sm:col-span-2 flex justify-center mt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-10 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold tracking-widest uppercase text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : "Submit"}
                    </button>
                  </div>
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