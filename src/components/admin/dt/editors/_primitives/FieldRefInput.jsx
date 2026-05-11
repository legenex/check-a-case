import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function FieldRefInput({
  value = "",
  onChange,
  quizId,
  multiline = false,
  rows = 3,
  className = "",
  placeholder = "",
}) {
  const ref = useRef(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [query, setQuery] = useState("");

  const { data: customFields = [] } = useQuery({
    queryKey: ["custom-fields-all", quizId],
    queryFn: async () => {
      const global = await base44.entities.CustomField.filter({ scope: "global" }, "display_label", 200);
      const quizScoped = quizId
        ? await base44.entities.CustomField.filter({ scope: "quiz", quiz_id: quizId }, "display_label", 200)
        : [];
      return [...global, ...quizScoped];
    },
    staleTime: 60000,
  });

  const filtered = customFields.filter((f) =>
    !query ||
    f.display_label?.toLowerCase().includes(query.toLowerCase()) ||
    f.field_key?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  function handleKeyDown(e) {
    if (e.key === "{") {
      requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setPopoverPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
        setQuery("");
        setPopoverOpen(true);
      });
      return;
    }
    if (popoverOpen && e.key === "Escape") {
      setPopoverOpen(false);
    }
  }

  function handleInput(e) {
    const v = e.target.value;
    onChange?.(v);
    if (popoverOpen) {
      const caret = e.target.selectionStart;
      const upToCaret = v.slice(0, caret);
      const lastBrace = upToCaret.lastIndexOf("{");
      if (lastBrace === -1) {
        setPopoverOpen(false);
      } else {
        setQuery(upToCaret.slice(lastBrace + 1));
      }
    }
  }

  function insertField(fieldKey) {
    const el = ref.current;
    if (!el) return;
    const v = value || "";
    const caret = el.selectionStart;
    const upToCaret = v.slice(0, caret);
    const lastBrace = upToCaret.lastIndexOf("{");
    if (lastBrace === -1) { setPopoverOpen(false); return; }
    const before = v.slice(0, lastBrace);
    const after = v.slice(caret);
    const inserted = `{${fieldKey}}`;
    onChange?.(before + inserted + after);
    setPopoverOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      const newPos = before.length + inserted.length;
      el.setSelectionRange(newPos, newPos);
    });
  }

  const Component = multiline ? "textarea" : "input";

  return (
    <>
      <Component
        ref={ref}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setPopoverOpen(false), 200)}
        rows={multiline ? rows : undefined}
        placeholder={placeholder}
        className={className}
      />
      {popoverOpen && filtered.length > 0 && (
        <div
          style={{ position: "fixed", top: popoverPos.top, left: popoverPos.left, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[280px] max-h-64 overflow-y-auto"
        >
          {filtered.map((f) => (
            <button
              key={f.id}
              type="button"
              className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-sm flex items-center justify-between gap-2"
              onMouseDown={(e) => { e.preventDefault(); insertField(f.field_key); }}
            >
              <span className="font-medium text-slate-800 truncate">{f.display_label}</span>
              <span className="text-[10px] font-mono text-slate-500 truncate">{f.field_key}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}