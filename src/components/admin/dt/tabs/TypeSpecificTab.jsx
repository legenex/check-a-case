import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2 } from "lucide-react";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const DATE_BUCKETS = ["within_7_days","within_14_days","within_30_days","within_3_months","within_6_months","within_12_months","within_18_months","within_24_months","more_than_2_years"];
const ATTRIBUTION_PARAMS = ["sid","fbclid","gclid","ttclid","utm_source","utm_medium","utm_campaign","utm_content","utm_term","referrer","landing_url","brand"];

export default function TypeSpecificTab({ node, quizId, onUpdate }) {
  const config = node.config || {};
  const qc = useQueryClient();

  const { data: fields = [] } = useQuery({
    queryKey: ["custom-fields"],
    queryFn: () => base44.entities.CustomField.list("-created_date", 200),
  });

  const { data: contactForms = [] } = useQuery({
    queryKey: ["contact-forms"],
    queryFn: () => base44.entities.ContactForm.list(),
  });

  const createFieldMut = useMutation({
    mutationFn: (data) => base44.entities.CustomField.create(data),
    onSuccess: () => qc.invalidateQueries(["custom-fields"]),
  });

  const updateConfig = (patch) => onUpdate({ config: { ...config, ...patch } });

  // ── Slider ──────────────────────────────────────────────────────────────────
  if (node.node_type === "slider") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {["min", "max", "step"].map((f) => (
            <div key={f}>
              <label className="text-xs text-muted-foreground capitalize">{f}</label>
              <input type="number" value={config[f] ?? (f === "min" ? 0 : f === "max" ? 100 : 1)}
                onChange={(e) => updateConfig({ [f]: Number(e.target.value) })}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["prefix", "suffix", "format"].map((f) => (
            <div key={f}>
              <label className="text-xs text-muted-foreground capitalize">{f}</label>
              <input value={config[f] || ""} onChange={(e) => updateConfig({ [f]: e.target.value })}
                placeholder={f === "prefix" ? "$" : f === "suffix" ? " days" : "number"}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Date Picker ──────────────────────────────────────────────────────────────
  if (node.node_type === "date_picker" || node.node_type === "datetime_picker") {
    const bucketing = config.bucket_into_ranges || false;
    const handleBucketToggle = async (val) => {
      updateConfig({ bucket_into_ranges: val });
      if (val && node.label) {
        const bucketKey = (node.label || "date").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") + "_bucket";
        const existing = fields.find((f) => f.field_key === bucketKey);
        if (!existing) {
          const newField = await createFieldMut.mutateAsync({
            field_key: bucketKey,
            display_label: (node.label || "Date") + " Bucket",
            field_type: "enum",
            category: "qualification",
            allowed_values: DATE_BUCKETS,
            scope: "global",
            description: "Auto-created date bucket for " + (node.label || "date"),
          });
          updateConfig({ bucket_field_id: bucketKey });
        } else {
          updateConfig({ bucket_field_id: bucketKey });
        }
      }
    };
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Min Date</label>
            <input type="date" value={config.min_date || ""} onChange={(e) => updateConfig({ min_date: e.target.value })}
              className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Max Date</label>
            <input type="date" value={config.max_date || ""} onChange={(e) => updateConfig({ max_date: e.target.value })}
              className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={bucketing} onChange={(e) => handleBucketToggle(e.target.checked)} />
          <span className="text-sm font-medium">Bucket into date ranges</span>
        </label>
        {bucketing && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Bucket field: <span className="font-mono">{config.bucket_field_id || "auto-creating..."}</span></p>
            <div className="space-y-1">
              {DATE_BUCKETS.map((b) => (
                <div key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="font-mono">{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Address ──────────────────────────────────────────────────────────────────
  if (node.node_type === "address") {
    const subFields = ["street", "city", "state", "zip", "country"];
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Enabled sub-fields</p>
        {subFields.map((f) => (
          <label key={f} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config[`show_${f}`] ?? true}
              onChange={(e) => updateConfig({ [`show_${f}`]: e.target.checked })} />
            <span className="text-sm capitalize">{f}</span>
          </label>
        ))}
        <div>
          <label className="text-xs text-muted-foreground">Default Country</label>
          <input value={config.country_default || "US"} onChange={(e) => updateConfig({ country_default: e.target.value })}
            className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5" />
        </div>
      </div>
    );
  }

  // ── Start Page ───────────────────────────────────────────────────────────────
  if (node.node_type === "start_page") {
    const handlers = config.url_param_handlers || [];
    const addHandler = () => onUpdate({ config: { ...config, url_param_handlers: [...handlers, { param_name: "", custom_field_id: "" }] } });
    const updateHandler = (idx, patch) => {
      onUpdate({ config: { ...config, url_param_handlers: handlers.map((h, i) => (i === idx ? { ...h, ...patch } : h)) } });
    };
    const deleteHandler = (idx) => {
      onUpdate({ config: { ...config, url_param_handlers: handlers.filter((_, i) => i !== idx) } });
    };
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold mb-3">URL Parameter Handlers</p>
          <div className="space-y-2">
            {handlers.map((h, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input value={h.param_name} onChange={(e) => updateHandler(idx, { param_name: e.target.value })}
                  placeholder="param name (e.g. utm_source)"
                  className="flex-1 h-8 px-2 rounded border border-input bg-background text-sm font-mono" />
                <span className="text-muted-foreground text-sm">{"→"}</span>
                <select value={h.custom_field_id} onChange={(e) => updateHandler(idx, { custom_field_id: e.target.value })}
                  className="flex-1 h-8 px-2 rounded border border-input bg-background text-sm">
                  <option value="">-- field --</option>
                  {fields.map((f) => <option key={f.id} value={f.field_key}>{f.field_key}</option>)}
                </select>
                <button onClick={() => deleteHandler(idx)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addHandler}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Plus className="w-4 h-4" /> Add Parameter Handler
          </button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={config.read_url_brand ?? false}
            onChange={(e) => updateConfig({ read_url_brand: e.target.checked })} />
          <span className="text-sm">Read URL and apply brand CSS</span>
        </label>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  if (node.node_type === "form") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Contact Form Template</label>
          <select value={node.contact_form_id || ""}
            onChange={(e) => onUpdate({ contact_form_id: e.target.value })}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">-- select template --</option>
            {contactForms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Submit Label Override</label>
          <input value={config.submit_label || ""} onChange={(e) => updateConfig({ submit_label: e.target.value })}
            placeholder="e.g. Get My Free Case Review"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Redirect After Submit</label>
          <input value={config.redirect_after || ""} onChange={(e) => updateConfig({ redirect_after: e.target.value })}
            placeholder="/Submitted"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono" />
        </div>
      </div>
    );
  }

  // ── Results Page ────────────────────────────────────────────────────────────
  if (node.node_type === "results_page") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Qualification Tier</label>
          <select value={config.qualification_tier || ""}
            onChange={(e) => updateConfig({ qualification_tier: e.target.value || null })}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">None (soft DQ)</option>
            <option value="T1">T1 - Fully Qualified</option>
            <option value="T2">T2 - Conditionally Qualified</option>
            <option value="T3">T3 - Low Intent</option>
            <option value="DQ">DQ - Disqualified</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Redirect URL</label>
          <input value={config.redirect_url || ""} onChange={(e) => updateConfig({ redirect_url: e.target.value })}
            placeholder="/Submitted"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Result Message Template</label>
          <p className="text-xs text-muted-foreground mb-1">Use {"{field_key}"} for dynamic substitution.</p>
          <textarea value={config.result_template || ""} onChange={(e) => updateConfig({ result_template: e.target.value })}
            placeholder="Thank you, {first_name}! Your case has been reviewed."
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none" />
        </div>
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">No advanced configuration for this node type.</p>;
}