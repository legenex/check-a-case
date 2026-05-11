import React, { useState, useCallback, useRef } from "react";
import { X, RotateCcw, Monitor, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

const ANSWER_TYPES = new Set(["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"]);
const DECISION_NODE = "decision_node";

function resolveNextNode(nodeId, optionIdOrHandle, allEdges, allNodes) {
  const perEdge = (allEdges || []).find(
    (e) =>
      (e.source === nodeId || e.source_node_id === nodeId) &&
      (e.sourceHandle === `answer-${optionIdOrHandle}` || e.sourceHandle === optionIdOrHandle)
  );
  const defaultEdge = (allEdges || []).find(
    (e) =>
      (e.source === nodeId || e.source_node_id === nodeId) &&
      (!e.sourceHandle || e.sourceHandle === "default" || e.sourceHandle === "source-right")
  );
  const edge = perEdge || defaultEdge;
  if (!edge) return null;
  const targetId = edge.target || edge.target_node_id;
  return (allNodes || []).find((n) => n.id === targetId || n.node_id === targetId || n._flowId === targetId);
}

function evaluateDecisionPaths(nodeConfig, fieldValues, tags = []) {
  const paths = nodeConfig?.paths || [];
  const matched = [];
  for (const path of paths) {
    const cg = path.condition_group;
    if (!cg) continue;
    if (evalGroup(cg, fieldValues, tags)) matched.push(path);
    if (!nodeConfig.evaluate_all_paths && matched.length) break;
  }
  return matched;
}

function evalGroup(group, fv, tags) {
  const logic = group.logic || "and";
  const results = (group.conditions || []).map((c) => evalCondition(c, fv, tags));
  return logic === "or" ? results.some(Boolean) : results.every(Boolean);
}

function evalCondition(c, fv, tags) {
  const val = fv[c.field];
  const cv = c.value;
  switch (c.operator) {
    case "equals": return String(val) === String(cv);
    case "not_equals": return String(val) !== String(cv);
    case "contains": return String(val || "").includes(cv);
    case "is_empty": return !val;
    case "is_not_empty": return !!val;
    case "greater_than": return Number(val) > Number(cv);
    case "less_than": return Number(val) < Number(cv);
    case "has_tag": return (tags || []).includes(cv);
    case "not_has_tag": return !(tags || []).includes(cv);
    default: return false;
  }
}

export default function NodePreviewModal({ node, allNodes, allEdges, onClose }) {
  const [viewport, setViewport] = useState("desktop");
  const [fieldValues, setFieldValues] = useState({});
  const [tags, setTags] = useState([]);
  const [routingLog, setRoutingLog] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [debugTab, setDebugTab] = useState("routing");
  const [mockFields, setMockFields] = useState({});

  const nodeId = node?.id || node?.node_id;
  const isAnswerType = ANSWER_TYPES.has(node?.node_type);
  const isDecision = node?.node_type === DECISION_NODE;
  const mergedFv = { ...mockFields, ...fieldValues };

  const logRoute = (msg) => setRoutingLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleSelectAnswer = useCallback((opt) => {
    setSelectedOption(opt.option_id);
    setFieldValues((p) => ({ ...p, [nodeId]: opt.value }));
    const next = resolveNextNode(nodeId, opt.option_id, allEdges, allNodes);
    if (opt.is_dq) {
      logRoute(`Selected "${opt.label}" (DQ ${opt.dq_type || "hard"}) - would redirect to DQ page`);
    } else if (next) {
      logRoute(`Selected "${opt.label}" -> would route to "${next.label || next.node_type}"`);
    } else {
      logRoute(`Selected "${opt.label}" -> No connection wired`);
    }
  }, [nodeId, allEdges, allNodes]);

  const handleEvalDecision = useCallback(() => {
    logRoute("Evaluating decision paths...");
    const matched = evaluateDecisionPaths(node?.config || {}, mergedFv, tags);
    if (matched.length === 0) {
      const elseTarget = (allNodes || []).find((n) =>
        (n.node_id || n.id || n._flowId) === node?.config?.else_target_node_id
      );
      logRoute(`No paths matched - fallback to "${elseTarget?.label || "else target"}" (path-else edge)`);
    } else {
      matched.forEach((p) => {
        const target = (allNodes || []).find((n) =>
          (n.node_id || n.id || n._flowId) === p.target_node_id
        );
        logRoute(`Matched path "${p.title || "unnamed"}" -> "${target?.label || p.target_node_id || "no target"}"`);
      });
    }
  }, [node?.config, mergedFv, tags, allNodes]);

  const handleReset = () => {
    setFieldValues({});
    setTags([]);
    setRoutingLog([]);
    setSelectedOption(null);
    setMockFields({});
  };

  if (!node) return null;

  const contentWidth = viewport === "mobile" ? 375 : 520;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 580, maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800 truncate">Preview: {node.label || node.node_type}</p>
            <p className="text-[10px] text-slate-400 font-mono">{node.node_type}</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewport("desktop")}
              className={`p-1.5 rounded-md transition-colors ${viewport === "desktop" ? "bg-white shadow-sm text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
              title="Desktop"
            >
              <Monitor size={13} />
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`p-1.5 rounded-md transition-colors ${viewport === "mobile" ? "bg-white shadow-sm text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
              title="Mobile"
            >
              <Smartphone size={13} />
            </button>
          </div>
          <button onClick={handleReset} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:bg-slate-200 transition-colors">
            <RotateCcw size={11} /> Reset
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 transition-colors">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* Mock fields for decision/webhook */}
        {(isDecision) && (
          <div className="px-5 py-3 border-b border-slate-200 bg-amber-50 flex-shrink-0">
            <p className="text-xs font-semibold text-amber-800 mb-2">Mock prerequisite fields</p>
            <div className="flex flex-wrap gap-2">
              {(node.config?.paths || []).flatMap((p) =>
                (p.condition_group?.conditions || []).map((c) => c.field).filter(Boolean)
              ).filter((v, i, a) => a.indexOf(v) === i).map((fieldKey) => (
                <div key={fieldKey} className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-amber-700">{fieldKey}:</span>
                  <input
                    value={mockFields[fieldKey] || ""}
                    onChange={(e) => setMockFields((p) => ({ ...p, [fieldKey]: e.target.value }))}
                    className="h-6 w-24 px-1.5 text-xs rounded border border-amber-300 bg-white"
                  />
                </div>
              ))}
              {isDecision && (
                <button
                  onClick={handleEvalDecision}
                  className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                >
                  Evaluate Paths
                </button>
              )}
            </div>
          </div>
        )}

        {/* Preview body */}
        <div className="flex-1 overflow-y-auto p-5 flex justify-center">
          <div style={{ width: contentWidth }} className="transition-all duration-200">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
              {node.title_display ? (
                <h2 className="text-lg font-bold text-slate-900">{node.title_display}</h2>
              ) : (
                <h2 className="text-lg font-bold text-slate-300 italic">(no question text set)</h2>
              )}
              {node.help_text && <p className="text-sm text-slate-500">{node.help_text}</p>}

              {/* Answer options */}
              {isAnswerType && node.node_type !== "dropdown" && (
                <div className="space-y-2">
                  {(node.answer_options || []).map((opt) => (
                    <button
                      key={opt.option_id}
                      onClick={() => handleSelectAnswer(opt)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        selectedOption === opt.option_id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300 bg-white"
                      } ${opt.is_dq ? "hover:border-red-300" : ""}`}
                    >
                      <span className="text-sm font-medium flex-1">{opt.label || "(no label)"}</span>
                      {opt.is_dq && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          {opt.dq_type || "DQ"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {isAnswerType && node.node_type === "dropdown" && (
                <select
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                  value={selectedOption || ""}
                  onChange={(e) => {
                    const opt = (node.answer_options || []).find((o) => o.option_id === e.target.value);
                    if (opt) handleSelectAnswer(opt);
                  }}
                >
                  <option value="">Select an option...</option>
                  {(node.answer_options || []).map((opt) => (
                    <option key={opt.option_id} value={opt.option_id}>{opt.label}</option>
                  ))}
                </select>
              )}

              {node.node_type === "text_field" && (
                <input
                  placeholder={node.placeholder || "Type your answer..."}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                  onChange={(e) => setFieldValues((p) => ({ ...p, [nodeId]: e.target.value }))}
                />
              )}

              {node.node_type === "slider" && (
                <input type="range" className="w-full" min={node.config?.min ?? 0} max={node.config?.max ?? 100} />
              )}

              {["text_block", "information", "custom_page", "start_page"].includes(node.node_type) && (
                <p className="text-sm text-slate-500 italic whitespace-pre-wrap">{node.config?.body || "(no body content)"}</p>
              )}

              {node.node_type === "form" && (
                <div className="space-y-2 opacity-70">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="First Name" className="h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white" readOnly />
                    <input placeholder="Last Name" className="h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white" readOnly />
                  </div>
                  <input placeholder="Email" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white" readOnly />
                  <input placeholder="Phone" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white" readOnly />
                  <p className="text-[10px] text-slate-400 italic">Form submission disabled in preview</p>
                </div>
              )}

              {node.node_type === "results_page" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  {node.config?.result_template || "(no result template)"}<br />
                  <span className="text-xs text-green-600">Tier: {node.config?.qualification_tier || "N/A"}</span>
                </div>
              )}

              {node.node_type === "decision_node" && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500 italic">Use mock fields above and click "Evaluate Paths" to test routing.</p>
                  <div className="text-xs text-slate-400 bg-slate-100 rounded p-2 font-mono">
                    {(node.config?.paths || []).length} path(s) configured
                  </div>
                </div>
              )}

              {node.node_type === "webhook_api" && (
                <div className="space-y-2">
                  <div className="text-xs bg-slate-800 text-green-400 rounded p-2 font-mono">
                    POST {node.config?.url || "(no URL)"}<br />
                    {node.config?.body_template ? `Body: ${node.config.body_template.substring(0, 80)}...` : "(no body template)"}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Webhook will NOT fire in preview mode</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Debug panel */}
        <div className="border-t border-slate-200 flex-shrink-0">
          <div className="flex border-b border-slate-200">
            {["routing", "state", "reset"].map((t) => (
              <button
                key={t}
                onClick={() => setDebugTab(t)}
                className={`flex-1 py-2 text-xs font-medium transition-colors capitalize ${
                  debugTab === t ? "border-b-2 border-blue-500 text-blue-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="h-28 overflow-y-auto p-3 bg-slate-900">
            {debugTab === "routing" && (
              routingLog.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">No routing events yet. Interact with the preview above.</p>
              ) : (
                routingLog.map((entry, i) => (
                  <p key={i} className="text-[10px] font-mono text-green-400 leading-5">{entry}</p>
                ))
              )
            )}
            {debugTab === "state" && (
              <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                {JSON.stringify({ field_values: mergedFv, tags }, null, 2)}
              </pre>
            )}
            {debugTab === "reset" && (
              <div className="flex items-center justify-center h-full">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
                >
                  <RotateCcw size={12} /> Clear all preview state
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}