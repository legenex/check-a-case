import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CAC_QUIZ_STEPS, US_STATES } from "@/lib/quizData";
import { captureAttribution, getAttribution } from "@/lib/attribution";
import { ArrowLeft, ArrowRight, CheckCircle, Car, Truck, Bike, AlertTriangle, HardHat, Stethoscope, HelpCircle } from "lucide-react";

const ICON_MAP = { Car, Truck, Bike, AlertTriangle, HardHat, Stethoscope, HelpCircle };

export default function Survey() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({ first_name: "", last_name: "", email: "", phone: "", zip_code: "" });
  const [submitting, setSubmitting] = useState(false);
  const [dqFlag, setDqFlag] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { captureAttribution(); }, []);

  const currentStep = CAC_QUIZ_STEPS[step];
  const progress = ((step + 1) / CAC_QUIZ_STEPS.length) * 100;

  const handleSelect = useCallback((value, option) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));

    if (option?.dq_flag === "hard_dq") {
      setDqFlag("hard_dq");
      setTimeout(() => navigate("/Sorry"), 800);
      return;
    }
    if (option?.dq_flag === "soft_dq") {
      setDqFlag("soft_dq");
    }

    // Auto-advance after 120ms
    setTimeout(() => {
      if (step < CAC_QUIZ_STEPS.length - 1) {
        setStep((s) => s + 1);
      }
    }, 120);
  }, [currentStep, step, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const attribution = getAttribution();
    const qualification = dqFlag || "qualified";

    await base44.entities.Lead.create({
      ...contact,
      state: answers.state,
      accident_type: answers.accident_type,
      at_fault: answers.at_fault,
      injury_severity: answers.injury_severity,
      medical_treatment: answers.medical_treatment,
      time_since_accident: answers.time_since_accident,
      qualification,
      quiz_answers: answers,
      attribution,
      source: attribution.utm_source || "direct",
      campaign: attribution.s2 || "",
    });

    if (qualification === "soft_dq") {
      navigate("/Thanks");
    } else {
      navigate("/Submitted");
    }
  };

  const renderStep = () => {
    if (currentStep.type === "single_select") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {currentStep.options.map((opt) => {
            const Icon = opt.icon ? ICON_MAP[opt.icon] : null;
            const selected = answers[currentStep.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value, opt)}
                className={`relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                  selected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                {Icon && <Icon className="w-6 h-6 text-primary flex-shrink-0" />}
                <span className="font-medium text-foreground">{opt.label}</span>
                {selected && <CheckCircle className="w-5 h-5 text-primary absolute right-4" />}
              </button>
            );
          })}
        </div>
      );
    }

    if (currentStep.type === "state_select") {
      return (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 max-h-[50vh] overflow-y-auto pr-2">
          {US_STATES.map((st) => (
            <button
              key={st}
              onClick={() => handleSelect(st)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                answers[currentStep.id] === st
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      );
    }

    if (currentStep.type === "contact_form") {
      return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="First Name"
              value={contact.first_name}
              onChange={(e) => setContact({ ...contact, first_name: e.target.value })}
              required
              className="h-12 rounded-xl"
            />
            <Input
              placeholder="Last Name"
              value={contact.last_name}
              onChange={(e) => setContact({ ...contact, last_name: e.target.value })}
              className="h-12 rounded-xl"
            />
          </div>
          <Input
            type="email"
            placeholder="Email Address"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            required
            className="h-12 rounded-xl"
          />
          <Input
            type="tel"
            placeholder="Phone Number"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            required
            className="h-12 rounded-xl"
          />
          <Input
            placeholder="Zip Code"
            value={contact.zip_code}
            onChange={(e) => setContact({ ...contact, zip_code: e.target.value })}
            className="h-12 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            By submitting, you agree to our{" "}
            <a href="/TermsOfService" className="underline">Terms</a> and{" "}
            <a href="/PrivacyPolicy" className="underline">Privacy Policy</a>. 
            You consent to receive calls/texts from Check A Case and our{" "}
            <a href="/PartnerList" className="underline">affiliated partners</a>.
          </p>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-14 rounded-xl text-lg font-bold"
          >
            {submitting ? "Submitting..." : "Get My Free Case Review"}
          </Button>
        </form>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 flex items-center justify-center">
        <img
          src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png"
          alt="Check A Case"
          className="h-8 sm:h-10"
        />
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 mb-8">
        <Progress value={progress} className="h-2 rounded-full" />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Step {step + 1} of {CAC_QUIZ_STEPS.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pb-8">
        <div className="bg-card rounded-2xl border border-border shadow-lg p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">
            {currentStep.question}
          </h2>
          {renderStep()}
        </div>

        {/* Back button */}
        {step > 0 && currentStep.type !== "contact_form" && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mt-6 mx-auto transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>
    </div>
  );
}