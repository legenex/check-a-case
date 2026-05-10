import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, AlertTriangle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NODE_TYPE_META } from "./nodeTypeMeta";

const BASIC_NODE_TYPES = [
  { group: "Pages", types: ["start_page", "results_page", "information", "text_block", "custom_page"] },
  { group: "Inputs", types: ["single_select", "multiple_choice", "checkbox_multi_select", "dropdown", "text_field", "slider", "date_picker", "datetime_picker", "address"] },
  { group: "Forms", types: ["form"] },
  { group: "Logic (Phase 2)", types: ["decision_node", "transition"], disabled: true },
  { group: "Notifications (Phase 2)", types: ["notification_email", "notification_sms", "notification_whatsapp"], disabled: true },
  { group: "Integrations (Phase 2)", types: ["webhook_api", "phone_verification"], disabled: true },
];

export default function NodeSidebar({ nodes, selectedNodeId, onSelect, onAdd, onReorder, onDelete }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const sorted = [...nodes].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sorted);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onReorder(items.map((n) => n.id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nodes ({sorted.length})</div>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="nodes">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 overflow-y-auto py-2">
              {sorted.map((node, index) => {
                const meta = NODE_TYPE_META[node.node_type] || {};
                const isSelected = node.id === selectedNodeId;
                const hasDq = node.answer_options?.some((o) => o.is_dq);
                return (
                  <Draggable key={node.id} draggableId={node.id} index={index}>
                    {(drag) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        className={`group mx-2 mb-1 rounded-lg border transition-all cursor-pointer ${isSelected ? "border-primary bg-primary/5" : "border-transparent hover:border-border hover:bg-muted/40"}`}
                        onClick={() => onSelect(node.id)}
                      >
                        <div className="flex items-center gap-2 px-2 py-2.5">
                          <div {...drag.dragHandleProps} className="opacity-0 group-hover:opacity-40 flex-shrink-0">
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-base flex-shrink-0">{meta.icon || "?"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">{node.label || node.title_display || node.node_type}</div>
                            <div className="text-[10px] text-muted-foreground">{meta.label || node.node_type}</div>
                          </div>
                          {hasDq && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                            className="opacity-0 group-hover:opacity-60 hover:opacity-100 flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <div className="p-3 border-t">
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setPickerOpen(true)}>
          <Plus className="w-4 h-4" /> Add Node
        </Button>
      </div>

      {/* Node type picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Node</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {BASIC_NODE_TYPES.map((group) => (
              <div key={group.group}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.group}</div>
                <div className="grid grid-cols-2 gap-2">
                  {group.types.map((type) => {
                    const meta = NODE_TYPE_META[type] || {};
                    return (
                      <button
                        key={type}
                        disabled={group.disabled}
                        onClick={() => { onAdd(type); setPickerOpen(false); }}
                        className="flex items-center gap-3 p-3 rounded-lg border text-left hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="text-xl">{meta.icon || "?"}</span>
                        <div>
                          <div className="text-sm font-medium">{meta.label || type}</div>
                          <div className="text-xs text-muted-foreground">{meta.desc || ""}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}