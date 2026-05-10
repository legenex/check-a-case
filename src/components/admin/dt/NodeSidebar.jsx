import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Trash2, Plus } from "lucide-react";
import NodeTypePicker from "./NodeTypePicker";
import NodeTypeIcon from "./NodeTypeIcon";

export default function NodeSidebar({ nodes, selectedNodeId, scoreEnabled, onSelect, onAddNode, onReorder, onDelete }) {
  const [showPicker, setShowPicker] = useState(false);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(nodes);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered);
  };

  return (
    <div className="w-72 flex-shrink-0 bg-card border-r border-border flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Nodes ({nodes.length})</span>
      </div>

      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="nodes">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="p-2 space-y-1">
                {nodes.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((node, idx) => {
                  const hasDq = node.answer_options?.some((o) => o.is_dq);
                  const isSelected = node.id === selectedNodeId;
                  return (
                    <Draggable key={node.id} draggableId={node.id} index={idx}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer group transition-colors ${
                            isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
                          } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                          onClick={() => onSelect(node.id)}
                        >
                          <span {...drag.dragHandleProps} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <NodeTypeIcon type={node.node_type} className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{node.label || node.node_type}</p>
                            <p className="text-xs text-muted-foreground truncate">{node.title_display || node.node_type}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {hasDq && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">DQ</span>}
                            {scoreEnabled && node.answer_options?.length > 0 && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">S</span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this node?")) onDelete(node.id); }}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
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
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Node
        </button>
      </div>

      {showPicker && (
        <NodeTypePicker
          onSelect={(type) => { onAddNode(type); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}