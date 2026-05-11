import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { submitDecisionTreeForm } from "@/functions/submitDecisionTreeForm";

const STATES_US = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

const DEFAULT_TCPA = `By clicking 'Continue', I provide my electronic signature and agree to the Terms of Use, Privacy Policy, and consent to receive calls (including by automated means or pre-recorded message), text messages, and emails from Check A Case and its marketing partners and one or more law firms regarding my potential claim, even if my number is on a Do Not Call list. Consent is not a condition of services. Message and data rates may apply. Reply STOP to opt out. I agree to the Arbitration Agreement and confirm I am the subscriber or customary user of the phone number provided.`;

export default function FormNode({ node, contactForm, fieldValues, runId, sessionId, onSuccess, onError }) {
  const fields = contactForm?.fields || [];
  const tcpaEnabled = contactForm?.tcpa_enabled ?? true;
  const tcpaText = contactForm?.tcpa_text || DEFAULT_TCPA;
  const tcpaMode = contactForm?.tcpa_display_mode || 'implicit';
  const trustedFormEnabled = contactForm?.trustedform_enabled ?? true;
  const trustedFormFieldId = contactForm?.trustedform_field_id || 'xxTrustedFormCertUrl';
  const [values, setValues] = useState(() => {
    const init = {};
    fields.forEach((f) => { init[f.custom_field_id] = fieldValues[f.custom_field_id] || ''; });
    return init;
  });
  const [tcpaChecked, setTcpaChecked] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Inject TrustedForm script if not already present
  useEffect(() => {
    if (!trustedFormEnabled) return;
    // If TrustedForm already loaded (cert URL present in window), skip
    if (window.trustedForm?.certUrl) return;
    const existing = document.getElementById('tf-script');
    if (existing) return;
    const script = document.createElement('script');
    script.id = 'tf-script';
    script.type = 'text/javascript';
    script.async = true;
    const field = trustedFormFieldId;
    const tf = document.createElement('input');
    tf.type = 'hidden';
    tf.name = field;
    tf.id = field;
    document.forms[0]?.appendChild(tf);
    script.src = `https://api.trustedform.com/trustedform.js?field=${field}&ping_field=xxTrustedFormPingUrl&use_tagged_consent=false&l=${new Date().getTime()}&${Math.random()}`;
    document.head.appendChild(script);
  }, [trustedFormEnabled, trustedFormFieldId]);

  const validate = () => {
    const errs = {};
    fields.forEach((f) => {
      if (f.is_required && !values[f.custom_field_id]?.trim()) {
        errs[f.custom_field_id] = `${f.display_label_override || f.custom_field_id} is required`;
      }
    });
    if (tcpaEnabled && tcpaMode === 'explicit_checkbox' && !tcpaChecked) {
      errs.__tcpa = 'You must agree to the terms to continue';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const merged = { ...fieldValues, ...values };
      // Capture TrustedForm cert URL from the hidden input injected by their script
      if (trustedFormEnabled) {
        const certInput = document.getElementById(trustedFormFieldId);
        if (certInput?.value) merged.trusted_form_cert_url = certInput.value;
      }
      const res = await submitDecisionTreeForm({ runId, nodeId: node.id, fieldValues: merged, sessionId });
      if (res.data?.success) {
        onSuccess(res.data);
      } else {
        onError(res.data?.error || 'Submission failed');
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-2">{node.title_display || 'Enter Your Information'}</h2>
      {node.help_text && <p className="text-slate-500 mb-6">{node.help_text}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => {
            const width = f.width || 'full';
            const colClass = width === 'half' ? 'col-span-1' : width === 'third' ? 'col-span-1' : 'col-span-2';
            const label = f.display_label_override || f.custom_field_id?.replace(/_/g, ' ');
            const key = f.custom_field_id;

            return (
              <div key={key} className={colClass}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {label}{f.is_required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {key === 'state' || key === 'accident_state' ? (
                  <select
                    value={values[key] || ''}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm"
                  >
                    <option value="">Select state...</option>
                    {STATES_US.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    type={key.includes('email') ? 'email' : key.includes('phone') ? 'tel' : 'text'}
                    value={values[key] || ''}
                    placeholder={f.placeholder || ''}
                    autoComplete={f.autocomplete || 'off'}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    className={`w-full h-10 px-3 rounded-lg border text-sm ${errors[key] ? 'border-red-400' : 'border-slate-200'}`}
                  />
                )}
                {errors[key] && <p className="text-red-500 text-xs mt-0.5">{errors[key]}</p>}
              </div>
            );
          })}
        </div>

        {tcpaEnabled && tcpaMode === 'explicit_checkbox' && (
          <div className="flex gap-2 items-start">
            <input type="checkbox" id="tcpa" checked={tcpaChecked} onChange={(e) => setTcpaChecked(e.target.checked)}
              className="mt-0.5 flex-shrink-0" />
            <label htmlFor="tcpa" className="text-xs text-slate-500 leading-relaxed">{tcpaText}</label>
          </div>
        )}
        {errors.__tcpa && <p className="text-red-500 text-xs">{errors.__tcpa}</p>}

        {tcpaEnabled && tcpaMode === 'implicit' && (
          <p className="text-xs text-slate-400 leading-relaxed">{tcpaText}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : (contactForm?.submit_button_text || 'Continue')}
        </button>
      </form>
    </div>
  );
}