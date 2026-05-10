import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import CustomFieldAssignmentRow from "./CustomFieldAssignmentRow";

export default function NodeInspector({ node, quiz, onChange, onQuizChange, brands }) {
  // When no node selected, show tree-level tabs
  if (!node) {
    return <TreeInspector quiz={quiz} onQuizChange={onQuizChange} brands={brands} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <div className="font-semibold text-sm text-foreground truncate">{node.label || "Node Inspector"}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{node.node_type}</div>
      </div>
      <Tabs defaultValue="properties" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 flex-wrap h-auto gap-1">
          <TabsTrigger value="properties" className="text-xs">Props</TabsTrigger>
          <TabsTrigger value="custom-fields" className="text-xs">Fields</TabsTrigger>
          <TabsTrigger value="tags" className="text-xs">Tags</TabsTrigger>
          <TabsTrigger value="scripts" className="text-xs">Scripts</TabsTrigger>
          <TabsTrigger value="validation" className="text-xs">Rules</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="properties" className="p-4 space-y-4 mt-0">
            <div>
              <Label className="text-xs">Node ID</Label>
              <div className="font-mono text-xs text-muted-foreground mt-1 bg-muted rounded px-2 py-1 break-all">{node.node_id || node.id}</div>
            </div>
            <div>
              <Label className="text-xs">Order Index</Label>
              <Input type="number" value={node.order_index ?? 0} onChange={(e) => onChange({ order_index: Number(e.target.value) })} className="mt-1 h-8 text-sm" />
            </div>
          </TabsContent>

          <TabsContent value="custom-fields" className="p-4 space-y-3 mt-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Field Assignments</div>
            {(node.custom_field_assignments || []).map((assignment, i) => (
              <CustomFieldAssignmentRow
                key={i}
                assignment={assignment}
                onChange={(updated) => {
                  const arr = [...(node.custom_field_assignments || [])];
                  arr[i] = updated;
                  onChange({ custom_field_assignments: arr });
                }}
                onRemove={() => {
                  const arr = (node.custom_field_assignments || []).filter((_, idx) => idx !== i);
                  onChange({ custom_field_assignments: arr });
                }}
              />
            ))}
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => {
              onChange({ custom_field_assignments: [...(node.custom_field_assignments || []), { custom_field_id: "", value_source: "answer_value", value: "", transform: "none" }] });
            }}>
              <Plus className="w-3 h-3" /> Add Field Assignment
            </Button>
          </TabsContent>

          <TabsContent value="tags" className="p-4 space-y-4 mt-0">
            <ChipInput label="Tags to Add on Enter" value={node.tags_to_add || []} onChange={(v) => onChange({ tags_to_add: v })} />
            <ChipInput label="Tags to Remove on Enter" value={node.tags_to_remove || []} onChange={(v) => onChange({ tags_to_remove: v })} />
          </TabsContent>

          <TabsContent value="scripts" className="p-4 space-y-3 mt-0">
            {(node.scripts || []).map((script, i) => (
              <ScriptRow key={i} script={script} onChange={(updated) => {
                const arr = [...(node.scripts || [])];
                arr[i] = updated;
                onChange({ scripts: arr });
              }} onRemove={() => {
                onChange({ scripts: (node.scripts || []).filter((_, idx) => idx !== i) });
              }} />
            ))}
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => {
              onChange({ scripts: [...(node.scripts || []), { name: "New Script", trigger: "on_enter", language: "javascript", code: "", is_enabled: true }] });
            }}>
              <Plus className="w-3 h-3" /> Add Script
            </Button>
          </TabsContent>

          <TabsContent value="validation" className="p-4 space-y-3 mt-0">
            {(node.validation_rules || []).map((rule, i) => (
              <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium">{rule.rule_type}</div>
                  <button onClick={() => onChange({ validation_rules: (node.validation_rules || []).filter((_, idx) => idx !== i) })}>
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                <Input value={rule.error_message || ""} onChange={(e) => {
                  const arr = [...(node.validation_rules || [])];
                  arr[i] = { ...arr[i], error_message: e.target.value };
                  onChange({ validation_rules: arr });
                }} placeholder="Error message" className="h-7 text-xs" />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => {
              onChange({ validation_rules: [...(node.validation_rules || []), { rule_type: "regex", params: {}, error_message: "" }] });
            }}>
              <Plus className="w-3 h-3" /> Add Validation Rule
            </Button>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function TreeInspector({ quiz, onQuizChange, brands }) {
  if (!quiz) return null;
  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tree Settings</div>
      <div>
        <Label className="text-xs">Brand</Label>
        <Select value={quiz.brand_id || ""} onValueChange={(v) => onQuizChange({ brand_id: v })}>
          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Default (site)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Default (site)</SelectItem>
            {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.brand_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Campaign Type</Label>
        <Select value={quiz.campaign_type || "mva"} onValueChange={(v) => onQuizChange({ campaign_type: v })}>
          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["mva", "mass_tort", "workers_comp", "slip_and_fall", "med_mal", "custom"].map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="prog" checked={!!quiz.settings?.progress_bar} onCheckedChange={(v) => onQuizChange({ settings: { ...(quiz.settings || {}), progress_bar: v } })} />
        <Label htmlFor="prog" className="text-xs">Show Progress Bar</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="back" checked={!!quiz.settings?.show_back_button} onCheckedChange={(v) => onQuizChange({ settings: { ...(quiz.settings || {}), show_back_button: v } })} />
        <Label htmlFor="back" className="text-xs">Show Back Button</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="score" checked={!!quiz.settings?.score_enabled} onCheckedChange={(v) => onQuizChange({ settings: { ...(quiz.settings || {}), score_enabled: v } })} />
        <Label htmlFor="score" className="text-xs">Score Enabled</Label>
      </div>
    </div>
  );
}

function ChipInput({ label, value, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    if (!input.trim()) return;
    onChange([...value, input.trim()]);
    setInput("");
  };
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1 mt-1 mb-1">
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
            {tag}
            <button onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="opacity-50 hover:opacity-100">x</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="h-7 text-xs" placeholder="Add tag..." />
        <Button size="sm" variant="outline" onClick={add} className="h-7 text-xs">Add</Button>
      </div>
    </div>
  );
}

function ScriptRow({ script, onChange, onRemove }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input value={script.name || ""} onChange={(e) => onChange({ ...script, name: e.target.value })} placeholder="Script name" className="h-7 text-xs flex-1" />
        <button onClick={onRemove}><Trash2 className="w-3 h-3 text-muted-foreground" /></button>
      </div>
      <div className="flex items-center gap-2">
        <select value={script.trigger} onChange={(e) => onChange({ ...script, trigger: e.target.value })} className="text-xs border rounded px-2 py-1 bg-background">
          <option value="on_enter">On Enter</option>
          <option value="on_exit">On Exit</option>
        </select>
        <Switch checked={!!script.is_enabled} onCheckedChange={(v) => onChange({ ...script, is_enabled: v })} />
        <span className="text-xs text-muted-foreground">{script.is_enabled ? "Enabled" : "Disabled"}</span>
      </div>
      <Textarea value={script.code || ""} onChange={(e) => onChange({ ...script, code: e.target.value })} rows={4} className="text-xs font-mono" placeholder="// JavaScript code" />
    </div>
  );
}