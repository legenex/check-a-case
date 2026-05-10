import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { getFieldKey } from "./SingleSelectNode";

export default function TextFieldNode({ node, fieldValues, onAnswer }) {
  const key = getFieldKey(node);
  const [value, setValue] = useState(fieldValues[key] || '');
  const [error, setError] = useState('');

  const inputType = node.config?.input_type || 'text';

  const validate = () => {
    if (node.required && !value.trim()) {
      setError('This field is required');
      return false;
    }
    for (const rule of (node.validation_rules || [])) {
      if (rule.rule_type === 'valid_email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError(rule.error_message || 'Please enter a valid email');
        return false;
      }
      if (rule.rule_type === 'valid_phone' && value && !/^\+?[\d\s\-().]{7,}$/.test(value)) {
        setError(rule.error_message || 'Please enter a valid phone number');
        return false;
      }
      if (rule.rule_type === 'min_length' && value.length < (rule.params?.min || 0)) {
        setError(rule.error_message || `Minimum ${rule.params?.min} characters`);
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    onAnswer({ [key]: value }, null);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--rt-text, #0f172a)' }}>
        {node.title_display}
      </h2>
      {node.help_text && <p className="text-slate-500 mb-4">{node.help_text}</p>}
      <input
        type={inputType}
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
        placeholder={node.placeholder || ''}
        className={`w-full h-12 px-4 rounded-xl border-2 text-base transition-colors outline-none ${
          error ? 'border-red-400' : 'border-slate-200 focus:border-[var(--rt-primary,#0284c7)]'
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      <button
        onClick={handleNext}
        className="mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold"
        style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}