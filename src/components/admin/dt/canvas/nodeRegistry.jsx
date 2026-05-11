// Node type registry - design types, persistence mapping, accents, icons, categories

export const ACCENT_COLORS = {
  slate:   { hex: "#64748b", bg: "rgba(100,116,139,0.13)",   ring: "rgba(100,116,139,0.5)"  },
  sky:     { hex: "#0ea5e9", bg: "rgba(14,165,233,0.13)",    ring: "rgba(14,165,233,0.5)"   },
  cyan:    { hex: "#06b6d4", bg: "rgba(6,182,212,0.13)",     ring: "rgba(6,182,212,0.5)"    },
  violet:  { hex: "#8b5cf6", bg: "rgba(139,92,246,0.13)",    ring: "rgba(139,92,246,0.5)"   },
  amber:   { hex: "#f59e0b", bg: "rgba(245,158,11,0.13)",    ring: "rgba(245,158,11,0.5)"   },
  emerald: { hex: "#10b981", bg: "rgba(16,185,129,0.13)",    ring: "rgba(16,185,129,0.5)"   },
  indigo:  { hex: "#6366f1", bg: "rgba(99,102,241,0.13)",    ring: "rgba(99,102,241,0.5)"   },
  green:   { hex: "#22c55e", bg: "rgba(34,197,94,0.13)",     ring: "rgba(34,197,94,0.5)"    },
  yellow:  { hex: "#eab308", bg: "rgba(234,179,8,0.13)",     ring: "rgba(234,179,8,0.5)"    },
  rose:    { hex: "#f43f5e", bg: "rgba(244,63,94,0.13)",     ring: "rgba(244,63,94,0.5)"    },
  fuchsia: { hex: "#d946ef", bg: "rgba(217,70,239,0.13)",    ring: "rgba(217,70,239,0.5)"   },
  zinc:    { hex: "#71717a", bg: "rgba(113,113,122,0.13)",   ring: "rgba(113,113,122,0.5)"  },
};

export const RESULT_KINDS = {
  qualified:    { label: "Qualified",     accent: "emerald", icon: "Trophy",   gradBg: "rgba(16,185,129,0.06)"  },
  disqualified: { label: "Disqualified",  accent: "rose",    icon: "Ban",      gradBg: "rgba(244,63,94,0.06)"   },
  nurture:      { label: "Nurture",       accent: "amber",   icon: "AlertTriangle", gradBg: "rgba(245,158,11,0.06)"  },
  redirect:     { label: "Redirect",      accent: "fuchsia", icon: "Link",     gradBg: "rgba(217,70,239,0.06)"  },
  transfer:     { label: "Live Transfer", accent: "indigo",  icon: "Phone",    gradBg: "rgba(99,102,241,0.06)"  },
};

// outputs: array of { id, label }
export const NODE_REGISTRY = {
  start:        { node_type: "start_page",          config_kind: null,      accent: "violet",  icon: "Zap",          label: "Start",          category: "System",    outputs: [{ id: "next", label: "Next" }] },
  single_choice:{ node_type: "single_select",        config_kind: null,      accent: "sky",     icon: "CircleHelp",   label: "Single Choice",  category: "Questions", outputs: "per_option" },
  multi_choice: { node_type: "checkbox_multi_select", config_kind: null,     accent: "sky",     icon: "CheckSquare",  label: "Multi Choice",   category: "Questions", outputs: "per_option_plus_any" },
  text_input:   { node_type: "text_field",            config_kind: "text",   accent: "cyan",    icon: "Type",         label: "Text Input",     category: "Inputs",    outputs: [{ id: "next", label: "Valid" }, { id: "fail", label: "Invalid" }] },
  number_input: { node_type: "slider",                config_kind: null,     accent: "cyan",    icon: "Hash",         label: "Number Input",   category: "Inputs",    outputs: [{ id: "next", label: "Valid" }, { id: "fail", label: "Invalid" }] },
  email_input:  { node_type: "text_field",            config_kind: "email",  accent: "cyan",    icon: "Mail",         label: "Email Input",    category: "Inputs",    outputs: [{ id: "next", label: "Valid" }, { id: "fail", label: "Invalid" }] },
  phone_input:  { node_type: "phone_verification",    config_kind: null,     accent: "cyan",    icon: "Phone",        label: "Phone Input",    category: "Inputs",    outputs: [{ id: "next", label: "Valid" }, { id: "fail", label: "Invalid" }] },
  branch:       { node_type: "decision_node",         config_kind: "branch", accent: "violet",  icon: "GitBranch",    label: "Branch",         category: "Logic",     outputs: "per_branch" },
  filter:       { node_type: "decision_node",         config_kind: "filter", accent: "violet",  icon: "GitBranch",    label: "Filter",         category: "Logic",     outputs: [{ id: "pass", label: "Pass" }, { id: "fail", label: "Fail" }] },
  calc:         { node_type: "custom_page",           config_kind: "calc",   accent: "amber",   icon: "Calculator",   label: "Calculate",      category: "Logic",     outputs: [{ id: "next", label: "Next" }] },
  set_var:      { node_type: "custom_page",           config_kind: "set_var",accent: "emerald", icon: "Variable",     label: "Set Variable",   category: "Actions",   outputs: [{ id: "next", label: "Next" }] },
  send_email:   { node_type: "notification_email",    config_kind: null,     accent: "emerald", icon: "Mail",         label: "Send Email",     category: "Actions",   outputs: [{ id: "next", label: "Next" }] },
  slack:        { node_type: "webhook_api",           config_kind: "slack",  accent: "emerald", icon: "MessageSquare",label: "Slack Message",  category: "Actions",   outputs: [{ id: "next", label: "Next" }] },
  webhook:      { node_type: "webhook_api",           config_kind: null,     accent: "indigo",  icon: "Webhook",      label: "Webhook",        category: "Actions",   outputs: [{ id: "ok", label: "Success" }, { id: "err", label: "Failure" }] },
  tag:          { node_type: "custom_page",           config_kind: "tag",    accent: "emerald", icon: "Tag",          label: "Set Tag",        category: "Actions",   outputs: [{ id: "next", label: "Next" }] },
  submit:       { node_type: "form",                  config_kind: null,     accent: "emerald", icon: "Send",         label: "Submit Form",    category: "Actions",   outputs: [{ id: "ok", label: "Success" }, { id: "err", label: "Failure" }] },
  result:       { node_type: "results_page",          config_kind: null,     accent: "emerald", icon: "Flag",         label: "Result",         category: "Results",   outputs: [] },
  note:         { node_type: "text_block",            config_kind: "note",   accent: "zinc",    icon: "StickyNote",   label: "Note",           category: "Other",     outputs: [] },
};

export const CATEGORY_ORDER = ["Questions", "Inputs", "Logic", "Actions", "Results", "Other"];

/** Translate Question entity -> design type key */
export function designType(node) {
  const nt = node.node_type;
  const kind = node.config?.kind;
  for (const [key, def] of Object.entries(NODE_REGISTRY)) {
    if (def.node_type !== nt) continue;
    if (def.config_kind === null && !kind) return key;
    if (def.config_kind && def.config_kind === kind) return key;
    if (def.config_kind === null && nt === "text_field" && !kind) return key;
    if (nt === "webhook_api" && !kind && key === "webhook") return key;
    if (nt === "custom_page" && !kind && key === "calc") continue; // need explicit kind
    if (nt === "results_page") return "result";
    if (nt === "text_block") return "note";
  }
  // fallback by node_type only
  if (nt === "results_page") return "result";
  if (nt === "text_block") return "note";
  if (nt === "start_page") return "start";
  if (nt === "single_select") return "single_choice";
  if (nt === "checkbox_multi_select") return "multi_choice";
  if (nt === "slider") return "number_input";
  if (nt === "phone_verification") return "phone_input";
  if (nt === "notification_email") return "send_email";
  if (nt === "form") return "submit";
  if (nt === "decision_node") return "branch";
  return "note";
}

/** Get visual identity for a node */
export function getNodeVisual(node) {
  const dt = designType(node);
  const def = NODE_REGISTRY[dt];
  if (dt === "result") {
    const rk = RESULT_KINDS[node.config?.result_kind] || RESULT_KINDS.qualified;
    return { accent: rk.accent, iconName: rk.icon, label: rk.label, gradBg: rk.gradBg };
  }
  return { accent: def?.accent || "zinc", iconName: def?.icon || "Circle", label: def?.label || dt, gradBg: null };
}

/** Get outputs for a node */
export function getNodeOutputs(node) {
  const dt = designType(node);
  const def = NODE_REGISTRY[dt];
  if (!def) return [{ id: "next", label: "Next" }];
  if (def.outputs === "per_option") {
    const opts = node.answer_options || [];
    return opts.map((o, i) => ({ id: `opt_${i}`, label: o.label || `Option ${i + 1}` }));
  }
  if (def.outputs === "per_option_plus_any") {
    const opts = node.answer_options || [];
    return [...opts.map((o, i) => ({ id: `opt_${i}`, label: o.label || `Option ${i + 1}` })), { id: "any", label: "Any" }];
  }
  if (def.outputs === "per_branch") {
    const branches = node.config?.branches || [];
    return branches.map((b, i) => ({ id: `b_${i}`, label: b.name || `Branch ${i + 1}` }));
  }
  if (def.outputs === []) return [];
  return Array.isArray(def.outputs) ? def.outputs : [{ id: "next", label: "Next" }];
}

/** Translate design type back to persistence fields */
export function persistType(dtKey, extraConfig = {}) {
  const def = NODE_REGISTRY[dtKey];
  if (!def) return { node_type: "text_block", config: extraConfig };
  const config = { ...extraConfig };
  if (def.config_kind) config.kind = def.config_kind;
  return { node_type: def.node_type, config };
}