import React, { useState, useEffect, useCallback } from "react";
import { X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import NodeInspectorPanel from "@/components/admin/dt/inspector/NodeInspectorPanel";

/**
 * NodeEditorModal - wraps the NodeInspectorPanel in a floating modal.
 * Supports dirty-state tracking, keyboard shortcuts (Ctrl+S / Delete), and Prev/Next navigation.
 */
export default function NodeEditorModal({
  node,
  allNodes = [],
  allEdges = [],
  quiz,
  quizId,
  onSave,
  onDelete,
  onClose,
}) {
  const [localData, setLocalData] = useState(() => ({ ...node }));
  const [isDirty, setIsDirty] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = allNodes.findIndex((n) => (n.node_id || n._flowId) === (node.node_id || node._flowId));
    return idx >= 0 ? idx : 0;
  });

  // Sync localData when navigating between nodes
  useEffect(() => {
    const n = allNodes[currentIndex];
    if (n) {
      setLocalData({ ...n });
      setIsDirty(false);
    }
  }, [currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.key === "Escape") { handleClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [localData, isDirty]);

  const handleUpdate = useCallback((patch) => {
    setLocalData((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(localData);
    setIsDirty(false);
  }, [localData, onSave]);

  const handleDiscard = useCallback(() => {
    const original = allNodes[currentIndex] || node;
    setLocalData({ ...original });
    setIsDirty(false);
  }, [allNodes, currentIndex, node]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Discard them?")) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  }, [isDirty, onClose]);

  const handleDelete = useCallback(() => {
    if (window.confirm("Delete this node? This cannot be undone.")) {
      onDelete?.(localData.node_id || localData._flowId);
      onClose?.();
    }
  }, [localData, onDelete, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };
  const handleNext = () => {
    if (currentIndex < allNodes.length - 1) setCurrentIndex((i) => i + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none">
      {/* Backdrop (click to close) */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="relative h-full pointer-events-auto shadow-2xl flex flex-col"
        style={{ width: 380 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top navigation bar */}
        <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex-shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Previous node"
          >
            <ChevronLeft size={14} className="text-slate-600" />
          </button>
          <span className="text-[10px] text-slate-500 flex-1 text-center">
            {currentIndex + 1} / {allNodes.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === allNodes.length - 1}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Next node"
          >
            <ChevronRight size={14} className="text-slate-600" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-100 transition-colors ml-1"
            title="Delete node"
          >
            <Trash2 size={13} className="text-red-500" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-slate-200 transition-colors"
            title="Close (Esc)"
          >
            <X size={14} className="text-slate-600" />
          </button>
        </div>

        {/* Inspector panel (fills the rest) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <NodeInspectorPanel
            node={localData}
            quiz={quiz}
            quizId={quizId}
            allNodes={allNodes}
            allEdges={allEdges}
            onUpdate={handleUpdate}
            onClose={handleClose}
            isDirty={isDirty}
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
        </div>
      </div>
    </div>
  );
}