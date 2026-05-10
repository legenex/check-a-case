import React, { useState } from "react";
import { X, Plus } from "lucide-react";

function TagChipInput({ label, value = [], onChange }) {
  const [input, setInput] = useState("");

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  };

  const removeTag = (tag) => onChange(value.filter((t) => t !== tag));

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background min-h-[42px]">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-medium">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input); }
            if (e.key === "Backspace" && !input && value.length) removeTag(value[value.length - 1]);
          }}
          onBlur={() => input && addTag(input)}
          placeholder="Type and press Enter..."
          className="flex-1 min-w-[100px] h-7 outline-none bg-transparent text-sm"
        />
      </div>
    </div>
  );
}

export default function TagsTab({ node, onUpdate }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Tags are applied / removed when this node is entered, regardless of answer.</p>
      <TagChipInput
        label="Tags to Add"
        value={node.tags_to_add || []}
        onChange={(v) => onUpdate({ tags_to_add: v })}
      />
      <TagChipInput
        label="Tags to Remove"
        value={node.tags_to_remove || []}
        onChange={(v) => onUpdate({ tags_to_remove: v })}
      />
    </div>
  );
}