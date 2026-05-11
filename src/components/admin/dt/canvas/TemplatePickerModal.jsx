import React, { useState, useEffect } from "react";
import { X, LayoutGrid } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { BUILT_IN_TEMPLATES } from "./decisionTreeTemplates";
import { ACCENT_HEX } from "./nodeTypes";

const ICON_MAP = {
  Zap: () => <div>⚡</div>,
  Phone: () => <div>📞</div>,
  AlertTriangle: () => <div>⚠️</div>,
  FileCheck2: () => <div>✓</div>,
};

function TemplateCard({ tpl, isLight, onClick }) {
  const IconComponent = ICON_MAP[tpl.icon];
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-all hover:scale-[1.02] ${
        isLight
          ? "bg-white border-slate-200 hover:border-slate-400 hover:shadow-md"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/60"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg"
          style={{
            background: `linear-gradient(135deg, ${ACCENT_HEX[tpl.accent]}, ${ACCENT_HEX[tpl.accent]}cc)`,
          }}
        >
          {IconComponent ? <IconComponent /> : "•"}
        </div>
        <div
          className={`text-[10px] uppercase tracking-wider font-semibold ${
            isLight ? "text-slate-500" : "text-zinc-500"
          }`}
        >
          {tpl.campaign_type || "Custom"}
        </div>
      </div>
      <div
        className={`text-base font-semibold mb-1 ${
          isLight ? "text-slate-900" : "text-zinc-100"
        }`}
      >
        {tpl.name}
      </div>
      <div
        className={`text-xs leading-snug mb-3 ${
          isLight ? "text-slate-500" : "text-zinc-400"
        }`}
      >
        {tpl.description}
      </div>
      <div
        className={`text-[11px] font-mono ${
          isLight ? "text-slate-500" : "text-zinc-500"
        }`}
      >
        {tpl.nodes?.length || 0} nodes · {tpl.edges?.length || 0} connections
      </div>
    </button>
  );
}

export default function TemplatePickerModal({
  open,
  onClose,
  onUseTemplate,
  isLight,
}) {
  const [userTemplates, setUserTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    base44.entities.Quiz.filter({ is_template: true })
      .then(async (quizzes) => {
        // Load node/edge counts for each user template
        const enhanced = await Promise.all(
          quizzes.map(async (quiz) => {
            const questions = await base44.entities.Question.filter(
              { quiz_id: quiz.id },
              null,
              1000
            );
            const edges = await base44.entities.Edge.filter(
              { quiz_id: quiz.id },
              null,
              1000
            );
            return {
              ...quiz,
              nodes: questions,
              edges: edges,
            };
          })
        );
        setUserTemplates(enhanced);
      })
      .catch((err) => console.error("Failed to load user templates:", err))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const chromeBg = isLight ? "rgba(252,251,248,0.98)" : "rgba(20,20,24,0.98)";
  const borderColor = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)";
  const textPrimary = isLight ? "#1e293b" : "#e2e8f0";
  const textSecondary = isLight ? "#64748b" : "#94a3b8";

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl overflow-hidden max-w-[720px] w-full mx-4 max-h-[90vh] flex flex-col"
        style={{ background: chromeBg, border: `1px solid ${borderColor}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor }}>
          <h2
            className="text-xl font-semibold"
            style={{ color: textPrimary }}
          >
            Choose a template
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            style={{ color: textSecondary }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Starter Templates */}
          <section>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: textSecondary }}
            >
              Starter Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BUILT_IN_TEMPLATES.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  isLight={isLight}
                  onClick={() => onUseTemplate(tpl)}
                />
              ))}
            </div>
          </section>

          {/* User Templates */}
          <section>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: textSecondary }}
            >
              Your Templates
            </h3>
            {loading ? (
              <div
                className="text-center py-8"
                style={{ color: textSecondary }}
              >
                Loading...
              </div>
            ) : userTemplates.length === 0 ? (
              <div
                className="rounded-xl border p-6 text-center"
                style={{
                  borderColor,
                  background: isLight
                    ? "rgba(241,245,249,0.5)"
                    : "rgba(255,255,255,0.03)",
                }}
              >
                <LayoutGrid
                  size={32}
                  className="mx-auto mb-3 opacity-40"
                  style={{ color: textSecondary }}
                />
                <p style={{ color: textSecondary }} className="text-sm">
                  No saved templates yet. Open any tree and toggle "Save as
                  template" to add one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userTemplates.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    tpl={{
                      id: tpl.id,
                      name: tpl.title,
                      description: tpl.description || "User template",
                      icon: "LayoutGrid",
                      accent: "indigo",
                      campaign_type: tpl.campaign_type || "custom",
                      nodes: tpl.nodes || [],
                      edges: tpl.edges || [],
                    }}
                    isLight={isLight}
                    onClick={() => onUseTemplate(tpl)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}