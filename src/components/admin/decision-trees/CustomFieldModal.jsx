import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Wand2 } from "lucide-react";

const FIELD_TYPES = ["string", "text", "number", "boolean", "enum", "email", "phone", "date", "datetime", "url", "json", "array_string"];
const CATEGORIES = ["contact", "qualification", "attribution", "compliance", "custom"];

const TCPA_PROMPT = `Generate a snake_case field_key from a display label using these rules:
- Lowercase letters, numbers, and underscores only.
- Use the shortest correct name that preserves meaning.
- Prefer noun_descriptor over verb forms.
- For booleans, prefer was_, has_, is_, can_ prefixes.
- Drop articles and filler words (the, a, an, your, did you, when, how, what).
- Drop trailing punctuation.
- Keep keys at most 24 characters when reasonable.

Examples:
"At Fault" -> at_fault
"First Name" -> first_name
"Last Name" -> last_name
"Were you the driver" -> was_driver
"Did you have an attorney" -> has_attorney
"How many days since the accident" -> days_since_accident
"Type of incident" -> incident_type
"Were you injured" -> was_injured
"When did the accident happen" -> incident_date
"Email Address" -> email
"Zip Code" -> zip_code
"What state was the accident in" -> accident_state
"Who was at fault" -> at_fault
"Did you receive medical treatment" -> received_treatment

OUTPUT: only the field_key string. No commentary.`;

export default function CustomFieldModal({ open, onClose, field, onSaved, quizId }) {
  const [form, setForm] = useState({ display_label: "", field_key: "", field_type: "string", category: "custom", allowed_values: [], default_value: "", description: "", is_pii: false, is_required_in_lead: false, scope: "global", quiz_id: quizId || "" });
  const [allowedInput, setAllowedInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [userTypedKey, setUserTypedKey] = useState(false);
  const aiTimer = useRef(null);

  useEffect(() => {
    if (field) {
      setForm({ ...field });
      setAllowedInput((field.allowed_values || []).join(", "));
      setUserTypedKey(true);
    } else {
      setForm({ display_label: "", field_key: "", field_type: "string", category: "custom", allowed_values: [], default_value: "", description: "", is_pii: false, is_required_in_lead: false, scope: quizId ? "quiz" : "global", quiz_id: quizId || "" });
      setAllowedInput("");
      setUserTypedKey(false);
      setAiSuggestion("");
    }
  }, [field, open, quizId]);

  const handleLabelChange = (val) => {
    setForm((f) => ({ ...f, display_label: val }));
    if (!userTypedKey) {
      clearTimeout(aiTimer.current);
      aiTimer.current = setTimeout(async () => {
        if (!val.trim()) return;
        setAiLoading(true);
        try {
          const result = await base44.integrations.Core.InvokeLLM({ prompt: `${TCPA_PROMPT}\n\n"${val}" ->` });
          setAiSuggestion(result?.trim() || "");
        } catch { /* ignore */ }
        setAiLoading(false);
      }, 400);
    }
  };

  const acceptSuggestion = () => {
    setForm((f) => ({ ...f, field_key: aiSuggestion }));
    setAiSuggestion("");
    setUserTypedKey(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, allowed_values: form.field_type === "enum" ? allowedInput.split(",").map((v) => v.trim()).filter(Boolean) : [] };
    if (field?.id) {
      await base44.entities.CustomField.update(field.id, data);
    } else {
      await base44.entities.CustomField.create(data);
    }
    setSaving(false);
    onSaved();
  };

  const isSystemEdit = field?.is_system;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{field ? "Edit Custom Field" : "New Custom Field"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Display Label *</Label>
            <Input className="mt-1" value={form.display_label} onChange={(e) => handleLabelChange(e.target.value)} placeholder="e.g., Accident State" />
            {(aiSuggestion || aiLoading) && !userTypedKey && (
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Wand2 className="w-3 h-3" />
                {aiLoading ? "Generating key..." : (
                  <>
                    Suggested: <span className="font-mono text-foreground">{aiSuggestion}</span>
                    <button onClick={acceptSuggestion} className="text-primary underline ml-1">Accept</button>
                  </>
                )}
              </div>
            )}
          </div>
          <div>
            <Label>Field Key *</Label>
            <Input className="mt-1 font-mono text-sm" value={form.field_key} onChange={(e) => { setForm((f) => ({ ...f, field_key: e.target.value })); setUserTypedKey(true); setAiSuggestion(""); }} placeholder="snake_case_key" disabled={isSystemEdit} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Field Type</Label>
              <Select value={form.field_type} onValueChange={(v) => setForm((f) => ({ ...f, field_type: v }))} disabled={isSystemEdit}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.field_type === "enum" && (
            <div>
              <Label>Allowed Values (comma-separated)</Label>
              <Input className="mt-1" value={allowedInput} onChange={(e) => setAllowedInput(e.target.value)} placeholder="value1, value2, value3" />
            </div>
          )}
          <div>
            <Label>Default Value</Label>
            <Input className="mt-1" value={form.default_value || ""} onChange={(e) => setForm((f) => ({ ...f, default_value: e.target.value }))} />
          </div>
          <div>
            <Label>Description</Label>
            <Input className="mt-1" value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <Label>Scope</Label>
            <Select value={form.scope} onValueChange={(v) => setForm((f) => ({ ...f, scope: v }))} disabled={isSystemEdit}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="quiz">Quiz-scoped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch id="pii" checked={!!form.is_pii} onCheckedChange={(v) => setForm((f) => ({ ...f, is_pii: v }))} />
              <Label htmlFor="pii">PII</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="req" checked={!!form.is_required_in_lead} onCheckedChange={(v) => setForm((f) => ({ ...f, is_required_in_lead: v }))} />
              <Label htmlFor="req">Required in Lead</Label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !form.display_label || !form.field_key}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {field ? "Save Changes" : "Create Field"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}