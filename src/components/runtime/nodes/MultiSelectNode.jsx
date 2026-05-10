import React, { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { getFieldKey } from "./SingleSelectNode";

export default function MultiSelectNode({ node, fieldValues, onAnswer }) {
  const existing = fieldValues[getFieldKey(node)];
  const [selected, setSelected] = useState(Array.isArray(existing) ? existing : []);

  const toggle = (val) => {
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleNext = () => {
    onAnswer({ [getFieldKey(node)]: selected }, null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--rt-text, #0f172a)' }}>
        {node.title_display}
      </h2>
      {node.help_text && <p className="text-slate-500 mb-2">{node.help_text}</p>}
      <p className="text-sm text-slate-400 mb-6">Select all that apply</p>
      <div className="grid gap-3">
        {(node.answer_options || []).map((opt) => {
          const isOn = selected.includes(opt.value);
          return (
            <button key={opt.option_id} onClick={() => toggle(opt.value)}
              className={`flex items-center gap-3 w-full px-5 py-4 rounded-xl border-2 text-left transition-all font-medium ${
                isOn ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
              }`}>
              <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isOn ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                {isOn && <Check className="w-3 h-3 text-white" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={handleNext}
        disabled={selected.length === 0}
        className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold disabled:opacity-40 transition-opacity"
        style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}