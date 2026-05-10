import React, { useState } from "react";
import { X, ArrowLeft, ArrowRight } from "lucide-react";

export default function PreviewModal({ nodes, quiz, onClose }) {
  const sorted = [...nodes].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  const current = sorted[currentIdx];
  if (!current) return null;

  const ANSWER_TYPES = ["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"];

  const handleAnswer = (optionId, value) => {
    setAnswers((p) => ({ ...p, [current.id]: value }));
    // Auto advance after select
    setTimeout(() => {
      if (currentIdx < sorted.length - 1) setCurrentIdx((i) => i + 1);
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Preview</span>
            <span className="text-xs text-muted-foreground">(Basic walker, no analytics)</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        {quiz?.settings?.progress_bar !== false && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / sorted.length) * 100}%` }}
            />
          </div>
        )}

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
              {current.node_type}
            </span>
            <span className="text-xs text-muted-foreground">{current.label}</span>
          </div>

          <h2 className="text-xl font-bold text-foreground">
            {current.title_display || "(no title)"}
          </h2>

          {current.help_text && (
            <p className="text-sm text-muted-foreground">{current.help_text}</p>
          )}

          {ANSWER_TYPES.includes(current.node_type) && (
            <div className="grid gap-2">
              {(current.answer_options || []).map((opt) => (
                <button
                  key={opt.option_id}
                  onClick={() => handleAnswer(opt.option_id, opt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    answers[current.id] === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${opt.is_dq ? "border-red-200" : ""}`}
                >
                  <span className="text-sm font-medium">{opt.label || "(no label)"}</span>
                  {opt.is_dq && <span className="ml-auto text-xs text-red-500 font-medium">{opt.dq_type} DQ</span>}
                </button>
              ))}
            </div>
          )}

          {current.node_type === "text_field" && (
            <input placeholder={current.placeholder || "Enter your answer..."}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm" />
          )}

          {current.node_type === "form" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="First Name" className="h-10 px-3 rounded-lg border border-input bg-background text-sm" />
                <input placeholder="Last Name" className="h-10 px-3 rounded-lg border border-input bg-background text-sm" />
              </div>
              <input placeholder="Email Address" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm" />
              <input placeholder="Phone Number" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm" />
              <input placeholder="Zip Code" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm" />
            </div>
          )}

          {current.node_type === "results_page" && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">{current.config?.result_template || "(no template)"}</p>
              {current.config?.redirect_url && (
                <p className="text-xs text-green-600 mt-2">Redirects to: {current.config.redirect_url}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-border">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => i - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-xs text-muted-foreground">{currentIdx + 1} / {sorted.length}</span>
          <button
            disabled={currentIdx === sorted.length - 1}
            onClick={() => setCurrentIdx((i) => i + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-colors"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}