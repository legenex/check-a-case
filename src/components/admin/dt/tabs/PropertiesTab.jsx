import React, { useState } from "react";
import { Tag } from "lucide-react";

export default function PropertiesTab({ node, onUpdate }) {
  const [local, setLocal] = useState({
    label: node.label || "",
    title_display: node.title_display || "",
    help_text: node.help_text || "",
    placeholder: node.placeholder || "",
    required: node.required ?? true,
    media_image_url: node.media_image_url || "",
    media_video_embed: node.media_video_embed || "",
  });

  const handleBlur = (field, val) => {
    if (val !== node[field]) onUpdate({ [field]: val });
  };

  const handleChange = (field, val) => {
    setLocal((p) => ({ ...p, [field]: val }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Internal Label</label>
        <input
          value={local.label}
          onChange={(e) => handleChange("label", e.target.value)}
          onBlur={() => handleBlur("label", local.label)}
          placeholder="e.g. Accident Type Select"
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">Admin-facing only</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Question / Title <span className="text-destructive">*</span></label>
        <textarea
          value={local.title_display}
          onChange={(e) => handleChange("title_display", e.target.value)}
          onBlur={() => handleBlur("title_display", local.title_display)}
          placeholder="What the respondent sees"
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Help Text</label>
        <input
          value={local.help_text}
          onChange={(e) => handleChange("help_text", e.target.value)}
          onBlur={() => handleBlur("help_text", local.help_text)}
          placeholder="Optional subtext shown below the question"
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Placeholder</label>
        <input
          value={local.placeholder}
          onChange={(e) => handleChange("placeholder", e.target.value)}
          onBlur={() => handleBlur("placeholder", local.placeholder)}
          placeholder="Placeholder text for input fields"
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={local.required}
            onChange={(e) => { handleChange("required", e.target.checked); onUpdate({ required: e.target.checked }); }}
          />
          <span className="text-sm font-medium">Required</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer" title="Adds tag 'visited:{label_snake}' to lead when this node is entered">
          <input
            type="checkbox"
            checked={node.config?.auto_tag_visited || false}
            onChange={(e) => onUpdate({ config: { ...(node.config || {}), auto_tag_visited: e.target.checked } })}
          />
          <span className="flex items-center gap-1 text-sm font-medium">
            <Tag size={12} className="text-slate-500" /> Auto-tag visited
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Media Image URL</label>
        <input
          value={local.media_image_url}
          onChange={(e) => handleChange("media_image_url", e.target.value)}
          onBlur={() => handleBlur("media_image_url", local.media_image_url)}
          placeholder="https://..."
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
        />
        {local.media_image_url && (
          <img src={local.media_image_url} alt="" className="mt-2 rounded-lg max-h-32 object-contain" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Video Embed HTML</label>
        <textarea
          value={local.media_video_embed}
          onChange={(e) => handleChange("media_video_embed", e.target.value)}
          onBlur={() => handleBlur("media_video_embed", local.media_video_embed)}
          placeholder='<iframe src="..." />'
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-none"
        />
      </div>
    </div>
  );
}