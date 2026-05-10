import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft } from "lucide-react";
import RuntimeShell from "@/components/runtime/RuntimeShell";
import RuntimeProgressBar from "@/components/runtime/RuntimeProgressBar";
import RuntimeNode from "@/components/runtime/RuntimeNode";
import { resolveBrand, buildBrandCss } from "@/lib/resolveBrand";
import { buildGraph, getNextNodeId, evaluateDecisionNode, getProgressRatio } from "@/lib/decisionTreeRuntime";
import { captureAttribution, getAttribution } from "@/lib/attribution";
import { executeWebhookNode } from "@/functions/executeWebhookNode";
import { sendNotificationSms } from "@/functions/sendNotificationSms";
import { sendNotificationEmail } from "@/functions/sendNotificationEmail";

const NON_BLOCKING_TYPES = new Set([
  'notification_sms', 'notification_email', 'notification_whatsapp',
  'notification_messenger', 'notification_telegram', 'transition', 'decision_node',
]);

export default function DecisionTreeRunner({ slug, previewMode, replayMode, replayRunId }) {
  const [phase, setPhase] = useState('loading');
  const [quiz, setQuiz] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [brand, setBrand] = useState(null);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [tags, setTags] = useState([]);
  const [pathTaken, setPathTaken] = useState([]);
  const [runId, setRunId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [contactForms, setContactForms] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const graphRef = useRef({ nodeMap: {}, adjacency: {} });
  const runRef = useRef(null);
  const activityRef = useRef(Date.now());

  // Boot sequence - store in ref so session timeout can call it
  const bootFnRef = useRef(null);
  useEffect(() => {
    bootFnRef.current = boot;
  });

  useEffect(() => {
    boot();
  }, [slug]);

  // Session timeout check
  useEffect(() => {
    if (!quiz) return;
    const timeoutMin = quiz.settings?.session_timeout_minutes ?? 60;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - activityRef.current) / 1000 / 60;
      if (elapsed > timeoutMin && runRef.current && !runRef.current.is_complete) {
        // Mark abandoned and restart
        base44.entities.DecisionTreeRun.update(runRef.current.id, {
          abandoned_at_node_id: currentNodeId,
          last_activity_at: new Date().toISOString(),
        }).catch(() => {});
        setFieldValues({});
        setTags([]);
        setPathTaken([]);
        runRef.current = null;
        setRunId(null);
        if (bootFnRef.current) bootFnRef.current();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [quiz, currentNodeId]);

  const boot = async () => {
    setPhase('loading');
    try {
      if (!replayMode) captureAttribution();

      // 1. Fetch quiz
      const quizzes = await base44.entities.Quiz.filter({ slug });
      const q = quizzes.find((x) => x.status === 'published' || previewMode);
      if (!q) { setPhase('not_found'); return; }
      setQuiz(q);

      // 2. Fetch nodes + edges
      const [allNodes, allEdges, allBrands] = await Promise.all([
        base44.entities.Question.filter({ quiz_id: q.id }),
        base44.entities.Edge.filter({ quiz_id: q.id }),
        base44.entities.DecisionTreeBrand.list(),
      ]);
      setNodes(allNodes);
      setEdges(allEdges);

      const graph = buildGraph(allNodes, allEdges);
      graphRef.current = graph;

      // 3. Attribution
      const attribution = getAttribution();
      const urlParams = new URLSearchParams(window.location.search);

      // 4. Session ID
      let sid = localStorage.getItem('cac_session_id');
      if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem('cac_session_id', sid);
      }
      setSessionId(sid);

      // 5. Resolve brand
      const resolvedBrand = resolveBrand(allBrands, {
        host: window.location.host,
        params: urlParams,
        referrer: document.referrer,
        quizBrandId: q.brand_id,
      });
      setBrand(resolvedBrand);

      // 6. Brand CSS injection
      if (resolvedBrand) {
        const css = buildBrandCss(resolvedBrand, q.branding_overrides || {});
        if (css) {
          let styleEl = document.getElementById('brand-css');
          if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'brand-css'; document.head.appendChild(styleEl); }
          styleEl.textContent = css;
        }
      }

      // 7. Find or create run
      // Replay mode: load the specific run, apply its field values, and walk the path
      if (replayMode && replayRunId) {
        const replayRuns = await base44.entities.DecisionTreeRun.filter({ id: replayRunId });
        const replayRun = replayRuns[0];
        if (replayRun) {
          setFieldValues(replayRun.field_values || {});
          setTags(replayRun.tags || []);
          setPathTaken(replayRun.path_taken || []);
          runRef.current = { ...replayRun, _replay: true };
          setRunId(replayRun.id);
          const startNode = graph.nodeMap[replayRun.path_taken?.[0]?.node_id] || findStartNode(allNodes);
          if (startNode) {
            setCurrentNodeId(startNode.node_id || startNode.id);
            setPhase('running');
          } else {
            setPhase('not_found');
          }
          return;
        }
      }

      const timeoutMin = q.settings?.session_timeout_minutes ?? 60;
      const cutoff = new Date(Date.now() - timeoutMin * 60 * 1000).toISOString();
      const existingRuns = await base44.entities.DecisionTreeRun.filter({ quiz_id: q.id, session_id: sid, is_complete: false });
      let run = existingRuns.find((r) => r.last_activity_at && r.last_activity_at > cutoff);

      if (run && q.settings?.save_partial_leads) {
        // Resume
        setFieldValues(run.field_values || {});
        setTags(run.tags || []);
        setPathTaken(run.path_taken || []);
        runRef.current = run;
        setRunId(run.id);

        const startNode = run.current_node_id
          ? graph.nodeMap[run.current_node_id]
          : findStartNode(allNodes);
        if (startNode) {
          setCurrentNodeId(startNode.node_id || startNode.id);
          setPhase('running');
        } else {
          setPhase('not_found');
        }
        return;
      }

      // New run
      const newRun = await base44.entities.DecisionTreeRun.create({
        quiz_id: q.id,
        session_id: sid,
        brand_id: resolvedBrand?.id || q.brand_id || '',
        field_values: {
          ...Object.fromEntries(urlParams.entries()),
          brand_key: resolvedBrand?.brand_key || '',
          landing_url: window.location.href,
          referrer: document.referrer,
          ...attribution,
        },
        tags: [],
        path_taken: [],
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        is_complete: false,
        version_at_run: q.version || 1,
        utm_source: attribution.utm_source || urlParams.get('utm_source') || '',
        utm_medium: attribution.utm_medium || urlParams.get('utm_medium') || '',
        utm_campaign: attribution.utm_campaign || urlParams.get('utm_campaign') || '',
        utm_content: urlParams.get('utm_content') || '',
        utm_term: urlParams.get('utm_term') || '',
        referrer: document.referrer,
        landing_url: window.location.href,
        fbclid: urlParams.get('fbclid') || '',
        gclid: urlParams.get('gclid') || '',
        ttclid: urlParams.get('ttclid') || '',
      });

      // Increment total_starts
      await base44.entities.Quiz.update(q.id, { total_starts: (q.total_starts || 0) + 1 });

      runRef.current = newRun;
      setRunId(newRun.id);

      const startNode = findStartNode(allNodes);
      if (!startNode) { setPhase('not_found'); return; }

      setCurrentNodeId(startNode.node_id || startNode.id);
      setPhase('running');
    } catch (err) {
      console.error('Boot error:', err);
      setErrorMsg(err.message);
      setPhase('error');
    }
  };

  const findStartNode = (allNodes) => {
    return allNodes.find((n) => n.node_type === 'start_page') || allNodes[0] || null;
  };

  const persistProgress = useCallback(async (nodeId, newFieldValues, newTags, newPath) => {
    activityRef.current = Date.now();
    if (!runId) return;
    try {
      await base44.entities.DecisionTreeRun.update(runId, {
        current_node_id: nodeId,
        field_values: newFieldValues,
        tags: newTags,
        path_taken: newPath,
        last_activity_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Persist error:', err.message);
    }
  }, [runId]);

  const advanceToNode = useCallback(async (nextNodeId, currentFV, currentTags, currentPath) => {
    if (!nextNodeId) {
      setPhase('completed');
      return;
    }

    const { nodeMap, adjacency } = graphRef.current;
    const next = nodeMap[nextNodeId];
    if (!next) { setPhase('completed'); return; }

    const nodeType = next.node_type;
    const newPath = [...currentPath, { node_id: nextNodeId, entered_at: new Date().toISOString() }];

    // Apply tags
    const newTags = [...currentTags, ...(next.tags_to_add || [])].filter((t) => !(next.tags_to_remove || []).includes(t));

    // Persist
    await persistProgress(nextNodeId, currentFV, newTags, newPath);

    setFieldValues(currentFV);
    setTags(newTags);
    setPathTaken(newPath);

    // Handle non-blocking / pass-through nodes
    if (nodeType === 'transition') {
      const nid = getNextNodeId(nextNodeId, adjacency);
      await advanceToNode(nid, currentFV, newTags, newPath);
      return;
    }

    if (nodeType === 'decision_node') {
      const targetId = evaluateDecisionNode(next.config || {}, currentFV, newTags);
      await advanceToNode(targetId, currentFV, newTags, newPath);
      return;
    }

    if (nodeType === 'notification_sms') {
      sendNotificationSms({ runId, nodeId: next.id }).catch(() => {});
      const nid = getNextNodeId(nextNodeId, adjacency);
      await advanceToNode(nid, currentFV, newTags, newPath);
      return;
    }

    if (nodeType === 'notification_email') {
      sendNotificationEmail({ runId, nodeId: next.id }).catch(() => {});
      const nid = getNextNodeId(nextNodeId, adjacency);
      await advanceToNode(nid, currentFV, newTags, newPath);
      return;
    }

    if (['notification_whatsapp', 'notification_messenger', 'notification_telegram'].includes(nodeType)) {
      // Fire and forget
      const nid = getNextNodeId(nextNodeId, adjacency);
      await advanceToNode(nid, currentFV, newTags, newPath);
      return;
    }

    if (nodeType === 'webhook_api') {
      setPhase('submitting');
      try {
        const res = await executeWebhookNode({ runId, nodeId: next.id });
        const nextId = res.data?.next_node_id || getNextNodeId(nextNodeId, adjacency);
        setPhase('running');
        await advanceToNode(nextId, currentFV, newTags, newPath);
      } catch {
        const nid = getNextNodeId(nextNodeId, adjacency);
        setPhase('running');
        await advanceToNode(nid, currentFV, newTags, newPath);
      }
      return;
    }

    if (nodeType === 'results_page') {
      // Complete run
      const tier = next.config?.qualification_tier || null;
      await base44.entities.DecisionTreeRun.update(runId, {
        is_complete: true,
        is_qualified: tier && tier !== 'DQ',
        is_disqualified: tier === 'DQ',
        qualification_tier: tier,
        completed_at: new Date().toISOString(),
        current_node_id: nextNodeId,
      });
      await base44.entities.Quiz.update(quiz.id, {
        total_completes: (quiz.total_completes || 0) + 1,
      });
    }

    // Load contact form if needed
    if (nodeType === 'form' && next.contact_form_id && !contactForms[next.contact_form_id]) {
      const forms = await base44.entities.ContactForm.filter({ id: next.contact_form_id });
      if (forms[0]) setContactForms((cf) => ({ ...cf, [next.contact_form_id]: forms[0] }));
    }

    setCurrentNodeId(nextNodeId);
  }, [quiz, runId, persistProgress, contactForms]);

  const handleAnswer = useCallback((answerValues, selectedOption) => {
    const { adjacency } = graphRef.current;

    // Merge field values
    const newFV = { ...fieldValues, ...answerValues };

    // Handle DQ
    if (selectedOption?.is_dq) {
      const dqType = selectedOption.dq_type;
      const dqPath = dqType === 'hard'
        ? (quiz?.settings?.dq_redirect_hard || '/Sorry')
        : (quiz?.settings?.dq_redirect_soft || '/Thanks');

      if (dqPath.startsWith('/q/') || dqPath.startsWith('http')) {
        window.location.href = dqPath;
        return;
      }
      // Find a DQ results node or just redirect
      base44.entities.DecisionTreeRun.update(runId, {
        is_disqualified: true, is_complete: true,
        field_values: newFV, completed_at: new Date().toISOString(),
      }).catch(() => {});
      window.location.href = dqPath;
      return;
    }

    // Get next edge
    const nextId = getNextNodeId(currentNodeId, adjacency);
    advanceToNode(nextId, newFV, tags, pathTaken);
  }, [fieldValues, tags, pathTaken, currentNodeId, quiz, runId, advanceToNode]);

  const handleNext = useCallback((explicitNextId) => {
    const { adjacency } = graphRef.current;
    const nextId = explicitNextId || getNextNodeId(currentNodeId, adjacency);
    advanceToNode(nextId, fieldValues, tags, pathTaken);
  }, [currentNodeId, fieldValues, tags, pathTaken, advanceToNode]);

  const handleBack = useCallback(() => {
    if (pathTaken.length < 2) return;
    const newPath = pathTaken.slice(0, -1);
    const prev = newPath[newPath.length - 1];
    if (!prev) return;
    setPathTaken(newPath);
    setCurrentNodeId(prev.node_id);
    persistProgress(prev.node_id, fieldValues, tags, newPath);
  }, [pathTaken, fieldValues, tags, persistProgress]);

  // Render
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (phase === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 mb-2">Quiz not found</h1>
          <p className="text-slate-400">This link may be inactive or the URL may be incorrect.</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
          <p className="text-slate-500 text-sm">{errorMsg}</p>
          <button onClick={() => boot()} className="mt-4 px-6 py-2 rounded-lg bg-slate-100 text-sm">Try Again</button>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">Processing...</p>
        </div>
      </div>
    );
  }

  const { nodeMap, adjacency } = graphRef.current;
  const currentNode = nodeMap[currentNodeId] || nodes.find((n) => (n.node_id || n.id) === currentNodeId);
  const showProgress = quiz?.settings?.progress_bar !== false;
  const showBack = quiz?.settings?.show_back_button !== false;
  const isStart = currentNode?.node_type === 'start_page';
  const isResults = currentNode?.node_type === 'results_page';
  const progressRatio = getProgressRatio(pathTaken, nodes);
  const activeContactForm = currentNode?.contact_form_id ? contactForms[currentNode.contact_form_id] : null;

  return (
    <RuntimeShell brand={brand} quizOverrides={quiz?.branding_overrides || {}}>
      {previewMode && (
        <div className="bg-amber-500 text-amber-900 text-center text-xs py-1.5 font-semibold">
          Preview Mode - not tracking analytics
        </div>
      )}

      {showProgress && !isStart && !isResults && (
        <RuntimeProgressBar ratio={progressRatio} />
      )}

      <div className="flex-1 flex flex-col">
        {showBack && !isStart && !isResults && pathTaken.length > 1 && (
          <div className="px-4 pt-4">
            <button onClick={handleBack}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center py-4">
          {currentNode ? (
            <RuntimeNode
              node={currentNode}
              quiz={quiz}
              brand={brand}
              fieldValues={fieldValues}
              runId={runId}
              sessionId={sessionId}
              contactForm={activeContactForm}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onFail={(nextId) => handleNext(nextId)}
            />
          ) : (
            <div className="text-center text-slate-400 p-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading...</p>
            </div>
          )}
        </div>
      </div>
    </RuntimeShell>
  );
}