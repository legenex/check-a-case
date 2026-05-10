import React from "react";
import { ArrowRight } from "lucide-react";

export default function StartPageNode({ node, quiz, brand, onNext }) {
  const logoUrl = brand?.logo_url || quiz?.branding_overrides?.logo_url;
  const primaryColor = 'var(--rt-primary, #0284c7)';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center max-w-2xl mx-auto">
      {logoUrl && (
        <img src={logoUrl} alt={brand?.brand_name || 'Logo'} className="h-12 mb-8 object-contain" />
      )}
      <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4" style={{ color: 'var(--rt-text, #0f172a)' }}>
        {node.title_display || quiz?.title || 'Get Started'}
      </h1>
      {node.help_text && (
        <p className="text-lg text-slate-500 mb-8 max-w-lg">{node.help_text}</p>
      )}
      <button
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: primaryColor }}
      >
        {node.config?.button_text || 'Get Started'} <ArrowRight className="w-5 h-5" />
      </button>
      <p className="text-xs text-slate-400 mt-6">Free and confidential. No obligation.</p>
    </div>
  );
}