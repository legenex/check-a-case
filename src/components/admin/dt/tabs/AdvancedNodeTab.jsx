import React from "react";

/**
 * AdvancedNodeTab - Per-node custom CSS (scoped to [data-node-id]) and other advanced settings.
 */
export default function AdvancedNodeTab({ node, onUpdate }) {
  const customCss = node.config?.custom_css || "";

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Custom CSS
        </label>
        <p className="text-[11px] text-slate-500 mb-2">
          CSS is scoped to{" "}
          <code className="font-mono bg-slate-100 px-1 rounded text-[10px]">
            [data-node-id="{node.node_id || node._flowId}"]
          </code>{" "}
          at runtime.
        </p>
        <textarea
          value={customCss}
          onChange={(e) =>
            onUpdate({ config: { ...(node.config || {}), custom_css: e.target.value } })
          }
          rows={8}
          placeholder={`.my-element {\n  color: red;\n}`}
          className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
          spellCheck={false}
        />
      </div>

      <div className="pt-3 border-t border-slate-200">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Node ID</label>
        <input
          readOnly
          value={node.node_id || node._flowId || ""}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-slate-50 text-xs font-mono text-slate-400"
        />
      </div>
    </div>
  );
}