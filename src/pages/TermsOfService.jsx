import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl font-extrabold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10"><strong>Effective Date:</strong> Oct 1, 2023</p>
        <div className="prose prose-lg max-w-none text-foreground/80 space-y-8">
          <p>
            These Terms and Conditions ("Terms") govern your use of the <a href="https://checkacase.com" className="text-primary">Checkacase.com</a> website (the "Website"), owned and operated by NJA-Online LLC ("we," "us," or "our"). By accessing or using the Website, you agree to be bound by these Terms. If you do not agree with any of the provisions of these Terms, you must not access or use the Website.
          </p>

          <h2 className="text-2xl font-bold text-foreground">1. User Responsibilities</h2>
          <p><strong>1.1. Eligibility:</strong> By using the Website, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.</p>
          <p><strong>1.2. Account Registration:</strong> In order to access certain features or services on the Website, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating an account and to promptly update any information that may change.</p>
          <p><strong>1.3. Compliance with Laws:</strong> You agree to comply with all applicable laws and regulations when using the Website. You acknowledge that it is your responsibility to determine the legality, appropriateness, and suitability of any actions you take on or through the Website.</p>

          <h2 className="text-2xl font-bold text-foreground">2. Intellectual Property</h2>
          <p><strong>2.1. Ownership:</strong> The Website and all content, materials, and features available on the Website, including but not limited to text, graphics, logos, images, audio clips, video clips, and software, are the property of NJA-Online LLC or its licensors and are protected by applicable intellectual property laws.</p>
          <p><strong>2.2. Limited License:</strong> Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, and revocable license to access and use the Website for personal, non-commercial purposes. You may not reproduce, modify, distribute, sell, lease, create derivative works, or exploit the Website or any content, materials, or features on the Website without our prior written consent.</p>

          <h2 className="text-2xl font-bold text-foreground">3. Privacy and Data Sharing</h2>
          <p><strong>3.1. Privacy Policy:</strong> Your privacy is important to us. Please review our <Link to="/PrivacyPolicy" className="text-primary">Privacy Policy</Link> to understand how we collect, use, and disclose information about you.</p>
          <p><strong>3.2. Data Sharing:</strong> By using the Website, you acknowledge and agree that we may share your end user data, including personal information, with third-party service providers such as Twilio and mobile operators. This data sharing is necessary to verify user identities, detect and protect against fraud, and provide you with the services offered on the Website. We will take reasonable measures to ensure that any third parties with whom we share your data comply with applicable data protection laws and protect your information.</p>

          <h2 className="text-2xl font-bold text-foreground">4. Disclaimers and Limitations of Liability</h2>
          <p><strong>4.1. No Legal Advice:</strong> The information provided on the Website is for general informational purposes only and should not be construed as legal advice. You should consult with a qualified attorney for advice specific to your situation.</p>
          <p><strong>4.2. No Guarantee of Results:</strong> We do not guarantee any specific results from using the Website or the services provided on the Website. The outcome of any legal matter or claim depends on various factors beyond our control.</p>
          <p><strong>4.3. Limitation of Liability:</strong> To the maximum extent permitted by law, we shall not be liable for any direct, indirect, incidental, consequential, special, or exemplary damages arising out of or in connection with your use of the Website or reliance on any information provided on the Website. This limitation applies whether the damages are based on contract, tort, negligence, strict liability, or any other legal theory.</p>

          <h2 className="text-2xl font-bold text-foreground">5. Termination</h2>
          <p>We may, in our sole discretion, suspend or terminate your access to the Website at any time without prior notice or liability, for any reason, including if we believe that you have violated these Terms or engaged in any conduct that may harm our reputation or interfere with the operation of the Website.</p>

          <h2 className="text-2xl font-bold text-foreground">6. Communications Consent</h2>
          <p>By submitting your details on any of our forms, you agree to receive calls and/or text messages from Accident Compensation Experts and/or our <Link to="/PartnerList" className="text-primary">affiliated partners</Link> on the phone number you provided. You acknowledge and agree that your contact information, including the phone number provided, may be shared with third-party verification services, such as Twilio and mobile operators, to verify your identity and detect/protect against fraud. Please note that you may receive communications even if your telephone number is listed on a 'Do Not Contact' list, and your consent is not a requirement of purchase.</p>

          <h2 className="text-2xl font-bold text-foreground">7. Severability</h2>
          <p>If any provision of these Terms is found to be unlawful, void, or unenforceable, the remaining provisions shall remain in full force and effect.</p>

          <h2 className="text-2xl font-bold text-foreground">8. Governing Law and Jurisdiction</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the United States of America. Any legal action or proceeding arising out of or related to these Terms or the use of the Website shall be brought exclusively in the courts of the United States of America, and you consent to the jurisdiction of such courts.</p>

          <h2 className="text-2xl font-bold text-foreground">9. Changes to the Terms</h2>
          <p>We reserve the right to modify or update these Terms at any time, without prior notice. Any changes to the Terms will be effective upon posting on the Website. It is your responsibility to review the Terms periodically for any updates or changes. Your continued use of the Website after the posting of any modifications to the Terms constitutes your acceptance of such changes.</p>

          <h2 className="text-2xl font-bold text-foreground">10. Contact Us</h2>
          <p>If you have any questions or concerns regarding these Terms, please contact us at <a href="mailto:help@checkacase.com" className="text-primary">help@checkacase.com</a></p>
          <p>By accessing or using the Website, you acknowledge that you have read, understood, and agreed to these Terms.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}