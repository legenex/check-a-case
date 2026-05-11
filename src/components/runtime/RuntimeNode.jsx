import React, { useState } from "react";
import React, { useEffect } from "react";
import StartPageNode from "./nodes/StartPageNode";
import SingleSelectNode from "./nodes/SingleSelectNode";
import MultiSelectNode from "./nodes/MultiSelectNode";
import TextFieldNode from "./nodes/TextFieldNode";
import FormNode from "./nodes/FormNode";
import PhoneVerifyNode from "./nodes/PhoneVerifyNode";
import ResultsNode from "./nodes/ResultsNode";
import { ArrowRight, Info } from "lucide-react";
import { getFieldKey } from "./nodes/SingleSelectNode";

export default function RuntimeNode({
  node, quiz, brand, fieldValues, runId, sessionId,
  contactForm, onAnswer, onNext, onFail,
}) {
  if (!node) return null;
  const type = node.node_type;
  const nodeId = node.node_id || node.id;
  const customCss = node.config?.custom_css;

  // Inject per-node custom CSS scoped to [data-node-id]
  React.useEffect(() => {
    if (!customCss || !nodeId) return;
    const styleId = `node-css-${nodeId}`;
    let el = document.getElementById(styleId);
    if (!el) { el = document.createElement("style"); el.id = styleId; document.head.appendChild(el); }
    el.textContent = customCss.replace(/([^{]+)\{/g, (m, sel) => `[data-node-id="${nodeId}"] ${sel.trim()} {`);
    return () => { const s = document.getElementById(styleId); if (s) s.remove(); };
  }, [customCss, nodeId]);

  const wrap = (content) => (
    <div data-node-id={nodeId}>{content}</div>
  );

  if (type === 'start_page') {
    return wrap(<StartPageNode node={node} quiz={quiz} brand={brand} onNext={onNext} />);
  }

  if (type === 'single_select') {
    return wrap(<SingleSelectNode node={node} fieldValues={fieldValues} onAnswer={onAnswer} />);
  }

  if (type === 'multiple_choice' || type === 'checkbox_multi_select') {
    return wrap(<MultiSelectNode node={node} fieldValues={fieldValues} onAnswer={onAnswer} />);
  }

  if (type === 'dropdown') {
    return wrap(<DropdownNode node={node} fieldValues={fieldValues} onAnswer={onAnswer} />);
  }

  if (type === 'text_field') {
    return wrap(<TextFieldNode node={node} fieldValues={fieldValues} onAnswer={onAnswer} />);
  }

  if (type === 'text_block' || type === 'information') {
    return wrap(<TextBlockNode node={node} type={type} onNext={onNext} />);
  }

  if (type === 'slider') {
    return wrap(<SliderNode node={node} fieldValues={fieldValues} onAnswer={onAnswer} />);
  }

  if (type === 'date_picker' || type === 'datetime_picker') {
    return wrap(<DatePickerNode node={node} type={type} fieldValues={fieldValues} onAnswer={onAnswer} />);
  }

  if (type === 'address') {
    return wrap(<AddressNode node={node} fieldValues={fieldValues} onAnswer={onAnswer} />);
  }

  if (type === 'form') {
    return wrap(
      <FormNode
        node={node}
        contactForm={contactForm}
        fieldValues={fieldValues}
        runId={runId}
        sessionId={sessionId}
        onSuccess={(data) => onNext(data?.next_node_id)}
        onError={() => {}}
      />
    );
  }

  if (type === 'phone_verification') {
    return wrap(
      <PhoneVerifyNode
        node={node}
        fieldValues={fieldValues}
        runId={runId}
        onNext={onNext}
        onFail={onFail}
      />
    );
  }

  if (type === 'results_page') {
    return wrap(<ResultsNode node={node} fieldValues={fieldValues} />);
  }

  // Fallback
  return wrap(
    <div className="max-w-lg mx-auto px-4 py-12 text-center text-slate-400">
      <p className="text-sm">[Node type: {type}]</p>
      <button onClick={() => onNext(null)}
        className="mt-4 flex items-center gap-2 mx-auto px-6 py-3 rounded-xl text-white text-sm"
        style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}>
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Inline supporting nodes

function DropdownNode({ node, fieldValues, onAnswer }) {
  const key = getFieldKey(node);
  const [val, setVal] = React.useState(fieldValues[key] || '');

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">{node.title_display}</h2>
      {node.help_text && <p className="text-slate-500 mb-4">{node.help_text}</p>}
      <select value={val} onChange={(e) => setVal(e.target.value)}
        className="w-full h-12 px-3 rounded-xl border-2 border-slate-200 text-base mb-4">
        <option value="">Select an option...</option>
        {(node.answer_options || []).map((opt) => (
          <option key={opt.option_id} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        onClick={() => { if (val) onAnswer({ [key]: val }, node.answer_options?.find((o) => o.value === val)); }}
        disabled={!val}
        className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}>
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function TextBlockNode({ node, type, onNext }) {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {type === 'information' && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-blue-50 text-blue-700">
          <Info className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">Important Information</span>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4">{node.title_display}</h2>
      {node.form_html ? (
        <div className="prose prose-slate" dangerouslySetInnerHTML={{ __html: node.form_html }} />
      ) : node.help_text ? (
        <p className="text-slate-600 leading-relaxed">{node.help_text}</p>
      ) : null}
      <button onClick={onNext}
        className="mt-6 flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold"
        style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}>
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function SliderNode({ node, fieldValues, onAnswer }) {
  const key = getFieldKey(node);
  const config = node.config || {};
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const step = config.step ?? 1;
  const [val, setVal] = React.useState(Number(fieldValues[key]) || min);

  const display = `${config.prefix || ''}${val}${config.suffix || ''}`;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-2">{node.title_display}</h2>
      {node.help_text && <p className="text-slate-500 mb-6">{node.help_text}</p>}
      <div className="text-center text-3xl font-black mb-4" style={{ color: 'var(--rt-primary, #0284c7)' }}>
        {display}
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-full h-2 accent-[var(--rt-primary,#0284c7)] mb-6" />
      <div className="flex justify-between text-xs text-slate-400 mb-6">
        <span>{config.prefix}{min}{config.suffix}</span>
        <span>{config.prefix}{max}{config.suffix}</span>
      </div>
      <button onClick={() => onAnswer({ [key]: val }, null)}
        className="w-full py-4 rounded-xl text-white font-bold"
        style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}>
        Continue <ArrowRight className="w-4 h-4 inline ml-1" />
      </button>
    </div>
  );
}

function DatePickerNode({ node, type, fieldValues, onAnswer }) {
  const key = getFieldKey(node);
  const [val, setVal] = React.useState(fieldValues[key] || '');

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-2">{node.title_display}</h2>
      {node.help_text && <p className="text-slate-500 mb-4">{node.help_text}</p>}
      <input type={type === 'datetime_picker' ? 'datetime-local' : 'date'}
        value={val} onChange={(e) => setVal(e.target.value)}
        className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-base mb-4" />
      <button onClick={() => { if (val) onAnswer({ [key]: val }, null); }}
        disabled={!val}
        className="w-full py-4 rounded-xl text-white font-bold disabled:opacity-40"
        style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}>
        Continue <ArrowRight className="w-4 h-4 inline ml-1" />
      </button>
    </div>
  );
}

const STATES_US = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

function AddressNode({ node, fieldValues, onAnswer }) {
  const config = node.config || {};
  const enabled = config.fields_enabled || { street: true, city: true, state: true, zip: true };
  const [vals, setVals] = React.useState({
    street: fieldValues.street || '',
    city: fieldValues.city || '',
    state: fieldValues.state || '',
    zip: fieldValues.zip_code || '',
  });

  const handleNext = () => {
    const updates = {};
    if (enabled.street) updates.street = vals.street;
    if (enabled.city) updates.city = vals.city;
    if (enabled.state) updates.state = vals.state;
    if (enabled.zip) updates.zip_code = vals.zip;
    onAnswer(updates, null);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">{node.title_display}</h2>
      <div className="space-y-3">
        {enabled.street && (
          <input type="text" placeholder="Street Address" value={vals.street}
            onChange={(e) => setVals((v) => ({ ...v, street: e.target.value }))}
            className="w-full h-10 px-3 rounded-lg border border-slate-200" />
        )}
        {(enabled.city || enabled.state) && (
          <div className="grid grid-cols-2 gap-3">
            {enabled.city && (
              <input type="text" placeholder="City" value={vals.city}
                onChange={(e) => setVals((v) => ({ ...v, city: e.target.value }))}
                className="h-10 px-3 rounded-lg border border-slate-200" />
            )}
            {enabled.state && (
              <select value={vals.state} onChange={(e) => setVals((v) => ({ ...v, state: e.target.value }))}
                className="h-10 px-3 rounded-lg border border-slate-200">
                <option value="">State</option>
                {STATES_US.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        )}
        {enabled.zip && (
          <input type="text" placeholder="ZIP Code" value={vals.zip} maxLength={5}
            onChange={(e) => setVals((v) => ({ ...v, zip: e.target.value.replace(/\D/g, '') }))}
            className="w-full h-10 px-3 rounded-lg border border-slate-200" />
        )}
      </div>
      <button onClick={handleNext} className="mt-4 w-full py-4 rounded-xl text-white font-bold"
        style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}>
        Continue <ArrowRight className="w-4 h-4 inline ml-1" />
      </button>
    </div>
  );
}