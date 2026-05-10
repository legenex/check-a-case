import React from "react";

/**
 * Wraps the runtime in brand-aware styling.
 * Applies CSS variables from resolved brand, injects header/footer HTML.
 */
export default function RuntimeShell({ brand, quizOverrides, children }) {
  const primary = brand?.primary_color || quizOverrides?.primary_color || '#0284c7';
  const accent = brand?.accent_color || quizOverrides?.accent_color || primary;
  const bg = brand?.background_color || quizOverrides?.background_color || '#ffffff';
  const text = brand?.text_color || quizOverrides?.text_color || '#0f172a';

  const cssVars = {
    '--rt-primary': primary,
    '--rt-accent': accent,
    '--rt-bg': bg,
    '--rt-text': text,
  };

  return (
    <div style={{ ...cssVars, backgroundColor: bg, color: text, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {brand?.header_html && (
        <div dangerouslySetInnerHTML={{ __html: brand.header_html }} />
      )}
      <div className="flex flex-col min-h-screen">
        {children}
      </div>
      {brand?.footer_html && (
        <div dangerouslySetInnerHTML={{ __html: brand.footer_html }} />
      )}
      {brand?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: brand.custom_css }} />
      )}
    </div>
  );
}