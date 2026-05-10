import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import { ArrowLeft, Eye, Save, CheckCircle2, Clock, ExternalLink, Zap } from "lucide-react";
import { format } from "date-fns";
import AdvancedCanvas from "@/components/admin/dt/canvas/AdvancedCanvas";
import NodeInspectorPanel from "@/components/admin/dt/inspector/NodeInspectorPanel";
import TreeInspectorPanel from "@/components/admin/dt/inspector/TreeInspectorPanel";
import PreviewModal from "@/components/admin/dt/PreviewModal";
import { validateTree } from "@/components/admin/dt/publishValidation";
import { getCategoryForType } from "@/components/admin/dt/canvas/nodeCategories";
import { Loader2 } from "lucide-react";

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

function questionsToFlowNodes(questions) {
  return questions.map((q, idx) => ({
    id: q.node_id || q.id,
    type: "decision",
    position: {
      x: q.position_x ?? (idx % 4) * 320 + 40,
      y: q.position_y ?? Math.floor(idx / 4) * 220 + 40,
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
    targetHandle: e.target_handle || null,
    type: "decision",
    animated: e.animated ?? true,
    data: { label: e.label, style_color: e.style_color, ...e },
  }));
}

export default function AdvancedBuilder() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [flowNodes, setFlowNodes] = useState([]);
  const [flowEdges, setFlowEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const [publishModal, setPublishModal] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
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

  // Initialize flow state from DB
  useEffect(() => {
    if (!loadingQ && !loadingE && dbQuestions.length >= 0) {
      setFlowNodes(questionsToFlowNodes(dbQuestions));
      setFlowEdges(edgesToFlowEdges(dbEdges));
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

  // ---- Save logic ----
  const doSave = useCallback(async (nodes, edges) => {
    try {
      // Upsert questions
      const existingIds = new Set(dbQuestions.map((q) => q.node_id));
      for (const fn of nodes) {
        const nodeId = fn.id;
        const dbRec = dbQuestions.find((q) => q.node_id === nodeId);
        const payload = {
          ...fn.data,
          quiz_id: quizId,
          node_id: nodeId,
          position_x: fn.position.x,
          position_y: fn.position.y,
          _dbId: undefined,
          onEdit: undefined, onDuplicate: undefined, onDelete: undefined,
        };
        delete payload._dbId;
        delete payload.onEdit;
        delete payload.onDuplicate;
        delete payload.onDelete;
        if (dbRec) {
          await base44.entities.Question.update(dbRec.id, payload);
        } else {
          await base44.entities.Question.create(payload);
        }
      }
      // Delete removed questions
      const flowNodeIds = new Set(nodes.map((n) => n.id));
      for (const q of dbQuestions) {
        if (!flowNodeIds.has(q.node_id)) await base44.entities.Question.delete(q.id);
      }
      // Upsert edges
      const existingEdgeIds = new Set(dbEdges.map((e) => e.edge_id));
      for (const fe of edges) {
        const edgeId = fe.id;
        const dbRec = dbEdges.find((e) => e.edge_id === edgeId);
        const payload = {
          quiz_id: quizId,
          edge_id: edgeId,
          source_node_id: fe.source,
          target_node_id: fe.target,
          source_handle: fe.sourceHandle || "default",
          target_handle: fe.targetHandle || "default",
          label: fe.data?.label || "",
          animated: fe.animated ?? true,
          style_color: fe.data?.style_color || "#94a3b8",
        };
        if (dbRec) {
          await base44.entities.Edge.update(dbRec.id, payload);
        } else {
          await base44.entities.Edge.create(payload);
        }
      }
      // Delete removed edges
      const flowEdgeIds = new Set(edges.map((e) => e.id));
      for (const e of dbEdges) {
        if (!flowEdgeIds.has(e.edge_id)) await base44.entities.Edge.delete(e.id);
      }
      // Update counts
      await base44.entities.Quiz.update(quizId, {
        total_nodes: nodes.length,
        total_edges: edges.length,
      });
      qc.invalidateQueries(["questions", quizId]);
      qc.invalidateQueries(["edges", quizId]);
      setSavedAt(new Date());
      setPendingSave(false);
    } catch (err) {
      console.error("Save failed", err);
    }
  }, [dbQuestions, dbEdges, quizId, qc]);

  const scheduleAutoSave = useCallback((nodes, edges) => {
    setPendingSave(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(nodes, edges), 5000);
  }, [doSave]);

  const pushHistory = useCallback(() => {
    historyRef.current.past.push({ nodes: flowNodes, edges: flowEdges });
    if (historyRef.current.past.length > 50) historyRef.current.past.shift();
    historyRef.current.future = [];
  }, [flowNodes, flowEdges]);

  // ---- React Flow handlers ----
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
      const updated = addEdge({ ...connection, id: crypto.randomUUID(), type: "decision", animated: true }, eds);
      scheduleAutoSave(flowNodes, updated);
      return updated;
    });
  }, [flowNodes, pushHistory, scheduleAutoSave]);

  const onDropNode = useCallback((nodeType, position) => {
    pushHistory();
    const nodeId = crypto.randomUUID();
    const { typeDef } = getCategoryForType(nodeType);
    const newNode = {
      id: nodeId,
      type: "decision",
      position,
      data: {
        node_id: nodeId,
        quiz_id: quizId,
        node_type: nodeType,
        label: typeDef.label,
        title_display: "",
        required: true,
        answer_options: ["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"].includes(nodeType)
          ? [
              { option_id: crypto.randomUUID(), label: "Option 1", value: "option_1", is_dq: false, score: 0, tags_to_add: [], tags_to_remove: [], custom_field_overrides: {} },
              { option_id: crypto.randomUUID(), label: "Option 2", value: "option_2", is_dq: false, score: 0, tags_to_add: [], tags_to_remove: [], custom_field_overrides: {} },
            ]
          : [],
        custom_field_assignments: [],
        tags_to_add: [],
        tags_to_remove: [],
        scripts: [],
        validation_rules: [],
        config: {},
      },
    };
    setFlowNodes((nds) => {
      const updated = [...nds, newNode];
      scheduleAutoSave(updated, flowEdges);
      return updated;
    });
    setSelectedNodeId(nodeId);
  }, [quizId, flowEdges, pushHistory, scheduleAutoSave]);

  const onDuplicateNode = useCallback((node) => {
    pushHistory();
    const newId = crypto.randomUUID();
    const dup = {
      ...node,
      id: newId,
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
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [selectedNodeId, pushHistory, scheduleAutoSave]);

  const onNodeClick = useCallback((node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // ---- Node data update (inspector changes) ----
  const onUpdateNodeData = useCallback((patch) => {
    setFlowNodes((nds) => {
      const updated = nds.map((n) =>
        n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n
      );
      scheduleAutoSave(updated, flowEdges);
      return updated;
    });
  }, [selectedNodeId, flowEdges, scheduleAutoSave]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (historyRef.current.past.length === 0) return;
        const prev = historyRef.current.past.pop();
        historyRef.current.future.push({ nodes: flowNodes, edges: flowEdges });
        setFlowNodes(prev.nodes);
        setFlowEdges(prev.edges);
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (historyRef.current.future.length === 0) return;
        const next = historyRef.current.future.pop();
        historyRef.current.past.push({ nodes: flowNodes, edges: flowEdges });
        setFlowNodes(next.nodes);
        setFlowEdges(next.edges);
      }
      if (ctrl && e.key === "s") {
        e.preventDefault();
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        doSave(flowNodes, flowEdges);
      }
      if (ctrl && e.key === "p") {
        e.preventDefault();
        setShowPreview(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flowNodes, flowEdges, doSave]);

  // ---- Publish ----
  const handlePublish = useCallback(async () => {
    const { valid, errors } = validateTree(quiz, dbQuestions, dbEdges);
    if (!valid) {
      setPublishModal({ errors });
      return;
    }
    const user = await base44.auth.me();
    const newVersion = (quiz?.version || 1) + 1;
    const snapshot = {
      version: newVersion,
      published_at: new Date().toISOString(),
      published_by: user?.email || "admin",
      nodes_snapshot: dbQuestions,
      edges_snapshot: dbEdges,
    };
    const history = [...(quiz?.version_history || []), snapshot];
    await base44.entities.Quiz.update(quizId, {
      status: "published",
      version: newVersion,
      published_at: snapshot.published_at,
      published_by: snapshot.published_by,
      version_history: history,
    });
    qc.invalidateQueries(["quiz", quizId]);
    setSavedAt(new Date());
  }, [quiz, dbQuestions, dbEdges, quizId, qc]);

  const selectedFlowNode = flowNodes.find((n) => n.id === selectedNodeId);
  const selectedNodeData = selectedFlowNode ? { ...selectedFlowNode.data, id: selectedFlowNode.id } : null;

  if (loadingQuiz || loadingQ || loadingE) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!quiz) return <div className="p-8 text-slate-500">Decision tree not found.</div>;

  const brand = brands.find((b) => b.id === quiz.brand_id);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 h-14 bg-white border-b border-slate-200 flex-shrink-0 min-w-0">
        <button onClick={() => navigate("/admin/decision-trees")} className="p-1.5 rounded hover:bg-slate-100 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>

        <span className="text-sm text-slate-400 hidden sm:block flex-shrink-0">Decision Trees /</span>

        {editingTitle ? (
          <input autoFocus value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={() => { setEditingTitle(false); if (titleVal !== quiz.title) updateQuizMut.mutate({ title: titleVal }); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            className="text-sm font-semibold bg-transparent border-b border-blue-500 outline-none px-0 min-w-[120px]" />
        ) : (
          <button onClick={() => { setEditingTitle(true); setTitleVal(quiz.title || ""); }}
            className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate max-w-[180px]">
            {quiz.title}
          </button>
        )}

        {brand && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex-shrink-0">
            {brand.brand_name}
          </span>
        )}

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 ml-2 flex-shrink-0">
          <button onClick={() => navigate(`/admin/decision-trees/${quizId}/edit`)}
            className="px-2.5 py-1 text-xs text-slate-500 rounded-md hover:bg-white transition-colors">
            Basic
          </button>
          <span className="px-2.5 py-1 text-xs font-semibold bg-white rounded-md shadow-sm text-slate-800">
            Advanced
          </span>
        </div>

        <div className="flex-1" />

        <button onClick={() => setShowPreview(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 transition-colors flex-shrink-0">
          <Eye className="w-4 h-4" /> Preview
        </button>

        <button onClick={() => {
          const url = `${window.location.origin}/q/${quiz.slug}`;
          navigator.clipboard.writeText(url);
        }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 transition-colors flex-shrink-0">
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Status */}
        <div className="relative flex-shrink-0">
          <button onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${STATUS_COLORS[quiz.status] || STATUS_COLORS.draft}`}>
            {quiz.status || "draft"} <span>▾</span>
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 top-10 z-50 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1" onClick={() => setShowStatusMenu(false)}>
              {["draft","published","archived"].map((s) => (
                <button key={s} onClick={() => updateQuizMut.mutate({ status: s })}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 capitalize transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {pendingSave ? (
            <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3" /> Unsaved</span>
          ) : savedAt ? (
            <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" /> {format(savedAt, "HH:mm:ss")}</span>
          ) : null}
          <button onClick={() => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); doSave(flowNodes, flowEdges); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 transition-colors">
            <Save className="w-4 h-4" /> Save
          </button>
          <button onClick={handlePublish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">
            <Zap className="w-4 h-4" /> Publish
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <AdvancedCanvas
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDropNode={onDropNode}
          onDuplicateNode={onDuplicateNode}
          onDeleteNode={onDeleteNode}
          reactFlowInstance={reactFlowInstance}
          setReactFlowInstance={setReactFlowInstance}
        />

        {/* Right inspector */}
        {selectedNodeData ? (
          <NodeInspectorPanel
            node={selectedNodeData}
            quiz={quiz}
            quizId={quizId}
            allNodes={flowNodes.map((n) => ({ ...n.data, id: n.id }))}
            onUpdate={onUpdateNodeData}
            onClose={() => setSelectedNodeId(null)}
          />
        ) : (
          <TreeInspectorPanel
            quiz={quiz}
            quizId={quizId}
            brands={brands}
            onUpdateQuiz={(data) => updateQuizMut.mutate(data)}
          />
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <PreviewModal
          nodes={dbQuestions}
          quiz={quiz}
          onClose={() => setShowPreview(false)}
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
                  <span className="text-red-500 font-bold flex-shrink-0">!</span> {err}
                </li>
              ))}
            </ul>
            <button onClick={() => setPublishModal(null)}
              className="w-full py-2 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
              Close and Fix Issues
            </button>
          </div>
        </div>
      )}
    </div>
  );
}