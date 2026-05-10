import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Sparkles } from "lucide-react";

const FIELD_TYPES = ["string", "text", "number", "boolean", "enum", "email", "phone", "date", "datetime", "url", "json", "array_string"];
const CATEGORIES = ["contact", "qualification", "attribution", "compliance", "custom"];

const AI_PROMPT = `Generate a snake_case field_key from a display label using these rules:
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
"Were you the driver" -> was_driver
"Did you have an attorney" -> has_attorney
"How many days since the accident" -> days_since_accident
"Type of incident" -> incident_type

OUTPUT: only the field_key string. No commentary.`;

export default function CustomFieldModal({ field, defaultQuizId, onClose, onSaved }) {
  const isEdit = Boolean(field);
  const [form, setForm] = useState({
    display_label: field?.display_label || "",
    field_key: field?.field_key || "",
    field_type: field?.field_type || "string",
    category: field?.category || "custom",
    allowed_values_text: (field?.allowed_values || []).join(", "),
    default_value: field?.default_value || "",
    description: field?.description || "",
    is_pii: field?.is_pii || false,
    is_required_in_lead: field?.is_required_in_lead || false,
    scope: field?.scope || "global",
    quiz_id: field?.quiz_id || defaultQuizId || "",
  });
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [userEditedKey, setUserEditedKey] = useState(isEdit);
  const debounceRef = useRef(null);

  const { data: quizzes = [] } = useQuery({
    queryKey: ["quizzes-list"],
    queryFn: () => base44.entities.Quiz.list("-updated_date", 50),
    enabled: form.scope === "quiz",
  });

  useEffect(() => {
    if (userEditedKey || !form.display_label) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: AI_PROMPT + "\n\nLabel: " + form.display_label,
        });
        const suggestion = typeof res === "string" ? res.trim() : "";
        if (suggestion) setAiSuggestion(suggestion);
      } catch {}
      setAiLoading(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [form.display_label, userEditedKey]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        display_label: form.display_label,
        field_key: form.field_key || aiSuggestion,
        field_type: form.field_type,
        category: form.category,
        allowed_values: form.field_type === "enum" ? form.allowed_values_text.split(",").map((v) => v.trim()).filter(Boolean) : [],
        default_value: form.default_value,
        description: form.description,
        is_pii: form.is_pii,
        is_required_in_lead: form.is_required_in_lead,
        scope: form.scope,
        quiz_id: form.scope === "quiz" ? form.quiz_id : null,
      };
      if (isEdit) return base44.entities.CustomField.update(field.id, payload);
      return base44.entities.CustomField.create(payload);
    },
    onSuccess: onSaved,
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{isEdit ? "Edit Custom Field" : "New Custom Field"}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display Label <span className="text-destructive">*</span></label>
            <input
              value={form.display_label}
              onChange={(e) => { set("display_label", e.target.value); setUserEditedKey(false); setAiSuggestion(""); }}
              placeholder="e.g. At Fault"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            />
            {aiSuggestion && !userEditedKey && (
              <div className="flex items-center gap-2 mt-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">AI suggestion:</span>
                <button
                  onClick={() => { set("field_key", aiSuggestion); setUserEditedKey(true); setAiSuggestion(""); }}
                  className="text-xs font-mono text-primary hover:underline"
                >
                  {aiSuggestion}
                </button>
                <span className="text-xs text-muted-foreground">(click to use)</span>
              </div>
            )}
            {aiLoading && <p className="text-xs text-muted-foreground mt-1">Generating field key...</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">field_key <span className="text-destructive">*</span></label>
            <input
              value={form.field_key}
              onChange={(e) => { set("field_key", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")); setUserEditedKey(true); }}
              placeholder="e.g. at_fault"
              disabled={isEdit && field?.is_system}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Field Type</label>
              <select value={form.field_type} onChange={(e) => set("field_type", e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {form.field_type === "enum" && (
            <div>
              <label className="block text-sm font-medium mb-1">Allowed Values (comma separated)</label>
              <textarea
                value={form.allowed_values_text}
                onChange={(e) => set("allowed_values_text", e.target.value)}
                placeholder="option_1, option_2, option_3"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Default Value</label>
            <input value={form.default_value} onChange={(e) => set("default_value", e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Optional internal notes"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_pii} onChange={(e) => set("is_pii", e.target.checked)} />
              <span className="text-sm">PII</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_required_in_lead} onChange={(e) => set("is_required_in_lead", e.target.checked)} />
              <span className="text-sm">Required in Lead</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Scope</label>
              <select value={form.scope} onChange={(e) => set("scope", e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                <option value="global">Global</option>
                <option value="quiz">Quiz-scoped</option>
              </select>
            </div>
            {form.scope === "quiz" && (
              <div>
                <label className="block text-sm font-medium mb-1">Decision Tree</label>
                <select value={form.quiz_id} onChange={(e) => set("quiz_id", e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">-- select tree --</option>
                  {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={!form.display_label || (!form.field_key && !aiSuggestion) || saveMut.isPending}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {saveMut.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Field"}
          </button>
        </div>
      </div>
    </div>
  );
}