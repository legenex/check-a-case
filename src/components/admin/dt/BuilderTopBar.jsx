import React, { useState } from "react";
import { ArrowLeft, Eye, Save, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function BuilderTopBar({ quiz, nodes, savedAt, pendingSave, brands, onUpdateQuiz, onSaveNow, onPreview, onBack }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(quiz?.title || "");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (titleVal !== quiz?.title) onUpdateQuiz({ title: titleVal });
  };

  const brand = brands.find((b) => b.id === quiz?.brand_id);

  return (
    <div className="flex items-center gap-3 px-4 h-14 bg-card border-b border-border flex-shrink-0">
      <button onClick={onBack} className="p-1.5 rounded hover:bg-muted transition-colors">
        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Breadcrumb + title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-sm text-muted-foreground hidden sm:block">Decision Trees /</span>
        {editingTitle ? (
          <input
            autoFocus
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            className="text-sm font-semibold bg-transparent border-b border-primary outline-none px-0"
          />
        ) : (
          <button
            onClick={() => { setEditingTitle(true); setTitleVal(quiz?.title || ""); }}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate max-w-[200px]"
          >
            {quiz?.title}
          </button>
        )}
        {brand && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
            {brand.brand_name}
          </span>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <span className="px-2.5 py-1 text-xs font-semibold bg-card rounded-md shadow-sm">Basic</span>
        <span className="px-2.5 py-1 text-xs text-muted-foreground cursor-not-allowed" title="Coming in Phase 2">Advanced</span>
      </div>

      {/* Preview */}
      <button onClick={onPreview} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
        <Eye className="w-4 h-4" /> Preview
      </button>

      {/* Status badge */}
      <div className="relative">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${STATUS_COLORS[quiz?.status] || STATUS_COLORS.draft}`}
        >
          {quiz?.status || "draft"}
          <span className="ml-0.5">▾</span>
        </button>
        {showStatusMenu && (
          <div className="absolute right-0 top-10 z-50 w-36 bg-popover border border-border rounded-lg shadow-lg py-1" onClick={() => setShowStatusMenu(false)}>
            {["draft", "published", "archived"].map((s) => (
              <button key={s} onClick={() => onUpdateQuiz({ status: s })}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted capitalize transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Save indicator */}
      <div className="flex items-center gap-2">
        {pendingSave ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> Unsaved changes
          </span>
        ) : savedAt ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="w-3 h-3" /> Saved {format(savedAt, "HH:mm:ss")}
          </span>
        ) : null}
        <button onClick={onSaveNow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
          <Save className="w-4 h-4" /> Save
        </button>
      </div>
    </div>
  );
}