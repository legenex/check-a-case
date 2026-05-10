import React, { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ResultsNode({ node, fieldValues }) {
  const config = node.config || {};
  const tier = config.qualification_tier;
  const qualified = tier && tier !== 'DQ';
  const redirectUrl = config.redirect_url;
  const redirectDelay = config.redirect_delay_seconds ?? 3;

  const renderTemplate = (tpl) => {
    if (!tpl) return '';
    return tpl.replace(/\{(\w+)\}/g, (_, key) => fieldValues[key] ?? '');
  };

  useEffect(() => {
    if (redirectUrl) {
      const t = setTimeout(() => {
        window.location.href = renderTemplate(redirectUrl);
      }, redirectDelay * 1000);
      return () => clearTimeout(t);
    }
  }, [redirectUrl]);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-12 text-center">
      <div className="flex justify-center mb-6">
        {qualified ? (
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        ) : (
          <XCircle className="w-16 h-16 text-slate-400" />
        )}
      </div>
      <h2 className="text-3xl font-black mb-4">
        {renderTemplate(node.title_display || (qualified ? 'You May Qualify!' : 'Thank You'))}
      </h2>
      {node.help_text && (
        <p className="text-lg text-slate-600 mb-6">{renderTemplate(node.help_text)}</p>
      )}
      {config.result_template && (
        <div
          className="prose prose-slate max-w-none text-left bg-slate-50 rounded-xl p-6 mb-6"
          dangerouslySetInnerHTML={{ __html: renderTemplate(config.result_template) }}
        />
      )}
      {redirectUrl && (
        <p className="text-sm text-slate-400">Redirecting in {redirectDelay} seconds...</p>
      )}
    </div>
  );
}