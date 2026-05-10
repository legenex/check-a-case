import React from "react";
import { X } from "lucide-react";
import NodeTypeIcon from "./NodeTypeIcon";

const CATEGORIES = [
  {
    label: "Page Types",
    types: [
      { type: "start_page", label: "Start Page", desc: "Entry point with URL param capture" },
      { type: "custom_page", label: "Custom Page", desc: "Free-form HTML/rich text page" },
      { type: "results_page", label: "Results Page", desc: "Qualified / DQ outcome" },
    ],
  },
  {
    label: "Question Types",
    types: [
      { type: "single_select", label: "Single Select", desc: "One answer, card style" },
      { type: "multiple_choice", label: "Multiple Choice", desc: "One answer, list style" },
      { type: "checkbox_multi_select", label: "Multi-Select", desc: "Checkboxes, multiple answers" },
      { type: "dropdown", label: "Dropdown", desc: "Select from a list" },
      { type: "text_field", label: "Text Field", desc: "Free text input" },
      { type: "slider", label: "Slider", desc: "Numeric range input" },
      { type: "address", label: "Address", desc: "Address fields" },
      { type: "date_picker", label: "Date Picker", desc: "Date input with buckets" },
      { type: "datetime_picker", label: "Date + Time", desc: "Date and time input" },
    ],
  },
  {
    label: "Content",
    types: [
      { type: "text_block", label: "Text Block", desc: "Info / copy block" },
      { type: "information", label: "Information", desc: "Non-interactive message" },
      { type: "form", label: "Contact Form", desc: "Linked ContactForm template" },
    ],
  },
  {
    label: "Logic (Phase 2)",
    types: [
      { type: "decision_node", label: "Decision Node", desc: "Condition-based routing" },
      { type: "transition", label: "Transition", desc: "Animated step transition" },
    ],
  },
  {
    label: "Notifications (Phase 2)",
    types: [
      { type: "notification_sms", label: "SMS Notification", desc: "Send SMS" },
      { type: "notification_email", label: "Email Notification", desc: "Send email" },
      { type: "notification_whatsapp", label: "WhatsApp", desc: "Send WhatsApp message" },
      { type: "phone_verification", label: "Phone Verify", desc: "OTP phone verification" },
      { type: "webhook_api", label: "Webhook / API", desc: "Call external endpoint" },
    ],
  },
];

const PHASE2_TYPES = ["decision_node", "transition", "notification_sms", "notification_email", "notification_whatsapp", "phone_verification", "webhook_api", "custom_page", "notification_messenger", "notification_telegram"];

export default function NodeTypePicker({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Add Node</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat.label}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cat.types.map((t) => {
                  const isPhase2 = PHASE2_TYPES.includes(t.type);
                  return (
                    <button
                      key={t.type}
                      onClick={() => !isPhase2 && onSelect(t.type)}
                      disabled={isPhase2}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                        isPhase2
                          ? "border-border opacity-50 cursor-not-allowed"
                          : "border-border hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      <NodeTypeIcon type={t.type} className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium leading-tight">{t.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                        {isPhase2 && <span className="text-xs text-amber-600 font-medium">Phase 2</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}