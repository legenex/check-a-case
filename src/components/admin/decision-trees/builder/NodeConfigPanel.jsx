import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { NODE_TYPE_META } from "./nodeTypeMeta";
import AnswerOptionsEditor from "./AnswerOptionsEditor";
import SliderConfig from "./configs/SliderConfig";
import DatePickerConfig from "./configs/DatePickerConfig";
import AddressConfig from "./configs/AddressConfig";
import StartPageConfig from "./configs/StartPageConfig";
import FormNodeConfig from "./configs/FormNodeConfig";
import ResultsPageConfig from "./configs/ResultsPageConfig";

const PHASE2_TYPES = ["decision_node", "transition", "notification_sms", "notification_email", "notification_whatsapp", "notification_messenger", "notification_telegram", "phone_verification", "webhook_api", "custom_page"];

export default function NodeConfigPanel({ node, quiz, onChange }) {
  const meta = NODE_TYPE_META[node.node_type] || {};
  const isSelectType = ["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"].includes(node.node_type);

  if (PHASE2_TYPES.includes(node.node_type)) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <div className="text-4xl mb-3">{meta.icon}</div>
        <p className="font-medium text-foreground">{meta.label}</p>
        <p className="text-sm mt-2">Full configuration for this node type is coming in Phase 2.</p>
        <p className="text-xs mt-1 text-muted-foreground/60">You can still set the label and basic properties in the right panel.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <span>{meta.icon}</span>
        <span>{meta.label || node.node_type}</span>
        <span>/</span>
        <span className="font-medium text-foreground">{node.label || "Unnamed Node"}</span>
      </div>

      {/* Core fields */}
      <div className="space-y-4">
        <div>
          <Label>Internal Label (admin only)</Label>
          <Input className="mt-1" value={node.label || ""} onChange={(e) => onChange({ label: e.target.value })} placeholder="e.g., Accident Type Select" />
        </div>
        <div>
          <Label>Question / Title (shown to user)</Label>
          <Textarea className="mt-1" rows={3} value={node.title_display || ""} onChange={(e) => onChange({ title_display: e.target.value })} placeholder="What type of accident were you involved in?" />
        </div>
        <div>
          <Label>Help Text (optional)</Label>
          <Input className="mt-1" value={node.help_text || ""} onChange={(e) => onChange({ help_text: e.target.value })} placeholder="Optional sub-text beneath the question" />
        </div>
        {["text_field", "address"].includes(node.node_type) && (
          <div>
            <Label>Placeholder</Label>
            <Input className="mt-1" value={node.placeholder || ""} onChange={(e) => onChange({ placeholder: e.target.value })} />
          </div>
        )}
        <div className="flex items-center gap-3">
          <Switch id="req-toggle" checked={!!node.required} onCheckedChange={(v) => onChange({ required: v })} />
          <Label htmlFor="req-toggle">Required</Label>
        </div>
        <div>
          <Label>Image URL (optional)</Label>
          <Input className="mt-1" value={node.media_image_url || ""} onChange={(e) => onChange({ media_image_url: e.target.value })} placeholder="https://..." />
        </div>
      </div>

      {/* Answer options for select types */}
      {isSelectType && (
        <div>
          <div className="text-sm font-semibold mb-3">Answer Options</div>
          <AnswerOptionsEditor
            options={node.answer_options || []}
            scoreEnabled={quiz?.settings?.score_enabled}
            onChange={(opts) => onChange({ answer_options: opts })}
          />
        </div>
      )}

      {/* Type-specific config */}
      {node.node_type === "slider" && (
        <SliderConfig config={node.config || {}} onChange={(c) => onChange({ config: { ...(node.config || {}), ...c } })} />
      )}
      {node.node_type === "date_picker" && (
        <DatePickerConfig config={node.config || {}} nodeId={node.node_id} onChange={(c) => onChange({ config: { ...(node.config || {}), ...c } })} />
      )}
      {node.node_type === "address" && (
        <AddressConfig config={node.config || {}} onChange={(c) => onChange({ config: { ...(node.config || {}), ...c } })} />
      )}
      {node.node_type === "start_page" && (
        <StartPageConfig config={node.config || {}} onChange={(c) => onChange({ config: { ...(node.config || {}), ...c } })} />
      )}
      {node.node_type === "form" && (
        <FormNodeConfig node={node} onChange={onChange} />
      )}
      {node.node_type === "results_page" && (
        <ResultsPageConfig config={node.config || {}} onChange={(c) => onChange({ config: { ...(node.config || {}), ...c } })} />
      )}
      {["text_block", "information", "custom_page"].includes(node.node_type) && (
        <div>
          <Label>Content (HTML / Markdown)</Label>
          <Textarea className="mt-1 font-mono text-sm" rows={8} value={node.form_html || ""} onChange={(e) => onChange({ form_html: e.target.value })} placeholder="<p>Your content here...</p>" />
        </div>
      )}
    </div>
  );
}