import React from "react";
import { Trash2, Plus } from "lucide-react";

const TRIGGERS = ["on_enter", "on_exit"];

export default function ScriptsTab({ node, onUpdate }) {
  const scripts = node.scripts || [];

  const handleUpdate = (idx, patch) => {
    onUpdate({ scripts: scripts.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };

  const handleAdd = () => {
    onUpdate({ scripts: [...scripts, { name: "", trigger: "on_enter", language: "javascript", code: "", is_enabled: true }] });
  };

  const handleDelete = (idx) => {
    onUpdate({ scripts: scripts.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Scripts run on node enter or exit at runtime. Use vanilla JavaScript.</p>
      {scripts.map((script, idx) => (
        <div key={idx} className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <input
              value={script.name}
              onChange={(e) => handleUpdate(idx, { name: e.target.value })}
              placeholder="Script name"
              className="flex-1 h-8 px-2 rounded border border-input bg-background text-sm"
            />
            <select
              value={script.trigger}
              onChange={(e) => handleUpdate(idx, { trigger: e.target.value })}
              className="h-8 px-2 rounded border border-input bg-background text-sm"
            >
              {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={script.is_enabled} onChange={(e) => handleUpdate(idx, { is_enabled: e.target.checked })} />
              <span className="text-xs">On</span>
            </label>
            <button onClick={() => handleDelete(idx)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            value={script.code}
            onChange={(e) => handleUpdate(idx, { code: e.target.value })}
            placeholder="// JavaScript code"
            rows={6}
            className="w-full px-3 py-2 rounded border border-input bg-background text-sm font-mono resize-y"
          />
        </div>
      ))}
      <button onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        <Plus className="w-4 h-4" /> Add Script
      </button>
    </div>
  );
}