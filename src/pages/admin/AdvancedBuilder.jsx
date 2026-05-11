import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { applyNodeChanges, applyEdgeChanges, addEdge, MarkerType } from "@xyflow/react";
import { ArrowLeft, Eye, Save, CheckCircle2, Clock, ExternalLink, Zap, Sun, Moon, RotateCcw, RotateCw, Bug } from "lucide-react";
import { format } from "date-fns";
import AdvancedCanvas, { bfsLayout } from "@/components/admin/dt/canvas/AdvancedCanvas";
import PreviewModal from "@/components/admin/dt/PreviewModal";
import NodePreviewModal from "@/components/admin/dt/canvas/NodePreviewModal";
import { validateTree } from "@/components/admin/dt/publishValidation";
import { getCategoryForType } from "@/components/admin/dt/canvas/nodeCategories";
import { Loader2 } from "lucide-react";

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

const AUTO_LAYOUT_KEY = "cac_dt_autolayout_done_";
const SHOW_ANSWERS_KEY = "cac_dt_show_answer_values";
const THEME_KEY = "cac_dt_canvas_theme";

function questionsToFlowNodes(questions) {
  return questions.map((q, idx) => ({
    id: q.node_id || q.id,
    type: "decision",
    position: {
      x: q.position_x ?? (idx % 4) * 340 + 100,
      y: q.position_y ?? Math.floor(idx / 4) * 200 + 100,
    },
    data: { ...q, _dbId: q.id },
  }));
}

function edgesToFlowEdges(edges) {
  return edges.map((e) => ({
    id: e.edge_id || e.id,
    source: e.source_node_id,
    target: e.target_node_id,
    sourceHandle: e.source_handle || null,
    targetHandle: e.target_handle || "target-left",
    type: "decision",
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    data: {
      label: e.label,
      style_color: e.style_color,
      source_handle: e.source_handle || null,
      target_is_dq: e.data?.target_is_dq,
      target_is_qualified: e.data?.target_is_qualified,
      ...e,
    },
  }));
}

function resolveEdgeLabel(connection, flowNodes) {
  const src = connection.sourceHandle || "";
  if (!src || src === "source-right") return null;
  const sourceNode = flowNodes.find((n) => n.id === connection.source);
  if (!sourceNode) return null;
  if (src.startsWith("answer-")) {
    const optId = src.replace("answer-", "");
    const option = (sourceNode.data?.answer_options || []).find((o) => o.option_id === optId);
    return option?.label || null;
  }
  if (src.startsWith("path-")) {
    const pathId = src.replace("path-", "");
    if (pathId === "else") return "else";
    const path = (sourceNode.data?.config?.paths || []).find((p) => p.path_id === pathId);
    return path?.title || null;
  }
  if (src === "success") return "success";
  if (src === "failure") return "failure";
  return null;
}

function resolveEdgeTargetMeta(targetNodeId, flowNodes) {
  const target = flowNodes.find((n) => n.id === targetNodeId);
  if (!target) return {};
  const tier = target.data?.config?.qualification_tier;
  return { target_is_dq: tier === "DQ", target_is_qualified: tier && tier !== "DQ" };
}

function cleanNodeData(data) {
  const { _dbId, _connectedHandles, _showAnswerHandles, _isDirty, _darkMode, onEdit, onDuplicate, onDelete, onPreview, ...rest } = data || {};
  return rest;
}

export default function AdvancedBuilder() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [debugMode, setDebugMode] = useState(() => localStorage.getItem("cac_dt_debug_mode") === "1");

  useEffect(() => {
    localStorage.setItem("cac_dt_debug_mode", debugMode ? "1" : "0");
  }, [debugMode]);

  const [flowNodes, setFlowNodes] = useState([]);
  const [flowEdges, setFlowEdges] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [saveStatus, setSaveStatus] = useState("clean"); // clean | saving | saved | dirty | failed
  const [saveError, setSaveError] = useState(null);
  const saveRetryRef = useRef(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewNode, setPreviewNode] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const [publishModal, setPublishModal] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [autoLayoutToast, setAutoLayoutToast] = useState(false);
  // Toolbar state synced from canvas
  const [showAnswers, setShowAnswers] = useState(() => {
    try { const v = localStorage.getItem(SHOW_ANSWERS_KEY); return v === null ? true : v === "true"; } catch { return true; }
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === "dark"; } catch { return false; }
  });

  const saveTimerRef = useRef(null);
  const historyRef = useRef({ past: [], future: [] });

  const { data: quiz, isLoading: loadingQuiz } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => base44.entities.Quiz.filter({ id: quizId }).then((r) => r[0]),
  });

  const { data: dbQuestions = [], isLoading: loadingQ } = useQuery({
    queryKey: ["questions", quizId],
    queryFn: () => base44.entities.Question.filter({ quiz_id: quizId }, "order_index"),
  });

  const { data: dbEdges = [], isLoading: loadingE } = useQuery({
    queryKey: ["edges", quizId],
    queryFn: () => base44.entities.Edge.filter({ quiz_id: quizId }),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["dt-brands"],
    queryFn: () => base44.entities.DecisionTreeBrand.list(),
  });

  // Initialize flow state + auto-layout on first load
  useEffect(() => {
    if (!loadingQ && !loadingE) {
      let nodes = questionsToFlowNodes(dbQuestions);
      const edges = edgesToFlowEdges(dbEdges);
      const layoutKey = AUTO_LAYOUT_KEY + quizId;
      const alreadyDone = localStorage.getItem(layoutKey) === "1";
      if (!alreadyDone && nodes.length > 0) {
        nodes = bfsLayout(nodes, edges);
        localStorage.setItem(layoutKey, "1");
        setAutoLayoutToast(true);
        setTimeout(() => setAutoLayoutToast(false), 4000);
      }
      setFlowNodes(nodes);
      setFlowEdges(edges);
      if (quiz?.title) setTitleVal(quiz.title);
    }
  }, [loadingQ, loadingE]);

  const updateQuizMut = useMutation({
    mutationFn: (data) => base44.entities.Quiz.update(quizId, data),
    onSuccess: () => {
      qc.invalidateQueries(["quiz", quizId]);
      setSavedAt(new Date());
      setPendingSave(false);
    },
  });

  // Before-unload guard
  useEffect(() => {
    const handler = (e) => {
      if (pendingSave || saveStatus === "dirty") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pendingSave, saveStatus]);

  // Save
  const doSave = useCallback(async (nodes, edges) => {
    setSaveStatus("saving");
    setSaveError(null);
    try {
      for (const fn of nodes) {
        const nodeId = fn.id;
        const dbRec = dbQuestions.find((q) => q.node_id === nodeId);
        const payload = { ...cleanNodeData(fn.data), quiz_id: quizId, node_id: nodeId, position_x: fn.position.x, position_y: fn.position.y };
        if (dbRec) await base44.entities.Question.update(dbRec.id, payload);
        else await base44.entities.Question.create(payload);
      }
      const flowNodeIds = new Set(nodes.map((n) => n.id));
      for (const q of dbQuestions) {
        if (!flowNodeIds.has(q.node_id)) await base44.entities.Question.delete(q.id);
      }
      for (const fe of edges) {
        const dbRec = dbEdges.find((e) => e.edge_id === fe.id);
        const payload = {
          quiz_id: quizId, edge_id: fe.id,
          source_node_id: fe.source, target_node_id: fe.target,
          source_handle: fe.sourceHandle || "source-right",
          target_handle: "target-left",
          label: fe.data?.label || "",
          animated: false,
          style_color: fe.data?.style_color || "#94a3b8",
        };
        if (dbRec) await base44.entities.Edge.update(dbRec.id, payload);
        else await base44.entities.Edge.create(payload);
      }
      const flowEdgeIds = new Set(edges.map((e) => e.id));
      for (const e of dbEdges) {
        if (!flowEdgeIds.has(e.edge_id)) await base44.entities.Edge.delete(e.id);
      }
      await base44.entities.Quiz.update(quizId, { total_nodes: nodes.length, total_edges: edges.length });
      qc.invalidateQueries(["questions", quizId]);
      qc.invalidateQueries(["edges", quizId]);
      setSavedAt(new Date());
      setPendingSave(false);
      setSaveStatus("saved");
      saveRetryRef.current = 0;
      setTimeout(() => setSaveStatus("clean"), 3000);
    } catch (err) {
      console.error("Save failed", err);
      setSaveStatus("failed");
      setSaveError(err.message);
    }
  }, [dbQuestions, dbEdges, quizId, qc]);

  const scheduleAutoSave = useCallback((nodes, edges) => {
    setPendingSave(true);
    setSaveStatus("dirty");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(nodes, edges), 3000);
  }, [doSave]);

  const pushHistory = useCallback(() => {
    historyRef.current.past.push({ nodes: flowNodes, edges: flowEdges });
    if (historyRef.current.past.length > 50) historyRef.current.past.shift();
    historyRef.current.future = [];
  }, [flowNodes, flowEdges]);

  // React Flow handlers
  const onNodesChange = useCallback((changes) => {
    setFlowNodes((nds) => {
      const updated = applyNodeChanges(changes, nds);
      scheduleAutoSave(updated, flowEdges);
      return updated;
    });
  }, [flowEdges, scheduleAutoSave]);

  const onEdgesChange = useCallback((changes) => {
    setFlowEdges((eds) => {
      const updated = applyEdgeChanges(changes, eds);
      scheduleAutoSave(flowNodes, updated);
      return updated;
    });
  }, [flowNodes, scheduleAutoSave]);

  const onConnect = useCallback((connection) => {
    pushHistory();
    setFlowEdges((eds) => {
      const label = resolveEdgeLabel(connection, flowNodes);
      const targetMeta = resolveEdgeTargetMeta(connection.target, flowNodes);
      const newEdge = {
        ...connection,
        id: crypto.randomUUID(),
        type: "decision",
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        data: {
          label: label || null,
          source_handle: connection.sourceHandle || null,
          style_color: "#94a3b8",
          ...targetMeta,
        },
      };
      const updated = addEdge(newEdge, eds);
      scheduleAutoSave(flowNodes, updated);
      return updated;
    });
  }, [flowNodes, pushHistory, scheduleAutoSave]);

  const onEdgeDelete = useCallback(() => {
    scheduleAutoSave(flowNodes, flowEdges);
  }, [flowNodes, flowEdges, scheduleAutoSave]);

  const onDropNode = useCallback((nodeType, position) => {
    pushHistory();
    const nodeId = crypto.randomUUID();
    const { typeDef } = getCategoryForType(nodeType);
    const newNode = {
      id: nodeId, type: "decision", position,
      data: {
        node_id: nodeId, quiz_id: quizId, node_type: nodeType, label: typeDef.label,
        title_display: "", required: true,
        answer_options: ["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"].includes(nodeType)
          ? [
              { option_id: crypto.randomUUID(), label: "Option 1", value: "option_1", is_dq: false, score: 0, tags_to_add: [], tags_to_remove: [], custom_field_overrides: {} },
              { option_id: crypto.randomUUID(), label: "Option 2", value: "option_2", is_dq: false, score: 0, tags_to_add: [], tags_to_remove: [], custom_field_overrides: {} },
            ]
          : [],
        custom_field_assignments: [], tags_to_add: [], tags_to_remove: [], scripts: [], validation_rules: [], config: {},
      },
    };
    setFlowNodes((nds) => {
      const updated = [...nds, newNode];
      scheduleAutoSave(updated, flowEdges);
      return updated;
    });
  }, [quizId, flowEdges, pushHistory, scheduleAutoSave]);

  const onDuplicateNode = useCallback((node) => {
    pushHistory();
    const newId = crypto.randomUUID();
    const dup = {
      ...node, id: newId,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: { ...node.data, node_id: newId, label: (node.data.label || "") + " (Copy)" },
    };
    setFlowNodes((nds) => {
      const updated = [...nds, dup];
      scheduleAutoSave(updated, flowEdges);
      return updated;
    });
  }, [flowEdges, pushHistory, scheduleAutoSave]);

  const onDeleteNode = useCallback((nodeId) => {
    pushHistory();
    setFlowNodes((nds) => {
      const updated = nds.filter((n) => n.id !== nodeId);
      setFlowEdges((eds) => {
        const updatedEdges = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
        scheduleAutoSave(updated, updatedEdges);
        return updatedEdges;
      });
      return updated;
    });
  }, [pushHistory, scheduleAutoSave]);

  const onPreviewNode = useCallback((node) => setPreviewNode(node), []);

  // Save node data from the editor modal back into flowNodes
  const onSaveNode = useCallback((updatedData) => {
    const nodeId = updatedData.node_id || updatedData.id;
    setFlowNodes((nds) => {
      const updated = nds.map((n) => {
        if (n.id === nodeId) return { ...n, data: { ...n.data, ...updatedData } };
        return n;
      });
      scheduleAutoSave(updated, flowEdges);
      return updated;
    });
  }, [flowEdges, scheduleAutoSave]);

  // Run auto-layout manually (from Controls button)
  const handleRunAutoLayout = useCallback(() => {
    setFlowNodes((nds) => {
      const relaid = bfsLayout(nds, flowEdges);
      scheduleAutoSave(relaid, flowEdges);
      return relaid;
    });
  }, [flowEdges, scheduleAutoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (!historyRef.current.past.length) return;
        const prev = historyRef.current.past.pop();
        historyRef.current.future.push({ nodes: flowNodes, edges: flowEdges });
        setFlowNodes(prev.nodes); setFlowEdges(prev.edges);
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (!historyRef.current.future.length) return;
        const next = historyRef.current.future.pop();
        historyRef.current.past.push({ nodes: flowNodes, edges: flowEdges });
        setFlowNodes(next.nodes); setFlowEdges(next.edges);
      }
      if (ctrl && e.key === "s") {
        e.preventDefault();
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        doSave(flowNodes, flowEdges);
      }
      if (ctrl && e.key === "p") { e.preventDefault(); setShowPreview(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flowNodes, flowEdges, doSave]);

  // Publish
  const handlePublish = useCallback(async () => {
    const { valid, errors } = validateTree(quiz, dbQuestions, dbEdges);
    if (!valid) { setPublishModal({ errors }); return; }
    const user = await base44.auth.me();
    const newVersion = (quiz?.version || 1) + 1;
    const snapshot = {
      version: newVersion, published_at: new Date().toISOString(),
      published_by: user?.email || "admin", nodes_snapshot: dbQuestions, edges_snapshot: dbEdges,
    };
    await base44.entities.Quiz.update(quizId, {
      status: "published", version: newVersion,
      published_at: snapshot.published_at, published_by: snapshot.published_by,
      version_history: [...(quiz?.version_history || []), snapshot],
    });
    qc.invalidateQueries(["quiz", quizId]);
    setSavedAt(new Date());
  }, [quiz, dbQuestions, dbEdges, quizId, qc]);

  // Toggle helpers (toolbar mirrors canvas state)
  const toggleAnswers = useCallback(() => {
    setShowAnswers((prev) => {
      const next = !prev;
      try { localStorage.setItem(SHOW_ANSWERS_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const toggleDark = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch {}
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (!historyRef.current.past.length) return;
    const prev = historyRef.current.past.pop();
    historyRef.current.future.push({ nodes: flowNodes, edges: flowEdges });
    setFlowNodes(prev.nodes); setFlowEdges(prev.edges);
  }, [flowNodes, flowEdges]);

  const redo = useCallback(() => {
    if (!historyRef.current.future.length) return;
    const next = historyRef.current.future.pop();
    historyRef.current.past.push({ nodes: flowNodes, edges: flowEdges });
    setFlowNodes(next.nodes); setFlowEdges(next.edges);
  }, [flowNodes, flowEdges]);

  if (loadingQuiz || loadingQ || loadingE) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }
  if (!quiz) return <div className="p-8 text-slate-500">Decision tree not found.</div>;

  const brand = brands.find((b) => b.id === quiz.brand_id);

  return (
    <div className={`flex flex-col h-screen overflow-hidden -m-4 sm:-m-6 lg:-m-8 ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Top bar */}
      <div className={`flex items-center gap-2 px-3 h-12 border-b flex-shrink-0 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <button onClick={() => navigate("/admin/decision-trees")} className="p-1.5 rounded hover:bg-slate-100 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>

        <span className={`text-xs hidden sm:block flex-shrink-0 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Trees /</span>

        {editingTitle ? (
          <input autoFocus value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={() => { setEditingTitle(false); if (titleVal !== quiz.title) updateQuizMut.mutate({ title: titleVal }); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            className={`text-sm font-semibold bg-transparent border-b border-blue-500 outline-none px-0 min-w-[120px] ${isDarkMode ? "text-white" : "text-slate-800"}`} />
        ) : (
          <button onClick={() => { setEditingTitle(true); setTitleVal(quiz.title || ""); }}
            className={`text-sm font-semibold hover:text-blue-500 transition-colors truncate max-w-[160px] ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
            {quiz.title}
          </button>
        )}

        {brand && (
          <span className={`hidden sm:inline-flex items-center text-xs px-2 py-0.5 rounded flex-shrink-0 ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
            {brand.brand_name}
          </span>
        )}

        {/* Divider */}
        <div className={`h-5 w-px mx-1 flex-shrink-0 ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`} />

        {/* Canvas controls group */}
        <button
          onClick={toggleAnswers}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${
            showAnswers
              ? "bg-blue-600 text-white"
              : isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title="Toggle answer rows"
        >
          Answers {showAnswers ? "ON" : "OFF"}
        </button>

        <button
          onClick={toggleDark}
          className={`p-1.5 rounded transition-colors flex-shrink-0 ${isDarkMode ? "text-amber-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
          title={isDarkMode ? "Light mode" : "Dark mode"}
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button onClick={undo} title="Undo" className={`p-1.5 rounded transition-colors flex-shrink-0 ${isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"}`}>
          <RotateCcw size={13} />
        </button>
        <button onClick={redo} title="Redo" className={`p-1.5 rounded transition-colors flex-shrink-0 ${isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"}`}>
          <RotateCw size={13} />
        </button>

        <button
          onClick={() => setDebugMode((v) => !v)}
          title="Debug mode"
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${
            debugMode ? "bg-amber-500 text-white" : isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Bug size={12} /> Debug
        </button>

        <div className="flex-1" />

        {/* Right actions */}
        <button onClick={() => setShowPreview(true)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs hover:bg-slate-50 transition-colors flex-shrink-0 ${isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600"}`}>
          <Eye size={13} /> Preview
        </button>

        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/q/${quiz.slug}`); }}
          className={`p-1.5 rounded border transition-colors flex-shrink-0 ${isDarkMode ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          title="Copy public URL">
          <ExternalLink size={13} />
        </button>

        <div className="relative flex-shrink-0">
          <button onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs font-semibold ${STATUS_COLORS[quiz.status] || STATUS_COLORS.draft}`}>
            {quiz.status || "draft"} <span>▾</span>
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 top-9 z-50 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1" onClick={() => setShowStatusMenu(false)}>
              {["draft", "published", "archived"].map((s) => (
                <button key={s} onClick={() => updateQuizMut.mutate({ status: s })}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 capitalize">{s}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Smart save indicator */}
          {saveStatus === "clean" && savedAt && (
            <span className={`flex items-center gap-1 text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              <CheckCircle2 size={11} className="text-emerald-500" /> Saved
            </span>
          )}
          {saveStatus === "dirty" && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Unsaved
            </span>
          )}
          {saveStatus === "saving" && (
            <span className={`flex items-center gap-1 text-xs ${isDarkMode ? "text-blue-400" : "text-blue-500"}`}>
              <Clock size={11} className="animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 size={11} /> Saved
            </span>
          )}
          {saveStatus === "failed" && (
            <button
              onClick={() => doSave(flowNodes, flowEdges)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
              title={saveError || "Save failed"}
            >
              <Save size={11} /> Retry save
            </button>
          )}

          <button
            onClick={() => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); doSave(flowNodes, flowEdges); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs transition-colors ${isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            <Save size={13} /> Save
          </button>
          <button onClick={handlePublish}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors font-semibold">
            <Zap size={13} /> Publish
          </button>
        </div>
      </div>

      {/* Full-width canvas */}
      <div className="flex flex-1 overflow-hidden">
        <AdvancedCanvas
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={() => {}}
          onDropNode={onDropNode}
          onDuplicateNode={onDuplicateNode}
          onDeleteNode={onDeleteNode}
          onEdgeDelete={onEdgeDelete}
          onPreviewNode={onPreviewNode}
          reactFlowInstance={reactFlowInstance}
          setReactFlowInstance={setReactFlowInstance}
          quiz={quiz}
          quizId={quizId}
          brands={brands}
          onUpdateQuiz={(data) => updateQuizMut.mutate(data)}
          onRunAutoLayout={handleRunAutoLayout}
          onSaveNode={onSaveNode}
          onToolbarStateChange={({ showAnswers: sa, isDarkMode: dm }) => {
            setShowAnswers(sa);
            setIsDarkMode(dm);
          }}
        />
      </div>

      {/* Auto-layout toast */}
      {autoLayoutToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl">
          Canvas updated to left-to-right flow. Positions auto-arranged once.
        </div>
      )}

      {/* Full tree preview */}
      {showPreview && (
        <PreviewModal nodes={dbQuestions} quiz={quiz} onClose={() => setShowPreview(false)} />
      )}

      {/* Single node preview */}
      {previewNode && (
        <NodePreviewModal
          node={{ ...previewNode.data, id: previewNode.id }}
          allNodes={flowNodes.map((n) => ({ ...n.data, id: n.id }))}
          allEdges={flowEdges}
          onClose={() => setPreviewNode(null)}
        />
      )}

      {/* Publish validation modal */}
      {publishModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Cannot publish - validation failed</h2>
            <ul className="space-y-1.5">
              {publishModal.errors.map((err, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-2.5">
                  <span className="flex-shrink-0 font-bold">!</span> {err}
                </li>
              ))}
            </ul>
            <button onClick={() => setPublishModal(null)}
              className="w-full py-2 rounded-lg bg-slate-100 text-sm font-medium hover:bg-slate-200 transition-colors">
              Close and Fix Issues
            </button>
          </div>
        </div>
      )}
    </div>
  );
}