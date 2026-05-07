import React from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl font-extrabold text-foreground mb-10">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none text-foreground/80 space-y-8">
          <p>
            This privacy policy ("Policy") applies to the personal information collected by NJA-Online LLC ("we" or "us") through the <a href="https://checkacase.com" className="text-primary">Checkacase.com</a> website ("Website"). We are committed to protecting your privacy and handling your personal information in accordance with applicable data protection laws.
          </p>

          <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
          <p>We may collect the following types of personal information from you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contact Information: name, email address, phone number, and mailing address.</li>
            <li>Personal Information: information related to your accident or injury, including but not limited to the date and location of the accident, the extent of your injuries, and any medical treatment you received.</li>
            <li>Other Information: we may also collect other information you provide to us, such as when you submit a question or request through our online contact form.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">2. How We Use Your Information</h2>
          <p>We may use your personal information for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To respond to your inquiries and requests.</li>
            <li>To provide you with information about our services and other relevant information.</li>
            <li>To improve our Website and services.</li>
            <li>To comply with legal and regulatory requirements.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">3. How We Share Your Information</h2>
          <p>We may share your personal information with the following parties:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Our service providers: We may share your personal information with third-party service providers that assist us in providing our services.</li>
            <li>Legal requirements: We may disclose your personal information to comply with applicable laws, regulations, legal processes, or government requests.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">4. Your Rights</h2>
          <p>You have certain rights with respect to your personal information. You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal information.</li>
            <li>Correct any errors in your personal information.</li>
            <li>Object to the processing of your personal information.</li>
            <li>Delete your personal information.</li>
            <li>Restrict the processing of your personal information.</li>
            <li>Withdraw your consent to the processing of your personal information.</li>
          </ul>
          <p>If you wish to exercise any of these rights, please contact us using the contact information below.</p>

          <h2 className="text-2xl font-bold text-foreground">5. Security</h2>
          <p>We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, we cannot guarantee the security of your personal information.</p>

          <h2 className="text-2xl font-bold text-foreground">6. Links to Third-Party Websites</h2>
          <p>Our Website may contain links to third-party websites. We are not responsible for the privacy practices or content of these third-party websites.</p>

          <h2 className="text-2xl font-bold text-foreground">7. Changes to the Policy</h2>
          <p>We reserve the right to change this Policy at any time. We will notify you of any material changes to this Policy by posting the updated Policy on our Website.</p>

          <h2 className="text-2xl font-bold text-foreground">8. California Privacy Rights</h2>
          <p>
            If you are a California resident, you have the right to request information about our data practices related to your personal information, including the categories of personal information we have collected, the categories of sources from which we collected your personal information, the business or commercial purposes for collecting your personal information, the categories of third parties with whom we share your personal information, and the specific pieces of personal information we have collected about you.
          </p>
          <p>
            You also have the right to request that we delete your personal information, subject to certain exceptions under applicable law.
          </p>
          <p>
            To exercise these rights, please contact us using the contact information below. We will verify your request by asking for information that matches our records and may require additional information to confirm your identity.
          </p>

          <h2 className="text-2xl font-bold text-foreground">9. Contact Us</h2>
          <p>
            If you have any questions about this Policy or our privacy practices, or if you would like to exercise your privacy rights, please contact us at: <a href="mailto:help@checkacase.com" className="text-primary">help@checkacase.com</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}