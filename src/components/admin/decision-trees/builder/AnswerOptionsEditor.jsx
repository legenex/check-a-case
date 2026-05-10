import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { uuidv4 } from "@/lib/uuid";

function toSnakeCase(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "").slice(0, 50);
}

export default function AnswerOptionsEditor({ options, onChange, scoreEnabled }) {
  const handleChange = (index, field, value) => {
    const updated = options.map((o, i) => {
      if (i !== index) return o;
      const next = { ...o, [field]: value };
      if (field === "label" && !o._value_manually_set) {
        next.value = toSnakeCase(value);
      }
      if (field === "value") next._value_manually_set = true;
      return next;
    });
    onChange(updated);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(options);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onChange(items);
  };

  const addOption = () => {
    onChange([...options, { option_id: uuidv4(), label: "", value: "", score: 0, is_dq: false, dq_type: null, tags_to_add: [], tags_to_remove: [], _value_manually_set: false }]);
  };

  const removeOption = (index) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="answer-options">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {options.map((opt, index) => (
                <Draggable key={opt.option_id || index} draggableId={opt.option_id || String(index)} index={index}>
                  {(drag) => (
                    <div ref={drag.innerRef} {...drag.draggableProps} className="bg-background border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div {...drag.dragHandleProps} className="opacity-40 cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <Input
                          value={opt.label}
                          onChange={(e) => handleChange(index, "label", e.target.value)}
                          placeholder="Option label..."
                          className="flex-1 h-8 text-sm"
                        />
                        <button onClick={() => removeOption(index)} className="opacity-40 hover:opacity-100 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 pl-6">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-0.5">Value (snake_case)</div>
                          <Input
                            value={opt.value}
                            onChange={(e) => handleChange(index, "value", e.target.value)}
                            className="h-7 text-xs font-mono"
                            placeholder="auto_generated"
                          />
                        </div>
                        {scoreEnabled && (
                          <div className="w-16">
                            <div className="text-xs text-muted-foreground mb-0.5">Score</div>
                            <Input type="number" value={opt.score || 0} onChange={(e) => handleChange(index, "score", Number(e.target.value))} className="h-7 text-xs" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`dq-${opt.option_id}`}
                            checked={!!opt.is_dq}
                            onCheckedChange={(v) => handleChange(index, "is_dq", v)}
                          />
                          <label htmlFor={`dq-${opt.option_id}`} className="text-xs text-muted-foreground whitespace-nowrap">DQ</label>
                          {opt.is_dq && (
                            <div className="flex gap-1">
                              {["hard", "soft"].map((t) => (
                                <button
                                  key={t}
                                  onClick={() => handleChange(index, "dq_type", t)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${opt.dq_type === t ? (t === "hard" ? "bg-red-100 border-red-300 text-red-700" : "bg-amber-100 border-amber-300 text-amber-700") : "border-border text-muted-foreground"}`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Button variant="outline" size="sm" onClick={addOption} className="w-full gap-2 mt-2">
        <Plus className="w-3.5 h-3.5" /> Add Option
      </Button>
    </div>
  );
}