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

const inputCls = "w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm";
const selectCls = "w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm appearance-none";
const labelCls = "block text-sm font-medium text-white/90 mb-1.5";

function Field({ id, label, required, children }) {
  return (
    <div className="space-y-0">
      <label htmlFor={id} className={labelCls}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

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
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-6 text-center space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="font-semibold text-white">Thanks, {firstName}! We've received your message.</p>
                  <p className="text-sm text-white/70">A member of our team will reach out within 1 business day.</p>
                  <p className="text-sm text-white/60">To fast-track your case, call us at <a href="tel:+18884546304" className="text-white underline">(888) 454-6304</a>.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Field id="name" label="Full Name" required>
                    <input id="name" name="name" type="text" required placeholder="Your full name" className={inputCls} />
                  </Field>

                  <Field id="email" label="Email" required>
                    <input id="email" name="email" type="email" required placeholder="you@example.com" className={inputCls} />
                  </Field>

                  <Field id="phone" label="Phone" required>
                    <input id="phone" name="phone" type="tel" required placeholder="(555) 555-5555" className={inputCls} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field id="state" label="State" required>
                      <select id="state" name="state" required className={selectCls} defaultValue="">
                        <option value="" disabled>Select state</option>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field id="zip" label="Zip Code" required>
                      <input id="zip" name="zip" type="text" required placeholder="12345" pattern="[0-9]{5}" className={inputCls} />
                    </Field>
                  </div>

                  <Field id="accident_type" label="Accident Type" required>
                    <select id="accident_type" name="accident_type" required className={selectCls} defaultValue="">
                      <option value="" disabled>Select type</option>
                      {ACCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>

                  <Field id="details" label="Accident Details">
                    <textarea id="details" name="details" rows={4} placeholder="Briefly describe what happened…" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-sm resize-none" />
                  </Field>

                  {submitStatus === "error" && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3">
                      Something went wrong. Please try again or call us directly at <a href="tel:+18884546304" className="underline">(888) 454-6304</a>.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white btn-gradient shadow-lg shadow-blue-500/20 transition-all hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : "Send Message"}
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