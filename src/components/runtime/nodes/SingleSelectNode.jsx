import React, { useState } from "react";
import { Check } from "lucide-react";

export default function SingleSelectNode({ node, fieldValues, onAnswer }) {
  const [selected, setSelected] = useState(
    fieldValues[getFieldKey(node)] || null
  );
  const primaryColor = 'var(--rt-primary, #0284c7)';

  const handleSelect = (opt) => {
    setSelected(opt.value);
    // Auto-advance after delay
    setTimeout(() => {
      onAnswer({ [getFieldKey(node)]: opt.value }, opt);
    }, 120);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--rt-text, #0f172a)' }}>
        {node.title_display}
      </h2>
      {node.help_text && <p className="text-slate-500 mb-6">{node.help_text}</p>}
      <div className="grid gap-3 mt-6">
        {(node.answer_options || []).map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.option_id}
              onClick={() => handleSelect(opt)}
              className={`flex items-center gap-3 w-full px-5 py-4 rounded-xl border-2 text-left transition-all font-medium ${
                isSelected ? 'border-[var(--rt-primary,#0284c7)] bg-blue-50 text-blue-800' : 'border-slate-200 hover:border-slate-400 bg-white text-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[var(--rt-primary,#0284c7)] bg-[var(--rt-primary,#0284c7)]' : 'border-slate-300'}`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </span>
              {opt.icon && <span className="text-xl">{opt.icon}</span>}
              <span>{opt.label}</span>
              {opt.is_dq && <span className="ml-auto text-xs text-red-400 font-normal">{opt.dq_type === 'hard' ? 'Hard DQ' : 'Soft DQ'}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getFieldKey(node) {
  return node.custom_field_assignments?.[0]?.custom_field_id
    || node.label?.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    || node.node_id;
}