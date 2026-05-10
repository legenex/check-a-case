import React, { useState } from "react";
import { ChevronDown, ChevronRight, Trash2, ArrowUp, ArrowDown } from "lucide-react";

const WIDTH_OPTIONS = ['full', 'half', 'third'];

export default function FormFieldRow({ field, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = useState(!field.custom_field_id);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}>
        {expanded ? <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />}

        <input
          value={field.custom_field_id || ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onChange({ custom_field_id: e.target.value })}
          placeholder="custom_field_id (e.g. first_name)"
          className="flex-1 bg-transparent text-sm font-mono focus:outline-none text-slate-700 placeholder:text-slate-300"
        />
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{field.width || 'full'}</span>
        {field.is_required && <span className="text-xs text-red-400 font-medium">req</span>}

        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={index === 0}
            className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20"><ArrowUp size={12} /></button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20"><ArrowDown size={12} /></button>
          <button onClick={onRemove}
            className="p-0.5 rounded text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-3 grid grid-cols-2 gap-3 bg-slate-50/50">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Custom Field ID</label>
            <input value={field.custom_field_id || ''} onChange={(e) => onChange({ custom_field_id: e.target.value })}
              placeholder="e.g. first_name"
              className="w-full h-7 px-2 rounded border border-input bg-background text-xs font-mono mt-0.5" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Display Label Override</label>
            <input value={field.display_label_override || ''} onChange={(e) => onChange({ display_label_override: e.target.value })}
              placeholder="Leave blank to use CustomField label"
              className="w-full h-7 px-2 rounded border border-input bg-background text-xs mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Placeholder</label>
            <input value={field.placeholder || ''} onChange={(e) => onChange({ placeholder: e.target.value })}
              className="w-full h-7 px-2 rounded border border-input bg-background text-xs mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Autocomplete</label>
            <input value={field.autocomplete || ''} onChange={(e) => onChange({ autocomplete: e.target.value })}
              placeholder="e.g. email, tel, given-name"
              className="w-full h-7 px-2 rounded border border-input bg-background text-xs mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Width</label>
            <select value={field.width || 'full'} onChange={(e) => onChange({ width: e.target.value })}
              className="w-full h-7 px-2 rounded border border-input bg-background text-xs mt-0.5">
              {WIDTH_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-3">
            <input type="checkbox" id={`req-${index}`} checked={!!field.is_required}
              onChange={(e) => onChange({ is_required: e.target.checked })} />
            <label htmlFor={`req-${index}`} className="text-xs text-slate-600">Required</label>
          </div>
        </div>
      )}
    </div>
  );
}