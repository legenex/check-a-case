import {
  Play, FileText, Circle, List, CheckSquare, ChevronDown, Type, AlignLeft,
  Info, Sliders, MapPin, Calendar, Clock, GitBranch, ArrowRight,
  ClipboardList, MessageSquare, Mail, MessageCircle, Send, Shield,
  Webhook, Trophy,
} from "lucide-react";

export const NODE_CATEGORIES = [
  {
    name: "Entry",
    iconColor: "text-blue-600",
    borderClass: "border-blue-500 bg-blue-50/30",
    types: [
      { type: "start_page", label: "Start Page", Icon: Play, description: "First page, captures URL params" },
      { type: "custom_page", label: "Custom Page", Icon: FileText, description: "Rich-text page between questions" },
    ],
  },
  {
    name: "Questions",
    iconColor: "text-slate-600",
    borderClass: "border-slate-300 bg-white",
    types: [
      { type: "single_select", label: "Single Select", Icon: Circle, description: "One answer, auto-advance" },
      { type: "multiple_choice", label: "Multiple Choice", Icon: List, description: "Like single but explicit Next" },
      { type: "checkbox_multi_select", label: "Multi Select", Icon: CheckSquare, description: "Pick several" },
      { type: "dropdown", label: "Dropdown", Icon: ChevronDown, description: "For long option lists" },
      { type: "text_field", label: "Text Input", Icon: Type, description: "Free-text answer" },
      { type: "text_block", label: "Text Block", Icon: AlignLeft, description: "Display-only text" },
      { type: "information", label: "Information", Icon: Info, description: "Notice or callout" },
      { type: "slider", label: "Slider", Icon: Sliders, description: "Numeric range" },
      { type: "address", label: "Address", Icon: MapPin, description: "Street, city, state, zip" },
      { type: "date_picker", label: "Date", Icon: Calendar, description: "Date with bucketing" },
      { type: "datetime_picker", label: "Date + Time", Icon: Clock, description: "Date with time" },
    ],
  },
  {
    name: "Logic",
    iconColor: "text-amber-600",
    borderClass: "border-amber-500 bg-amber-50/30",
    types: [
      { type: "decision_node", label: "Decision", Icon: GitBranch, description: "Branch on field values" },
      { type: "transition", label: "Transition", Icon: ArrowRight, description: "Pass-through routing" },
    ],
  },
  {
    name: "Forms",
    iconColor: "text-emerald-600",
    borderClass: "border-emerald-500 bg-emerald-50/30",
    types: [
      { type: "form", label: "Form", Icon: ClipboardList, description: "Lead capture form" },
    ],
  },
  {
    name: "Notifications",
    iconColor: "text-purple-600",
    borderClass: "border-purple-500 bg-purple-50/30",
    types: [
      { type: "notification_sms", label: "SMS", Icon: MessageSquare, description: "Twilio SMS" },
      { type: "notification_email", label: "Email", Icon: Mail, description: "Send email" },
      { type: "notification_whatsapp", label: "WhatsApp", Icon: MessageCircle, description: "WhatsApp message" },
      { type: "notification_messenger", label: "Messenger", Icon: Send, description: "Facebook Messenger" },
      { type: "notification_telegram", label: "Telegram", Icon: Send, description: "Telegram bot" },
    ],
  },
  {
    name: "Verification",
    iconColor: "text-cyan-600",
    borderClass: "border-cyan-500 bg-cyan-50/30",
    types: [
      { type: "phone_verification", label: "Phone Verify", Icon: Shield, description: "Twilio Verify OTP" },
    ],
  },
  {
    name: "Integrations",
    iconColor: "text-orange-600",
    borderClass: "border-orange-500 bg-orange-50/30",
    types: [
      { type: "webhook_api", label: "Webhook / API", Icon: Webhook, description: "External call" },
    ],
  },
  {
    name: "Outcomes",
    iconColor: "text-blue-700",
    borderClass: "border-blue-600 bg-blue-600 text-white",
    types: [
      { type: "results_page", label: "Results Page", Icon: Trophy, description: "Final page, tier outcome" },
    ],
  },
];

export function getCategoryForType(nodeType) {
  for (const cat of NODE_CATEGORIES) {
    const found = cat.types.find((t) => t.type === nodeType);
    if (found) return { cat, typeDef: found };
  }
  return { cat: NODE_CATEGORIES[1], typeDef: { type: nodeType, label: nodeType, Icon: Circle, description: "" } };
}

export function getBorderClass(nodeType) {
  const { cat } = getCategoryForType(nodeType);
  return cat.borderClass;
}