import React, { useState } from "react";
import { Trash2, Plus, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import Editor from "@monaco-editor/react";

const TRIGGERS = ["on_enter", "on_exit"];

const SNIPPETS = [
  {
    label: "Set field from URL param",
    code: `lead.fields.utm_source = ctx.url.params.get('utm_source') || lead.fields.utm_source;`,
  },
  {
    label: "Add tag based on state",
    code: `if (lead.fields.state === 'CA') {\n  lead.tags.add('high_value_state');\n}`,
  },
  {
    label: "Fire FB CAPI ViewContent",
    code: `await ctx.fetch('/api/pixel/meta', {\n  method: 'POST',\n  body: JSON.stringify({ event: 'ViewContent', event_id: ctx.session.event_id })\n});`,
  },
  {
    label: "Spam ISP filter (stub)",
    code: `// TODO: check lead.fields.email against blocklist\n// const blocked = ['spam.com', 'mailinator.com'];\n// if (blocked.some(d => lead.fields.email?.endsWith(d))) lead.tags.add('spam');`,
  },
  {
    label: "BigQuery Cloud Run lookup (stub)",
    code: `// const res = await ctx.fetch('https://YOUR_CLOUD_RUN_URL', {\n//   method: 'POST',\n//   body: JSON.stringify({ state: lead.fields.state })\n// });\n// const data = await res.json();\n// lead.fields.conversion_rate = data.conversion_rate;`,
  },
];

const SANDBOX_HELP = `Sandbox API available in scripts:
• lead.fields      — object, read/write field values
• lead.tags        — Set with .add / .remove / .has
• lead.run         — DecisionTreeRun snapshot (read)
• node             — current Question snapshot (read)
• quiz             — current Quiz snapshot (read)
• ctx.url          — URL helper: .params.get, .host, .referrer
• ctx.session      — session helper: .event_id, .id
• ctx.fetch        — sandboxed fetch wrapper
• ctx.lookup(node_id, field_key) — cross-node value getter`;

export default function ScriptsTab({ node, onUpdate }) {
  const scripts = node.scripts || [];
  const [expanded, setExpanded] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [snippetOpen, setSnippetOpen] = useState(null);

  const handleUpdate = (idx, patch) => {
    onUpdate({ scripts: scripts.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };

  const handleAdd = () => {
    const idx = scripts.length;
    onUpdate({ scripts: [...scripts, { name: "", trigger: "on_enter", language: "javascript", code: "", is_enabled: true }] });
    setExpanded((e) => ({ ...e, [idx]: true }));
  };

  const handleDelete = (idx) => {
    onUpdate({ scripts: scripts.filter((_, i) => i !== idx) });
  };

  const insertSnippet = (idx, snippet) => {
    const existing = scripts[idx]?.code || "";
    handleUpdate(idx, { code: existing + (existing ? "\n\n" : "") + snippet });
    setSnippetOpen(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Scripts run at node enter/exit. Phase 2 builds the editor; execution wires in Phase 3.</p>
        <button onClick={() => setShowHelp(!showHelp)} className="text-slate-400 hover:text-slate-600 transition-colors">
          <HelpCircle size={14} />
        </button>
      </div>

      {showHelp && (
        <pre className="text-[10px] bg-slate-900 text-green-300 rounded-lg p-3 whitespace-pre-wrap leading-relaxed overflow-auto max-h-48">
          {SANDBOX_HELP}
        </pre>
      )}

      {scripts.map((script, idx) => (
        <div key={idx} className="rounded-lg border border-slate-200 overflow-hidden">
          {/* Row header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 cursor-pointer"
            onClick={() => setExpanded((e) => ({ ...e, [idx]: !e[idx] }))}>
            {expanded[idx] ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
            <input value={script.name || ""} placeholder="Script name"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleUpdate(idx, { name: e.target.value })}
              className="flex-1 bg-transparent text-xs font-medium text-slate-700 focus:outline-none" />
            <select value={script.trigger || "on_enter"}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleUpdate(idx, { trigger: e.target.value })}
              className="h-6 px-1 rounded border border-slate-200 bg-white text-xs">
              {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label className="flex items-center gap-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={script.is_enabled ?? true}
                onChange={(e) => handleUpdate(idx, { is_enabled: e.target.checked })}
                className="w-3 h-3 accent-blue-600" />
              <span className="text-[10px] text-slate-500">On</span>
            </label>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
              className="text-red-400 hover:text-red-600 transition-colors ml-1">
              <Trash2 size={12} />
            </button>
          </div>

          {expanded[idx] && (
            <div>
              {/* Snippet toolbar */}
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                <span className="text-[10px] text-slate-400">Snippets:</span>
                <div className="relative">
                  <button onClick={() => setSnippetOpen(snippetOpen === idx ? null : idx)}
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                    Insert <ChevronDown size={10} />
                  </button>
                  {snippetOpen === idx && (
                    <div className="absolute left-0 top-5 z-20 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                      {SNIPPETS.map((s) => (
                        <button key={s.label} onClick={() => insertSnippet(idx, s.code)}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 truncate">
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Monaco editor */}
              <div className="border-t border-slate-100">
                <Editor
                  height="220px"
                  defaultLanguage="javascript"
                  value={script.code || ""}
                  onChange={(val) => handleUpdate(idx, { code: val || "" })}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                    tabSize: 2,
                    wordWrap: "on",
                    folding: false,
                    renderLineHighlight: "none",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleAdd}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
        <Plus size={13} /> Add Script
      </button>
    </div>
  );
}