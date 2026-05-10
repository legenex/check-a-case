import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { generateDecisionTreePlan } from "@/functions/generateDecisionTreePlan";
import { commitDecisionTreePlan } from "@/functions/commitDecisionTreePlan";
import { Loader2, Wand2, RefreshCw, ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { ReactFlow, Background, Controls, ReactFlowProvider } from "@xyflow/react";
import { getCategoryForType } from "./canvas/nodeCategories";

// ---- Step 1: Inputs ----
function WizardInputs({ inputs, onChange, onGenerate, generating }) {
  const CAMPAIGN_TYPES = ['mva', 'mass_tort', 'workers_comp', 'slip_and_fall', 'med_mal', 'custom'];
  const BRAND_VOICES = ['Empathetic', 'Urgent', 'Professional', 'Casual'];
  const TONE_GOALS = ['Trust-building', 'Conversion-optimized', 'Compliance-first', 'Fast-qualifier'];
  const QUAL_PATHS = ['single_qualified', 'multi_tier', 'dq_only'];

  const { data: brands = [] } = useQuery({
    queryKey: ['dt-brands'],
    queryFn: () => base44.entities.DecisionTreeBrand.list(),
  });

  const toggleTone = (t) => {
    const arr = inputs.tone_goals || [];
    onChange({ tone_goals: arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t] });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Generate a Decision Tree with AI</h2>
        <p className="text-sm text-muted-foreground">Fill in the details below and we will create a complete qualification flow for you.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Campaign Type</label>
          <div className="flex flex-wrap gap-2">
            {CAMPAIGN_TYPES.map((t) => (
              <button key={t} onClick={() => onChange({ campaign_type: t })}
                className={`px-3 py-1.5 rounded-lg border text-sm capitalize transition-all ${inputs.campaign_type === t ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-slate-400'}`}>
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Niche / Sub-vertical</label>
          <input value={inputs.niche || ''} onChange={(e) => onChange({ niche: e.target.value })}
            placeholder="e.g. Auto accidents in Florida, Camp Lejeune water contamination"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Brand Voice</label>
          <div className="flex flex-wrap gap-2">
            {BRAND_VOICES.map((v) => (
              <button key={v} onClick={() => onChange({ brand_voice: v })}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${inputs.brand_voice === v ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-slate-400'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tone Goals</label>
          <div className="flex flex-wrap gap-2">
            {TONE_GOALS.map((t) => {
              const on = (inputs.tone_goals || []).includes(t);
              return (
                <button key={t} onClick={() => toggleTone(t)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${on ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-slate-400'}`}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Target Qualification Path</label>
          <div className="space-y-2">
            {[
              { id: 'single_qualified', label: 'Single qualified path + DQ branching' },
              { id: 'multi_tier', label: 'Multi-tier (T1, T2, T3) + DQ' },
              { id: 'dq_only', label: 'DQ-only filter' },
            ].map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="qual_path" checked={inputs.qualification_path === opt.id} onChange={() => onChange({ qualification_path: opt.id })} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Brand</label>
          <select value={inputs.brand_id || ''} onChange={(e) => onChange({ brand_id: e.target.value })}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">No specific brand</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
          </select>
        </div>

        <details className="rounded-lg border border-border p-3">
          <summary className="text-sm font-medium cursor-pointer">Optional Context</summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Paste existing page copy (optional)</label>
              <textarea value={inputs.context || ''} onChange={(e) => onChange({ context: e.target.value })} rows={4}
                className="w-full px-2 py-1.5 rounded border border-input bg-background text-xs resize-none" />
            </div>
          </div>
        </details>
      </div>

      <button
        onClick={onGenerate}
        disabled={generating || !inputs.campaign_type || !inputs.qualification_path}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: '#0284c7' }}>
        {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating plan...</> : <><Wand2 className="w-5 h-5" /> Generate Plan</>}
      </button>
    </div>
  );
}

// ---- Read-only mini canvas for plan preview ----
function PlanCanvas({ nodes, edges }) {
  const flowNodes = nodes.map((n, idx) => {
    const { cat } = getCategoryForType(n.node_type);
    return {
      id: n.node_id,
      position: { x: n.position_x ?? (idx % 4) * 280 + 40, y: n.position_y ?? Math.floor(idx / 4) * 160 + 40 },
      data: { label: n.label || n.node_type },
      style: {
        background: cat?.color || '#f1f5f9',
        border: `2px solid ${cat?.border || '#cbd5e1'}`,
        borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 600,
      },
    };
  });

  const flowEdges = edges.map((e, i) => ({
    id: `e${i}`,
    source: e.source_node_id,
    target: e.target_node_id,
    animated: true,
  }));

  return (
    <div style={{ height: 400 }} className="rounded-xl border border-border overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          fitView
          proOptions={{ hideAttribution: true }}>
          <Background variant="dots" gap={16} size={1} color="#e2e8f0" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

// ---- Step 2: Plan Preview ----
function WizardPlanPreview({ plan, inputs, onBack, onRegenerate, onCommit, generating, committing }) {
  const [refinement, setRefinement] = useState('');
  const [editedFields, setEditedFields] = useState(plan.new_custom_fields || []);

  return (
    <div className="space-y-6 py-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Plan Preview</h2>
        <p className="text-sm text-muted-foreground">{plan.nodes?.length || 0} nodes, {plan.edges?.length || 0} edges, {(plan.new_custom_fields || []).length} new custom fields</p>
      </div>

      <PlanCanvas nodes={plan.nodes || []} edges={plan.edges || []} />

      {editedFields.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2">New Custom Fields to Create</h3>
          <div className="space-y-2">
            {editedFields.map((cf, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                <input value={cf.field_key} onChange={(e) => {
                  const arr = [...editedFields]; arr[i] = { ...arr[i], field_key: e.target.value };
                  setEditedFields(arr);
                }}
                  className="font-mono text-xs flex-1 bg-transparent border border-input rounded px-2 py-1" />
                <span className="text-xs text-muted-foreground">{cf.display_label}</span>
                <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{cf.field_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input value={refinement} onChange={(e) => setRefinement(e.target.value)}
          placeholder="Refine: e.g. Make it shorter, add medical expense section..."
          className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm" />
        <button onClick={() => onRegenerate(refinement)} disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">
          <ArrowLeft className="w-4 h-4" /> Back to Inputs
        </button>
        <button onClick={() => onCommit({ ...plan, new_custom_fields: editedFields })} disabled={committing}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white font-bold disabled:opacity-50"
          style={{ backgroundColor: '#0284c7' }}>
          {committing ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><CheckCircle2 className="w-4 h-4" /> Commit and Open Builder</>}
        </button>
      </div>
    </div>
  );
}

// ---- Main Wizard ----
export default function AIWizard({ onCreated }) {
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({
    campaign_type: 'mva',
    brand_voice: 'Empathetic',
    tone_goals: ['Trust-building', 'Conversion-optimized'],
    qualification_path: 'multi_tier',
  });
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (refinement) => {
    setGenerating(true);
    setError('');
    try {
      const res = await generateDecisionTreePlan({ inputs, refinement });
      if (res.data?.success) {
        setPlan(res.data.plan);
        setStep(2);
      } else {
        setError(res.data?.error || 'Generation failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCommit = async (finalPlan) => {
    setCommitting(true);
    setError('');
    try {
      const res = await commitDecisionTreePlan({ plan: finalPlan });
      if (res.data?.success) {
        onCreated(res.data.quiz_id);
      } else {
        setError(res.data?.error || 'Commit failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto px-1">
      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {step === 1 && (
        <WizardInputs inputs={inputs} onChange={(p) => setInputs((i) => ({ ...i, ...p }))}
          onGenerate={() => handleGenerate()} generating={generating} />
      )}
      {step === 2 && plan && (
        <WizardPlanPreview
          plan={plan}
          inputs={inputs}
          onBack={() => setStep(1)}
          onRegenerate={(refinement) => handleGenerate(refinement)}
          onCommit={handleCommit}
          generating={generating}
          committing={committing}
        />
      )}
    </div>
  );
}