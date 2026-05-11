import React, { useState } from "react";
import { X, RotateCcw } from "lucide-react";

const ANSWER_TYPES = new Set(["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"]);

function PreviewAnswer({ option, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(option)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 hover:border-blue-300 bg-white"
      } ${option.is_dq ? "border-red-200 hover:border-red-300" : ""}`}
    >
      <span className="text-sm font-medium flex-1">{option.label || "(no label)"}</span>
      {option.is_dq && (
        <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
          {option.dq_type || "DQ"}
        </span>
      )}
    </button>
  );
}

export default function NodePreviewModal({ node, allNodes, allEdges, onClose }) {
  const [selectedValue, setSelectedValue] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [log, setLog] = useState([]);

  if (!node) return null;

  const isAnswerType = ANSWER_TYPES.has(node.node_type);

  const resolveNextNode = (optionId) => {
    const nodeId = node.id || node.node_id;
    const perAnswerEdge = (allEdges || []).find(
      (e) => (e.source === nodeId || e.source_node_id === nodeId)
        && e.sourceHandle === optionId
    );
    const defaultEdge = (allEdges || []).find(
      (e) => (e.source === nodeId || e.source_node_id === nodeId)
        && (!e.sourceHandle || e.sourceHandle === "default")
    );
    const edge = perAnswerEdge || defaultEdge;
    if (!edge) return null;
    const targetId = edge.target || edge.target_node_id;
    return (allNodes || []).find((n) => n.id === targetId || n.node_id === targetId);
  };

  const handleSelectAnswer = (option) => {
    setSelectedValue(option.option_id);
    const nextNode = resolveNextNode(option.option_id);
    const msg = nextNode
      ? `Would route to: "${nextNode.label || nextNode.node_type}"`
      : "No route wired for this answer (no default either)";
    setLog((prev) => [`[${option.label}] ${msg}`, ...prev]);
  };

  const handleReset = () => {
    setSelectedValue(null);
    setFieldValues({});
    setLog([]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col"
        style={{ width: 480, maxHeight: 640 }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl flex-shrink-0">
          <div>
            <p className="font-semibold text-sm text-slate-800">Node Preview</p>
            <p className="text-[10px] text-slate-400 font-mono">{node.node_type}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw size={11} /> Reset
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 transition-colors">
              <X size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Preview body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
            {node.title_display && (
              <h2 className="text-lg font-bold text-slate-900">{node.title_display}</h2>
            )}
            {!node.title_display && (
              <h2 className="text-lg font-bold text-slate-400 italic">(no title_display set)</h2>
            )}
            {node.help_text && (
              <p className="text-sm text-slate-500">{node.help_text}</p>
            )}

            {/* Answer options */}
            {isAnswerType && (
              <div className="space-y-2">
                {node.node_type === "dropdown" ? (
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                    value={selectedValue || ""}
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
                ) : (
                  (node.answer_options || []).map((opt) => (
                    <PreviewAnswer
                      key={opt.option_id}
                      option={opt}
                      selected={selectedValue === opt.option_id}
                      onSelect={handleSelectAnswer}
                    />
                  ))
                )}
              </div>
            )}

            {/* Text field */}
            {node.node_type === "text_field" && (
              <input
                placeholder={node.placeholder || "Type your answer..."}
                value={fieldValues.__text || ""}
                onChange={(e) => setFieldValues((p) => ({ ...p, __text: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              />
            )}

            {/* Form */}
            {node.node_type === "form" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="First Name" className="h-9 px-3 rounded-lg border border-slate-200 text-sm" readOnly />
                  <input placeholder="Last Name" className="h-9 px-3 rounded-lg border border-slate-200 text-sm" readOnly />
                </div>
                <input placeholder="Email" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm" readOnly />
                <input placeholder="Phone" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm" readOnly />
                <p className="text-[10px] text-slate-400 italic">Form submission disabled in preview</p>
              </div>
            )}

            {/* Results */}
            {node.node_type === "results_page" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                {node.config?.result_template || "(no result template)"}
              </div>
            )}

            {/* Generic info types */}
            {["start_page", "information", "text_block", "custom_page"].includes(node.node_type) && (
              <p className="text-sm text-slate-500 italic">{node.config?.body || "(no body content)"}</p>
            )}
          </div>

          {/* Debug log */}
          {log.length > 0 && (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 px-3 py-1.5">
                <p className="text-[10px] font-mono text-slate-300">Routing log</p>
              </div>
              <div className="bg-slate-900 px-3 py-2 space-y-1 max-h-32 overflow-y-auto">
                {log.map((entry, i) => (
                  <p key={i} className="text-[10px] font-mono text-green-400">{entry}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}