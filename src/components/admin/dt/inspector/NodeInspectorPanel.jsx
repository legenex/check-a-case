import React, { useState } from "react";
import { X } from "lucide-react";
import NodeTypeIcon from "../NodeTypeIcon";
import PropertiesTab from "../tabs/PropertiesTab";
import AnswersTab from "../tabs/AnswersTab";
import CustomFieldsTab from "../tabs/CustomFieldsTab";
import TagsTab from "../tabs/TagsTab";
import ScriptsTab from "../tabs/ScriptsTab";
import ValidationTab from "../tabs/ValidationTab";
import TypeSpecificTab from "../tabs/TypeSpecificTab";
import AdvancedNodeTab from "../tabs/AdvancedNodeTab";
import BranchingTab from "./BranchingTab";
import WebhookTab from "./WebhookTab";
import NotificationTab from "./NotificationTab";
import PhoneVerifyTab from "./PhoneVerifyTab";

const ANSWER_TYPES = ["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"];
const TYPE_SPECIFIC = ["slider", "date_picker", "datetime_picker", "address", "start_page", "form", "results_page"];

function buildTabs(node) {
  const tabs = [{ id: "properties", label: "Properties" }];
  if (ANSWER_TYPES.includes(node.node_type)) tabs.push({ id: "answers", label: "Answers" });
  tabs.push({ id: "custom_fields", label: "Fields" });
  tabs.push({ id: "tags", label: "Tags" });
  tabs.push({ id: "scripts", label: "Scripts" });
  tabs.push({ id: "validation", label: "Validation" });
  if (node.node_type === "decision_node") tabs.push({ id: "branching", label: "Branching" });
  if (node.node_type === "webhook_api") tabs.push({ id: "webhook", label: "Webhook" });
  if (node.node_type.startsWith("notification_")) tabs.push({ id: "notification", label: "Notification" });
  if (node.node_type === "phone_verification") tabs.push({ id: "phone_verify", label: "Verify" });
  if (TYPE_SPECIFIC.includes(node.node_type)) tabs.push({ id: "type_specific", label: "Config" });
  tabs.push({ id: "advanced", label: "Advanced" });
  return tabs;
}

export default function NodeInspectorPanel({ node, quiz, quizId, allNodes, allEdges, onUpdate, onClose, isDirty, onSave, onDiscard }) {
  const [activeTab, setActiveTab] = useState("properties");
  const tabs = buildTabs(node);
  const currentTab = tabs.find((t) => t.id === activeTab) ? activeTab : tabs[0]?.id;

  return (
    <div className="w-[360px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <NodeTypeIcon type={node.node_type} className="w-4 h-4 text-slate-500" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">{node.label || node.node_type}</p>
          <p className="text-[10px] text-slate-400 font-mono">{node.node_type}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 transition-colors">
            <X size={14} className="text-slate-500" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
              ${currentTab === t.id ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Dirty save bar */}
      {isDirty && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-700 flex-1">Unsaved changes</span>
          <button onClick={onDiscard} className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors">Discard</button>
          <button onClick={onSave} className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded transition-colors">Save</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentTab === "properties" && <PropertiesTab node={node} onUpdate={onUpdate} />}
        {currentTab === "answers" && <AnswersTab node={node} quiz={quiz} allNodes={allNodes} allEdges={allEdges || []} onUpdate={onUpdate} />}
        {currentTab === "custom_fields" && <CustomFieldsTab node={node} quizId={quizId} onUpdate={onUpdate} />}
        {currentTab === "tags" && <TagsTab node={node} onUpdate={onUpdate} />}
        {currentTab === "scripts" && <ScriptsTab node={node} onUpdate={onUpdate} />}
        {currentTab === "validation" && <ValidationTab node={node} onUpdate={onUpdate} />}
        {currentTab === "branching" && <BranchingTab node={node} allNodes={allNodes} onUpdate={onUpdate} />}
        {currentTab === "webhook" && <WebhookTab node={node} onUpdate={onUpdate} />}
        {currentTab === "notification" && <NotificationTab node={node} onUpdate={onUpdate} />}
        {currentTab === "phone_verify" && <PhoneVerifyTab node={node} allNodes={allNodes} onUpdate={onUpdate} />}
        {currentTab === "type_specific" && <TypeSpecificTab node={node} quizId={quizId} onUpdate={onUpdate} />}
        {currentTab === "advanced" && <AdvancedNodeTab node={node} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}