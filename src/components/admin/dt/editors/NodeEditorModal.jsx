import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Trash2, ChevronLeft, ChevronRight, Save, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NodeInspectorPanel from "@/components/admin/dt/inspector/NodeInspectorPanel";

/**
 * NodeEditorModal - slide-in panel with animations, dirty tracking, keyboard shortcuts,
 * save-on-blur, toast feedback, and prev/next navigation.
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
  const [saveToast, setSaveToast] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = allNodes.findIndex(
      (n) => (n.node_id || n._flowId) === (node.node_id || node._flowId)
    );
    return idx >= 0 ? idx : 0;
  });

  const panelRef = useRef(null);
  const toastTimerRef = useRef(null);

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
      if (ctrl && e.key === "Enter") { e.preventDefault(); handleSaveAndContinue(); }
      if (e.key === "Escape") { handleClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [localData, isDirty, currentIndex]);

  // Save-on-blur: when focus leaves the panel entirely
  const handlePanelBlur = useCallback((e) => {
    if (panelRef.current && !panelRef.current.contains(e.relatedTarget)) {
      if (isDirty) {
        onSave?.(localData);
        setIsDirty(false);
        showToast();
      }
    }
  }, [isDirty, localData, onSave]);

  const showToast = () => {
    setSaveToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSaveToast(false), 1500);
  };

  const handleUpdate = useCallback((patch) => {
    setLocalData((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(localData);
    setIsDirty(false);
    showToast();
  }, [localData, onSave]);

  const handleSaveAndContinue = useCallback(() => {
    onSave?.(localData);
    setIsDirty(false);
    showToast();
    if (currentIndex < allNodes.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose?.();
    }
  }, [localData, onSave, currentIndex, allNodes.length, onClose]);

  const handleSaveAndExit = useCallback(() => {
    onSave?.(localData);
    setIsDirty(false);
    onClose?.();
  }, [localData, onSave, onClose]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] pointer-events-auto"
        onClick={handleClose}
      />

      {/* Animated panel */}
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        onBlur={handlePanelBlur}
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative h-full pointer-events-auto shadow-2xl flex flex-col bg-white border-l border-slate-200 outline-none"
        style={{ width: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top navigation bar */}
        <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <button
            onClick={() => { if (isDirty) handleSave(); setCurrentIndex((i) => Math.max(0, i - 1)); }}
            disabled={currentIndex === 0}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Previous node"
          >
            <ChevronLeft size={14} className="text-slate-600" />
          </button>
          <span className="text-[10px] text-slate-400 flex-1 text-center font-mono">
            {currentIndex + 1} / {allNodes.length}
          </span>
          <button
            onClick={() => { if (isDirty) handleSave(); setCurrentIndex((i) => Math.min(allNodes.length - 1, i + 1)); }}
            disabled={currentIndex === allNodes.length - 1}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Next node"
          >
            <ChevronRight size={14} className="text-slate-600" />
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete node"
          >
            <Trash2 size={13} className="text-red-400" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-slate-200 transition-colors"
            title="Close (Esc)"
          >
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* Inspector panel */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
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

        {/* Footer action bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button
            onClick={handleSaveAndExit}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <Save size={13} /> Save and Exit
          </button>
          <button
            onClick={handleSaveAndContinue}
            className="flex items-center gap-1 h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-sm transition-colors"
            title="Save and open next node (Cmd+Enter)"
          >
            {currentIndex < allNodes.length - 1 ? "Continue" : "Done"}
          </button>
          <button
            onClick={handleClose}
            className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 text-sm transition-colors"
            title="Cancel (Esc)"
          >
            Cancel
          </button>
        </div>

        {/* Save toast */}
        <AnimatePresence>
          {saveToast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-16 right-4 flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg pointer-events-none"
            >
              <CheckCircle2 size={12} /> Saved
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}