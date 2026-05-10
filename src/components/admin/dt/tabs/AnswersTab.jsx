import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Trash2, Plus } from "lucide-react";

function toSnakeCase(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function AnswerRow({ option, idx, scoreEnabled, onUpdate, onDelete, draggable }) {
  const [local, setLocal] = useState({ ...option });

  const commit = (field, val) => {
    if (val !== option[field]) onUpdate({ ...option, [field]: val });
  };

  const handleLabelBlur = () => {
    const updates = { ...local };
    if (!option.value || option.value === toSnakeCase(option.label || "")) {
      updates.value = toSnakeCase(local.label);
    }
    onUpdate({ ...option, ...updates });
  };

  return (
    <div ref={draggable.innerRef} {...draggable.draggableProps}
      className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border group">
      <span {...draggable.dragHandleProps} className="mt-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Label</label>
            <input
              value={local.label}
              onChange={(e) => setLocal((p) => ({ ...p, label: e.target.value }))}
              onBlur={handleLabelBlur}
              placeholder="Answer label"
              className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5"
            />
          </div>
          <div className="w-36">
            <label className="text-xs text-muted-foreground">Value (snake_case)</label>
            <input
              value={local.value}
              onChange={(e) => setLocal((p) => ({ ...p, value: e.target.value }))}
              onBlur={() => commit("value", local.value)}
              placeholder="auto_generated"
              className="w-full h-8 px-2 rounded border border-input bg-background text-sm font-mono mt-0.5"
            />
          </div>
          {scoreEnabled && (
            <div className="w-16">
              <label className="text-xs text-muted-foreground">Score</label>
              <input
                type="number"
                value={local.score || 0}
                onChange={(e) => setLocal((p) => ({ ...p, score: Number(e.target.value) }))}
                onBlur={() => commit("score", local.score)}
                className="w-full h-8 px-2 rounded border border-input bg-background text-sm mt-0.5"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={local.is_dq || false}
              onChange={(e) => {
                const updated = { ...option, ...local, is_dq: e.target.checked, dq_type: e.target.checked ? "hard" : null };
                setLocal(updated);
                onUpdate(updated);
              }}
            />
            <span className="text-xs font-medium">Disqualify</span>
          </label>
          {local.is_dq && (
            <div className="flex gap-2">
              {["hard", "soft"].map((dt) => (
                <label key={dt} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    checked={local.dq_type === dt}
                    onChange={() => {
                      const updated = { ...option, ...local, dq_type: dt };
                      setLocal(updated);
                      onUpdate(updated);
                    }}
                  />
                  <span className={`text-xs ${dt === "hard" ? "text-red-600" : "text-amber-600"}`}>{dt} DQ</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(option.option_id)}
        className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all mt-1 flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AnswersTab({ node, quiz, onUpdate }) {
  const scoreEnabled = quiz?.settings?.score_enabled;
  const options = node.answer_options || [];

  const handleUpdate = (updated) => {
    onUpdate({ answer_options: options.map((o) => (o.option_id === updated.option_id ? updated : o)) });
  };

  const handleDelete = (optionId) => {
    onUpdate({ answer_options: options.filter((o) => o.option_id !== optionId) });
  };

  const handleAdd = () => {
    const newOpt = {
      option_id: crypto.randomUUID(),
      label: "",
      value: "",
      is_dq: false,
      dq_type: null,
      score: 0,
      tags_to_add: [],
      tags_to_remove: [],
      custom_field_overrides: {},
    };
    onUpdate({ answer_options: [...options, newOpt] });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(options);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onUpdate({ answer_options: reordered });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Answer Options ({options.length})</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="answers">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {options.map((opt, idx) => (
                <Draggable key={opt.option_id} draggableId={opt.option_id} index={idx}>
                  {(drag) => (
                    <AnswerRow
                      key={opt.option_id}
                      option={opt}
                      idx={idx}
                      scoreEnabled={scoreEnabled}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      draggable={drag}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        <Plus className="w-4 h-4" /> Add Answer
      </button>
    </div>
  );
}