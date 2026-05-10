import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PreviewModal({ open, onClose, quiz, nodes }) {
  const [stepIndex, setStepIndex] = useState(0);
  const sorted = [...nodes].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const node = sorted[stepIndex];

  const reset = () => setStepIndex(0);

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Preview - {quiz?.title}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground mb-3">
          Step {stepIndex + 1} of {sorted.length} | {node.node_type}
        </div>
        <div className="bg-muted/30 rounded-xl p-6 min-h-48 space-y-4">
          {node.media_image_url && (
            <img src={node.media_image_url} alt="" className="w-full rounded-lg object-cover max-h-40" />
          )}
          {node.title_display && (
            <h3 className="text-lg font-bold text-foreground">{node.title_display}</h3>
          )}
          {node.help_text && (
            <p className="text-sm text-muted-foreground">{node.help_text}</p>
          )}
          {["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"].includes(node.node_type) && (
            <div className="grid gap-2">
              {(node.answer_options || []).map((opt) => (
                <button key={opt.option_id} className={`text-left p-3 rounded-lg border text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5 ${opt.is_dq ? "border-amber-200 bg-amber-50 text-amber-700" : "border-border"}`}>
                  {opt.label || "(empty option)"}
                  {opt.is_dq && <span className="ml-2 text-xs opacity-60">({opt.dq_type} DQ)</span>}
                </button>
              ))}
            </div>
          )}
          {node.node_type === "form" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input className="border rounded px-3 py-2 text-sm" placeholder="First Name" readOnly />
                <input className="border rounded px-3 py-2 text-sm" placeholder="Last Name" readOnly />
              </div>
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Email" readOnly />
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Phone" readOnly />
            </div>
          )}
          {node.node_type === "results_page" && (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm text-muted-foreground">{node.config?.result_template || "Result page"}</p>
              {node.config?.redirect_url && <p className="text-xs text-muted-foreground mt-1">Redirects to: {node.config.redirect_url}</p>}
            </div>
          )}
          {node.form_html && (
            <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: node.form_html }} />
          )}
        </div>
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" onClick={() => setStepIndex((s) => Math.max(0, s - 1))} disabled={stepIndex === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <span className="text-xs text-muted-foreground font-mono">{node.label || node.node_type}</span>
          <Button size="sm" onClick={() => setStepIndex((s) => Math.min(sorted.length - 1, s + 1))} disabled={stepIndex === sorted.length - 1}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-1">Basic preview only. Full runtime coming in Phase 3.</p>
      </DialogContent>
    </Dialog>
  );
}