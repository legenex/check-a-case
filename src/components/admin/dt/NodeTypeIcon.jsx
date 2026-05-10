import React from "react";
import {
  Play, Layout, ListChecks, CheckSquare, ChevronDown, Type, AlignLeft,
  Info, SlidersHorizontal, MapPin, Calendar, CalendarClock, GitBranch,
  FileText, ArrowRight, MessageSquare, Mail, Phone, Webhook, Trophy,
  MessageCircle, Send, ShieldCheck
} from "lucide-react";

const ICONS = {
  start_page: Play,
  custom_page: Layout,
  multiple_choice: ListChecks,
  single_select: CheckSquare,
  checkbox_multi_select: ListChecks,
  dropdown: ChevronDown,
  text_field: Type,
  text_block: AlignLeft,
  information: Info,
  slider: SlidersHorizontal,
  address: MapPin,
  date_picker: Calendar,
  datetime_picker: CalendarClock,
  decision_node: GitBranch,
  form: FileText,
  transition: ArrowRight,
  notification_sms: MessageSquare,
  notification_email: Mail,
  notification_whatsapp: MessageCircle,
  notification_messenger: MessageCircle,
  notification_telegram: Send,
  phone_verification: Phone,
  webhook_api: Webhook,
  results_page: Trophy,
};

export default function NodeTypeIcon({ type, className = "w-4 h-4" }) {
  const Icon = ICONS[type] || Info;
  return <Icon className={className} />;
}