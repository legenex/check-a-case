import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Plus, Trash2, ChevronDown, ChevronUp, Play, CheckCircle, XCircle } from "lucide-react";
import EditorShell from "./_EditorShell";
import { Field, Toggle, ConditionGroup, NodePicker, ChipInput, EditorField, EditorSection } from "./_primitives";
import { evaluateDecisionNode } from "@/lib/decisionTreeRuntime";

const TABS = [
  { id: "paths", label: "Paths" },
  { id: "evaluation", label: "Evaluation Settings" },
  { id: "test", label: "Test Panel" },
  { id: "general", label: "General" },
];

function PathRow({ path, idx, allNodes, onUpdate, onDelete, draggable }) {
  const [expanded, setExpanded] = useState(true);
  const [showEffects, setShowEffects] = useState(false);

  return (
    <div ref={draggable.innerRef} {...draggable.draggableProps}
      className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors">
        <span {...draggable.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab flex-shrink-0">
          <GripVertical size={14} />
        </span>
        <span className="text-xs text-slate-400 font-mono flex-shrink-0">#{idx + 1}</span>
        <input value={path.title || ""} onChange={(e) => onUpdate({ ...path, title: e.target.value })}
          placeholder="Path title (admin-facing)"
          className="flex-1 h-7 px-2 rounded border border-slate-200 bg-white text-sm min-w-0" />
        <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">handle: path-{path.path_id?.slice(0, 6)}...</span>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="p-1 rounded hover:bg-slate-200 flex-shrink-0">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <button type="button" onClick={() => onDelete(path.path_id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 flex-shrink-0">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="p-3 space-y-4 border-t border-slate-100">
          {/* Target node */}
          <EditorField label="Route to Node">
            <NodePicker value={path.target_node_id} onChange={(v) => onUpdate({ ...path, target_node_id: v })} allNodes={allNodes} />
          </EditorField>

          {/* Conditions */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Conditions</p>
            <ConditionGroup
              value={path.conditions || { logic: "AND", conditions: [] }}
              onChange={(v) => onUpdate({ ...path, conditions: v })}
            />
          </div>

          {/* Side effects (collapsible) */}
          <div>
            <button type="button" onClick={() => setShowEffects((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
              {showEffects ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              Path Effects (applied when matched, if "Apply side effects" is ON)
            </button>
            {showEffects && (
              <div className="mt-3 pl-3 border-l-2 border-slate-200 space-y-3">
                <EditorField label="Tags to Add">
                  <ChipInput value={path.tags_to_add || []} onChange={(v) => onUpdate({ ...path, tags_to_add: v })} />
                </EditorField>
                <EditorField label="Tags to Remove">
                  <ChipInput value={path.tags_to_remove || []} onChange={(v) => onUpdate({ ...path, tags_to_remove: v })} />
                </EditorField>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DecisionNodeEditor({ draft, updateDraft, updateConfig, allNodes }) {
  const config = draft.config || {};
  const paths = config.paths || [];

  const updatePaths = (newPaths) => updateConfig({ paths: newPaths });
  const updatePath = (updated) => updatePaths(paths.map((p) => p.path_id === updated.path_id ? updated : p));
  const deletePath = (pathId) => updatePaths(paths.filter((p) => p.path_id !== pathId));
  const addPath = () => updatePaths([...paths, {
    path_id: crypto.randomUUID(),
    title: `Path ${paths.length + 1}`,
    conditions: { logic: "AND", conditions: [] },
    target_node_id: null,
    tags_to_add: [],
    tags_to_remove: [],
    custom_field_assignments: [],
  }]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(paths);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    updatePaths(reordered);
  };

  // Test panel state
  const [testFields, setTestFields] = useState("");
  const [testTags, setTestTags] = useState("");
  const [testResult, setTestResult] = useState(null);

  const runTest = () => {
    let fieldValues = {};
    let tags = [];
    try { fieldValues = JSON.parse(testFields || "{}"); } catch { fieldValues = {}; }
    try { tags = testTags.split(",").map((t) => t.trim()).filter(Boolean); } catch { tags = []; }
    const result = evaluateDecisionNode(config, fieldValues, tags);
    const matchedPath = paths.find((p) => result.handle === `path-${p.path_id}`);
    setTestResult({ result, matchedPath, fieldValues, tags });
  };

  return (
    <EditorShell tabs={TABS}>
      {(tab) => (
        <>
          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Admin Label" value={draft.label} onChange={(v) => updateDraft({ label: v })} required />
              <Field label="Description" value={draft.help_text} onChange={(v) => updateDraft({ help_text: v })} rows={2}
                helper="Internal notes about this routing step" />
            </div>
          )}

          {tab === "paths" && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                Paths are evaluated top-to-bottom. First match wins (unless "Evaluate ALL" is on). Drag to reorder priority.
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="paths">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {paths.map((path, idx) => (
                        <Draggable key={path.path_id} draggableId={path.path_id} index={idx}>
                          {(drag) => (
                            <PathRow path={path} idx={idx} allNodes={allNodes}
                              onUpdate={updatePath} onDelete={deletePath} draggable={drag} />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <button type="button" onClick={addPath}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors">
                <Plus size={14} /> Add Path
              </button>

              {/* Else fallback info */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs font-mono text-slate-400">handle: path-else</span>
                <span className="text-xs text-slate-500">-- used when no conditions match. Wire on canvas.</span>
              </div>
            </div>
          )}

          {tab === "evaluation" && (
            <div className="space-y-4">
              <Toggle label="Evaluate ALL paths" value={config.evaluate_all_paths || false}
                onChange={(v) => updateConfig({ evaluate_all_paths: v })}
                helper="When ON, all matching paths fire (not just first). Tags from each path accumulate." />
              <Toggle label="Fallthrough on no match" value={config.fallthrough_on_no_match !== false}
                onChange={(v) => updateConfig({ fallthrough_on_no_match: v })}
                helper="When ON and no paths match, routes to the path-else handle." />
              <Toggle label="Apply path side effects on match" value={config.apply_side_effects || false}
                onChange={(v) => updateConfig({ apply_side_effects: v })}
                helper="When ON, per-path tags_to_add and custom_field_assignments fire when that path matches." />
            </div>
          )}

          {tab === "test" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Enter mock data and evaluate paths without affecting any real leads.</p>
              <EditorField label="Field Values (JSON)" helper='e.g. {"state":"CA","injury_severity":"serious"}'>
                <textarea value={testFields} onChange={(e) => setTestFields(e.target.value)} rows={5}
                  placeholder='{"state": "CA", "accident_date_bucket": "within_30_days"}'
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-y" />
              </EditorField>
              <EditorField label="Tags (comma-separated)" helper="e.g. qualified,has_injury">
                <input value={testTags} onChange={(e) => setTestTags(e.target.value)} placeholder="tag1, tag2"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
              </EditorField>
              <button type="button" onClick={runTest}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors">
                <Play size={13} /> Evaluate Paths
              </button>

              {testResult && (
                <div className="p-4 bg-slate-900 rounded-lg text-xs font-mono space-y-2">
                  <p className="text-green-400 font-bold">-- Evaluation Result --</p>
                  {testResult.matchedPath ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-300">Matched: <span className="text-white">{testResult.matchedPath.title}</span></p>
                        <p className="text-slate-400">handle: {testResult.result.handle}</p>
                        <p className="text-slate-400">target: {testResult.matchedPath.target_node_id || "(no target set)"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300">No paths matched.</p>
                        <p className="text-slate-400">handle: {testResult.result.handle || "none"}</p>
                        {config.fallthrough_on_no_match !== false && <p className="text-slate-400">Fallthrough to path-else handle.</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </EditorShell>
  );
}