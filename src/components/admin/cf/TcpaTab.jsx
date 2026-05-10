import React from "react";
import { Switch } from "@/components/ui/switch";

const DEFAULT_TCPA = `By clicking 'Continue', I provide my electronic signature and agree to the Terms of Use, Privacy Policy, and consent to receive calls (including by automated means or pre-recorded message), text messages, and emails from Check A Case and its marketing partners and one or more law firms regarding my potential claim, even if my number is on a Do Not Call list. Consent is not a condition of services. Message and data rates may apply. Reply STOP to opt out. I agree to the Arbitration Agreement and confirm I am the subscriber or customary user of the phone number provided.`;

export default function TcpaTab({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">TCPA Enabled</span>
        <Switch checked={!!form.tcpa_enabled} onCheckedChange={(v) => onChange({ tcpa_enabled: v })} />
      </div>

      {form.tcpa_enabled && (
        <>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Display Mode</label>
            <select value={form.tcpa_display_mode || 'implicit'}
              onChange={(e) => onChange({ tcpa_display_mode: e.target.value })}
              className="w-full h-8 px-2 rounded border border-input bg-background text-sm">
              <option value="implicit">Implicit (on button click)</option>
              <option value="explicit_checkbox">Explicit Checkbox (required)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">TCPA Text</label>
              <button onClick={() => onChange({ tcpa_text: DEFAULT_TCPA })}
                className="text-[10px] text-primary hover:underline">Reset to default</button>
            </div>
            <textarea
              value={form.tcpa_text || DEFAULT_TCPA}
              onChange={(e) => onChange({ tcpa_text: e.target.value })}
              rows={8}
              className="w-full px-2 py-1.5 rounded border border-input bg-background text-[11px] resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Link Overrides</label>
            {['terms_url', 'privacy_url', 'arbitration_url'].map((key) => (
              <div key={key}>
                <label className="text-[10px] text-muted-foreground capitalize">{key.replace('_url', '').replace('_', ' ')}</label>
                <input value={(form.tcpa_link_overrides || {})[key] || ''}
                  onChange={(e) => onChange({ tcpa_link_overrides: { ...(form.tcpa_link_overrides || {}), [key]: e.target.value } })}
                  placeholder="/TermsOfService"
                  className="w-full h-7 px-2 rounded border border-input bg-background text-xs mt-0.5" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}