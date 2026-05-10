import React from "react";

const DEFAULT_TCPA = `By clicking 'Continue', I consent to receive calls, text messages, and emails regarding my potential claim.`;

export default function FormPreview({ form }) {
  const fields = form.fields || [];

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 bg-white">
      <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-4">Live Preview</p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f, idx) => {
          const label = f.display_label_override || (f.custom_field_id || '').replace(/_/g, ' ');
          const colClass = f.width === 'half' ? 'col-span-1' : f.width === 'third' ? 'col-span-1' : 'col-span-2';
          return (
            <div key={idx} className={colClass}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {label} {f.is_required && <span className="text-red-400">*</span>}
              </label>
              <div className="h-8 rounded-lg border-2 border-slate-200 bg-slate-50 text-xs text-slate-400 px-2 flex items-center">
                {f.placeholder || label}
              </div>
            </div>
          );
        })}
      </div>

      {form.tcpa_enabled && (
        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
          {form.tcpa_text || DEFAULT_TCPA}
        </p>
      )}

      <button className="mt-4 w-full h-10 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: '#0284c7' }}>
        {form.submit_button_text || 'Continue'}
      </button>
    </div>
  );
}