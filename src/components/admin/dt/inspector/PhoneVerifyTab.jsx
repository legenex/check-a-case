import React from "react";

export default function PhoneVerifyTab({ node, allNodes, onUpdate }) {
  const config = node.config || {};
  const update = (patch) => onUpdate({ config: { ...config, ...patch } });
  const nodeOptions = (allNodes || []).filter((n) => n.id !== node.id);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-500">Provider</label>
        <select value={config.provider || "twilio_verify"}
          onChange={(e) => update({ provider: e.target.value })}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5">
          <option value="twilio_verify">Twilio Verify</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-500">Phone Field Key</label>
        <input value={config.phone_field || "phone"}
          onChange={(e) => update({ phone_field: e.target.value })}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm font-mono mt-0.5" />
      </div>
      <div>
        <label className="text-xs text-slate-500">Max Attempts</label>
        <input type="number" value={config.max_attempts || 3}
          onChange={(e) => update({ max_attempts: Number(e.target.value) })}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5" />
      </div>
      <div>
        <label className="text-xs text-slate-500">Code Length</label>
        <input type="number" value={config.code_length || 6}
          onChange={(e) => update({ code_length: Number(e.target.value) })}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5" />
      </div>
      <div>
        <label className="text-xs text-slate-500">Code Message Template</label>
        <input value={config.code_message_template || "Your verification code is {code}"}
          onChange={(e) => update({ code_message_template: e.target.value })}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm font-mono mt-0.5" />
      </div>
      <div>
        <label className="text-xs text-slate-500">On Success</label>
        <select value={config.success_target_node_id || ""}
          onChange={(e) => update({ success_target_node_id: e.target.value })}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5">
          <option value="">-- pick node --</option>
          {nodeOptions.map((n) => <option key={n.id} value={n.node_id || n.id}>{n.label || n.node_type}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-500">On Failure</label>
        <select value={config.failure_target_node_id || ""}
          onChange={(e) => update({ failure_target_node_id: e.target.value })}
          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-sm mt-0.5">
          <option value="">-- pick node --</option>
          {nodeOptions.map((n) => <option key={n.id} value={n.node_id || n.id}>{n.label || n.node_type}</option>)}
        </select>
      </div>
    </div>
  );
}