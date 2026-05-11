import React from "react";
import EditorShell from "./_EditorShell";
import { Field, NodePicker, EditorField, ScriptsEditor } from "./_primitives";

const TABS = [
  { id: "general", label: "General" },
  { id: "routing", label: "Routing" },
  { id: "scripts", label: "Scripts" },
];

export default function TransitionEditor({ draft, updateDraft, updateConfig, allNodes }) {
  const config = draft.config || {};

  return (
    <EditorShell tabs={TABS}>
      {(tab) => (
        <>
          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Admin Label" value={draft.label} onChange={(v) => updateDraft({ label: v })} required />
              <p className="text-xs text-slate-400">Transition nodes are pass-through routers with no user-facing UI. Connect them on the canvas.</p>
            </div>
          )}
          {tab === "routing" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">The next node is wired on the canvas. This editor is for reference only.</p>
              <EditorField label="Target Node (canvas wire takes precedence)">
                <NodePicker value={config.target_node_id} onChange={(v) => updateConfig({ target_node_id: v })} allNodes={allNodes} />
              </EditorField>
            </div>
          )}
          {tab === "scripts" && (
            <ScriptsEditor value={draft.scripts || []} onChange={(v) => updateDraft({ scripts: v })} triggers={["on_enter"]}
             />
          )}
        </>
      )}
    </EditorShell>
  );
}