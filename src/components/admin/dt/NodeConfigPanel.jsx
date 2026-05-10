import React, { useState } from "react";
import NodeTypeIcon from "./NodeTypeIcon";
import PropertiesTab from "./tabs/PropertiesTab";
import AnswersTab from "./tabs/AnswersTab";
import CustomFieldsTab from "./tabs/CustomFieldsTab";
import TagsTab from "./tabs/TagsTab";
import ScriptsTab from "./tabs/ScriptsTab";
import ValidationTab from "./tabs/ValidationTab";
import TypeSpecificTab from "./tabs/TypeSpecificTab";

const ANSWER_TYPES = ["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"];

const TABS = [
  { id: "properties", label: "Properties" },
  { id: "answers", label: "Answers", onlyFor: ANSWER_TYPES },
  { id: "custom_fields", label: "Custom Fields" },
  { id: "tags", label: "Tags" },
  { id: "scripts", label: "Scripts" },
  { id: "validation", label: "Validation" },
  { id: "type_specific", label: "Advanced", hasSpecific: true },
];

const TYPE_SPECIFIC_TYPES = ["slider", "date_picker", "datetime_picker", "address", "start_page", "form", "results_page"];

export default function NodeConfigPanel({ node, quiz, quizId, onUpdate }) {
  const [activeTab, setActiveTab] = useState("properties");

  const visibleTabs = TABS.filter((t) => {
    if (t.onlyFor && !t.onlyFor.includes(node.node_type)) return false;
    if (t.hasSpecific && !TYPE_SPECIFIC_TYPES.includes(node.node_type)) return false;
    return true;
  });

  // Ensure active tab is valid
  const currentTab = visibleTabs.find((t) => t.id === activeTab) ? activeTab : visibleTabs[0]?.id;

  const isPhase2Type = ["decision_node", "transition", "notification_sms", "notification_email",
    "notification_whatsapp", "notification_messenger", "notification_telegram",
    "phone_verification", "webhook_api", "custom_page"].includes(node.node_type);

  if (isPhase2Type) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center gap-3">
        <NodeTypeIcon type={node.node_type} className="w-10 h-10" />
        <p className="font-medium">{node.label || node.node_type}</p>
        <p className="text-sm">Full configuration coming in Phase 2.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
        <NodeTypeIcon type={node.node_type} className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-semibold text-foreground">{node.label || node.node_type}</p>
          <p className="text-xs text-muted-foreground font-mono">{node.node_type} / order {node.order_index}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {currentTab === "properties" && <PropertiesTab node={node} onUpdate={onUpdate} />}
        {currentTab === "answers" && <AnswersTab node={node} quiz={quiz} onUpdate={onUpdate} />}
        {currentTab === "custom_fields" && <CustomFieldsTab node={node} quizId={quizId} onUpdate={onUpdate} />}
        {currentTab === "tags" && <TagsTab node={node} onUpdate={onUpdate} />}
        {currentTab === "scripts" && <ScriptsTab node={node} onUpdate={onUpdate} />}
        {currentTab === "validation" && <ValidationTab node={node} onUpdate={onUpdate} />}
        {currentTab === "type_specific" && <TypeSpecificTab node={node} quizId={quizId} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}