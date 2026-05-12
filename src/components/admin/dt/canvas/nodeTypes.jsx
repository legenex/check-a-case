// nodeTypes.js — design source translated to Check A Case node_type mapping

export const RESULT_KINDS = {
  qualified:    { label: "Qualified",     accent: "emerald", icon: "Trophy" },
  disqualified: { label: "Disqualified",  accent: "rose",    icon: "Ban" },
  nurture:      { label: "Nurture",       accent: "amber",   icon: "AlertTriangle" },
  redirect:     { label: "Redirect",      accent: "fuchsia", icon: "ExternalLink" },
  transfer:     { label: "Live Transfer", accent: "indigo",  icon: "Phone" },
};

// Design type -> node_type/config.kind mapping
// "type" here is the short design key (start, single_choice, etc.)
export const NODE_TYPES = {
  single_choice: {
    label: "Single Choice", category: "Questions", accent: "sky", icon: "HelpCircle",
    description: "Pick one answer. One output per option.",
    node_type: "single_select", config_kind: null,
    outputs: (n) => (n.answer_options || []).map((o, i) => ({ id: `opt_${i}`, label: o.label || `Option ${i+1}` })),
    defaults: () => ({ title: "Untitled question" }),
  },
  multi_choice: {
    label: "Multi Choice", category: "Questions", accent: "sky", icon: "CheckSquare",
    description: "Pick several. Route via rules.",
    node_type: "checkbox_multi_select", config_kind: null,
    outputs: (n) => [
      ...((n.config?.rules || []).map((r, i) => ({ id: `rule_${i}`, label: r.name || `Rule ${i+1}` }))),
      { id: "any", label: "Otherwise" },
    ],
    defaults: () => ({ title: "Untitled multi" }),
  },
  text_input: {
    label: "Text", category: "Inputs", accent: "cyan", icon: "Type",
    description: "Free-text field.",
    node_type: "text_field", config_kind: "text",
    outputs: () => [{ id: "next", label: "Valid" }, { id: "fail", label: "Invalid" }],
    defaults: () => ({ title: "Text input" }),
  },
  number_input: {
    label: "Number", category: "Inputs", accent: "cyan", icon: "Hash",
    description: "Numeric field with bounds.",
    node_type: "slider", config_kind: null,
    outputs: () => [{ id: "next", label: "Valid" }, { id: "fail", label: "Invalid" }],
    defaults: () => ({ title: "Number" }),
  },
  email_input: {
    label: "Email", category: "Inputs", accent: "cyan", icon: "Mail",
    description: "Validated email.",
    node_type: "text_field", config_kind: "email",
    outputs: () => [{ id: "next", label: "Valid" }, { id: "fail", label: "Invalid" }],
    defaults: () => ({ title: "Email" }),
  },
  phone_input: {
    label: "Phone", category: "Inputs", accent: "cyan", icon: "Phone",
    description: "Phone with HLR option.",
    node_type: "phone_verification", config_kind: null,
    outputs: () => [{ id: "next", label: "Valid" }, { id: "fail", label: "Invalid" }],
    defaults: () => ({ title: "Phone" }),
  },
  branch: {
    label: "If / Else", category: "Logic", accent: "violet", icon: "GitBranch",
    description: "Route based on variable values.",
    node_type: "decision_node", config_kind: "branch",
    outputs: (n) => (n.config?.branches || [{ name: "True" }, { name: "False" }]).map((b, i) => ({ id: `b_${i}`, label: b.name })),
    defaults: () => ({ title: "Branch" }),
  },
  filter: {
    label: "Filter", category: "Logic", accent: "violet", icon: "GitBranch",
    description: "Pass only if condition met.",
    node_type: "decision_node", config_kind: "filter",
    outputs: () => [{ id: "pass", label: "Pass" }, { id: "fail", label: "Fail" }],
    defaults: () => ({ title: "Filter" }),
  },
  calc: {
    label: "Calculate", category: "Logic", accent: "amber", icon: "Calculator",
    description: "Compute a variable.",
    node_type: "custom_page", config_kind: "calc",
    outputs: () => [{ id: "next", label: "" }],
    defaults: () => ({ title: "Score" }),
  },
  set_var: {
    label: "Set Variable", category: "Actions", accent: "emerald", icon: "Variable",
    description: "Assign a variable.",
    node_type: "custom_page", config_kind: "set_var",
    outputs: () => [{ id: "next", label: "" }],
    defaults: () => ({ title: "Set var" }),
  },
  send_email: {
    label: "Send Email", category: "Actions", accent: "emerald", icon: "Mail",
    description: "Transactional email.",
    node_type: "notification_email", config_kind: null,
    outputs: () => [{ id: "next", label: "" }],
    defaults: () => ({ title: "Send email" }),
  },
  slack: {
    label: "Slack Notify", category: "Actions", accent: "emerald", icon: "MessageSquare",
    description: "Post to Slack channel.",
    node_type: "webhook_api", config_kind: "slack",
    outputs: () => [{ id: "next", label: "" }],
    defaults: () => ({ title: "Slack" }),
  },
  webhook: {
    label: "Webhook", category: "Actions", accent: "indigo", icon: "Webhook",
    description: "POST to external URL.",
    node_type: "webhook_api", config_kind: null,
    outputs: () => [{ id: "ok", label: "Success" }, { id: "err", label: "Failure" }],
    defaults: () => ({ title: "Webhook" }),
  },
  tag: {
    label: "Tag", category: "Actions", accent: "emerald", icon: "Tag",
    description: "Add tag / increment score.",
    node_type: "custom_page", config_kind: "tag",
    outputs: () => [{ id: "next", label: "" }],
    defaults: () => ({ title: "Tag" }),
  },
  submit: {
    label: "Submit Lead", category: "Actions", accent: "emerald", icon: "FileCheck2",
    description: "POST to Lead entity.",
    node_type: "form", config_kind: null,
    outputs: () => [{ id: "ok", label: "Success" }, { id: "err", label: "Failure" }],
    defaults: () => ({ title: "Submit lead" }),
  },
  result: {
    label: "Result", category: "Results", accent: "emerald", icon: "Flag",
    description: "Terminal outcome. Configure kind from the panel.",
    node_type: "results_page", config_kind: null,
    outputs: () => [],
    defaults: () => ({ title: "New result" }),
  },
  note: {
    label: "Note", category: "Other", accent: "zinc", icon: "StickyNote",
    description: "Documentation. Not in runtime.",
    node_type: "text_block", config_kind: "note",
    outputs: () => [],
    defaults: () => ({ title: "Note" }),
  },
};

export const ACCENT_HEX = {
  slate: "#64748b", sky: "#0ea5e9", cyan: "#06b6d4", violet: "#8b5cf6",
  amber: "#f59e0b", emerald: "#10b981", indigo: "#6366f1",
  green: "#22c55e", yellow: "#eab308", rose: "#f43f5e",
  fuchsia: "#d946ef", zinc: "#71717a",
};

export const CATEGORIES = ["Questions", "Inputs", "Logic", "Actions", "Results", "Other"];

// Translate Question entity -> design type key
export function designType(question) {
  const nt = question.node_type;
  const kind = question.config?.kind;

  if (nt === "start_page") return "single_choice"; // treat legacy start_page as single_choice
  if (nt === "single_select") return "single_choice";
  if (nt === "checkbox_multi_select") return "multi_choice";
  if (nt === "text_field") return kind === "email" ? "email_input" : "text_input";
  if (nt === "slider") return "number_input";
  if (nt === "phone_verification") return "phone_input";
  if (nt === "decision_node") return kind === "filter" ? "filter" : "branch";
  if (nt === "custom_page") {
    if (kind === "calc") return "calc";
    if (kind === "set_var") return "set_var";
    if (kind === "tag") return "tag";
    return "calc";
  }
  if (nt === "notification_email") return "send_email";
  if (nt === "webhook_api") return kind === "slack" ? "slack" : "webhook";
  if (nt === "form") return "submit";
  if (nt === "results_page") return "result";
  if (nt === "text_block") return "note";
  return "note";
}

// Translate design type -> { node_type, config }
export function persistType(dtKey, extraConfig = {}) {
  const def = NODE_TYPES[dtKey];
  if (!def) return { node_type: "text_block", config: extraConfig };
  const config = { ...extraConfig };
  if (def.config_kind) config.kind = def.config_kind;
  return { node_type: def.node_type, config };
}

export function getNodeVisual(node) {
  const dt = designType(node);
  const def = NODE_TYPES[dt];
  if (dt === "result") {
    const rk = RESULT_KINDS[node.config?.result_kind] || RESULT_KINDS.qualified;
    return { accent: rk.accent, hex: ACCENT_HEX[rk.accent], icon: rk.icon, label: rk.label, dt };
  }
  return {
    accent: def?.accent || "zinc",
    hex: ACCENT_HEX[def?.accent || "zinc"],
    icon: def?.icon || "Flag",
    label: def?.label || dt,
    dt,
  };
}

export function getNodeOutputs(node) {
  const dt = designType(node);
  const def = NODE_TYPES[dt];
  if (!def) return [{ id: "next", label: "" }];
  return def.outputs(node);
}