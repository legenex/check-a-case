import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Sun, Moon, RotateCcw, RotateCw, LayoutGrid,
  AlertCircle, Play, Download, HelpCircle, Zap, CheckCircle2,
  MousePointerClick, Move
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

import DesignCanvas from "@/components/admin/dt/canvas/DesignCanvas";
import DesignLibrary from "@/components/admin/dt/canvas/DesignLibrary";
import TestModePanel from "@/components/admin/dt/canvas/TestModePanel";
import ValidationPopover from "@/components/admin/dt/canvas/ValidationPopover";
import { persistType } from "@/components/admin/dt/canvas/nodeTypes";
import NodeInspectorPanel from "@/components/admin/dt/inspector/NodeInspectorPanel";

const THEME_KEY = "cac_dt_canvas_theme";
const HISTORY_CAP = 80;
const SAVE_DEBOUNCE = 800;

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Translation helpers kept in sync with nodeTypes.js ───────────────────────
function questionsToNodes(questions) {
  return questions.map((q, idx) => ({
    id: q.node_id || q.id,
    label: q.label || q.node_type,
    node_type: q.node_type,
    position: { x: q.position_x ?? (idx % 4) * 340 + 100, y: q.position_y ?? Math.floor(idx / 4) * 200 + 100 },
    title_display: q.title_display || "",
    help_text: q.help_text || "",
    placeholder: q.placeholder || "",
    required: q.required ?? true,
    answer_options: q.answer_options || [],
    validation_rules: q.validation_rules || [],
    config: q.config || {},
    scripts: q.scripts || [],
    tags_to_add: q.tags_to_add || [],
    tags_to_remove: q.tags_to_remove || [],
    custom_field_assignments: q.custom_field_assignments || [],
    media_image_url: q.media_image_url || "",
    _dbId: q.id,
  }));
}

function edgesToInternal(edges) {
  return edges.map((e) => ({
    id: e.edge_id || e.id,
    source: e.source_node_id,
    sourceHandle: e.source_handle || "next",
    target: e.target_node_id,
    targetHandle: e.target_handle || "in",
    label: e.label || "",
    animated: e.animated || false,
    style_color: e.style_color || "#94a3b8",
    _dbId: e.id,
  }));
}

function bfsLayout(nodes, edges) {
  if (nodes.length === 0) return nodes;
  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) { if (adj[e.source]) adj[e.source].push(e.target); }
  const startNode = nodes.find((n) => n.node_type === "start_page") || nodes[0];
  const visited = new Set();
  const depthMap = {};
  const queue = [{ id: startNode.id, depth: 0 }];
  while (queue.length) {
    const { id, depth } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    depthMap[id] = depth;
    for (const nextId of (adj[id] || [])) {
      if (!visited.has(nextId)) queue.push({ id: nextId, depth: depth + 1 });
    }
  }
  for (const n of nodes) {
    if (!visited.has(n.id)) depthMap[n.id] = Math.max(...Object.values(depthMap), 0) + 1;
  }
  const byDepth = {};
  for (const [id, depth] of Object.entries(depthMap)) {
    if (!byDepth[depth]) byDepth[depth] = [];
    byDepth[depth].push(id);
  }
  const posMap = {};
  for (const [depth, ids] of Object.entries(byDepth)) {
    const count = ids.length;
    ids.forEach((id, order) => {
      posMap[id] = {
        x: 100 + Number(depth) * 340,
        y: -(count * 100) + order * 200 + 100,
      };
    });
  }
  return nodes.map((n) => ({ ...n, position: posMap[n.id] || n.position }));
}

async function runDQMigration(quizId, quiz, allNodes, allEdges) {
  const migMeta = quiz?.react_flow_data?.meta?.migration_completed;
  if (migMeta) return { nodes: allNodes, edges: allEdges, count: 0 };

  let count = 0;
  const newNodes = [...allNodes];
  const newEdges = [...allEdges];
  const existingNodeIds = new Set(allNodes.map((n) => n.id));

  // Check for existing Questions/Edges in DB to prevent duplicate creation
  const dbQuestions = await base44.entities.Question.filter({ quiz_id: quizId }, null, 1000);
  const dbEdges = await base44.entities.Edge.filter({ quiz_id: quizId }, null, 1000);
  const dbNodeIds = new Set(dbQuestions.map((q) => q.node_id));
  const dbEdgeIds = new Set(dbEdges.map((e) => e.edge_id));

  for (const node of allNodes) {
    const opts = node.answer_options || [];
    for (let i = 0; i < opts.length; i++) {
      const opt = opts[i];
      if (!opt.is_dq) continue;
      const resultId = `result_${node.id}_${opt.option_id || i}`;
      if (existingNodeIds.has(resultId) || dbNodeIds.has(resultId)) continue;

      const resultNode = {
        id: resultId,
        label: opt.label ? `DQ: ${opt.label}` : "Auto-migrated DQ",
        node_type: "results_page",
        position: { x: node.position.x + 360, y: node.position.y + i * 120 },
        config: {
          result_kind: opt.dq_type === "soft" ? "nurture" : "disqualified",
          reason: `Auto-migrated from option "${opt.label || opt.value}"`,
          auto_migrated: true,
        },
        answer_options: [], validation_rules: [], scripts: [],
        tags_to_add: [], tags_to_remove: [], custom_field_assignments: [],
        title_display: "", help_text: "", placeholder: "", required: true,
        _dbId: null,
      };

      const edgeId = `migrated_${node.id}_${opt.option_id || i}`;
      // Skip if edge already exists in DB
      if (dbEdgeIds.has(edgeId)) continue;
      
      const newEdge = {
        id: edgeId,
        source: node.id,
        sourceHandle: `opt_${i}`,
        target: resultId,
        targetHandle: "in",
        label: opt.dq_type === "soft" ? "Soft DQ" : "Hard DQ",
        animated: false,
        style_color: "#94a3b8",
        _dbId: null,
      };

      // Create in DB
      const created = await base44.entities.Question.create({
        quiz_id: quizId,
        node_id: resultId,
        node_type: "results_page",
        position_x: resultNode.position.x,
        position_y: resultNode.position.y,
        label: resultNode.label,
        config: resultNode.config,
        answer_options: [], validation_rules: [], scripts: [],
        tags_to_add: [], tags_to_remove: [], custom_field_assignments: [],
      });
      const createdEdge = await base44.entities.Edge.create({
        quiz_id: quizId,
        edge_id: edgeId,
        source_node_id: node.id,
        target_node_id: resultId,
        source_handle: `opt_${i}`,
        target_handle: "in",
        label: newEdge.label,
        animated: false,
        style_color: "#94a3b8",
      });

      // Clear is_dq from the source option
      const updatedOpts = opts.map((o, oi) =>
        oi === i ? { ...o, is_dq: false, dq_type: undefined, next_node_id: resultId } : o
      );
      await base44.entities.Question.update(node._dbId || node.id, { answer_options: updatedOpts });

      resultNode._dbId = created.id;
      newEdge._dbId = createdEdge.id;
      newNodes.push(resultNode);
      newEdges.push(newEdge);
      existingNodeIds.add(resultId);
      // Update node in newNodes
      const srcIdx = newNodes.findIndex((n) => n.id === node.id);
      if (srcIdx >= 0) newNodes[srcIdx] = { ...newNodes[srcIdx], answer_options: updatedOpts };
      count++;
    }
  }

  // Mark migration done
  await base44.entities.Quiz.update(quizId, {
    react_flow_data: {
      ...(quiz?.react_flow_data || {}),
      meta: { ...(quiz?.react_flow_data?.meta || {}), migration_completed: true },
    },
  });

  return { nodes: newNodes, edges: newEdges, count };
}

// ── Main Builder ──────────────────────────────────────────────────────────────

export default function AdvancedBuilder() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selection, setSelection] = useState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) !== "light"; } catch { return true; }
  });
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testStartNodeId, setTestStartNodeId] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [saveStatus, setSaveStatus] = useState("clean");
  const [savedAt, setSavedAt] = useState(null);
  const [saveTicker, setSaveTicker] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const [publishModal, setPublishModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [connectionMode, setConnectionMode] = useState(() => {
    try {
      const saved = localStorage.getItem("cc_connectionMode");
      return (saved === "click" || saved === "drag") ? saved : "click";
    } catch { return "click"; }
  });

  const historyRef = useRef({ past: [], future: [] });
  const saveTimerRef = useRef(null);
  const vpRef = useRef(null);
  const migrationStartedRef = useRef(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

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

  const updateQuizMut = useMutation({
    mutationFn: (data) => base44.entities.Quiz.update(quizId, data),
    onSuccess: () => qc.invalidateQueries(["quiz", quizId]),
  });

  // Initialize — load from Question rows only (single source of truth)
  useEffect(() => {
    let cancelled = false;
    if (!loadingQ && !loadingE && quiz) {
      setTitleVal(quiz.title || "");
      
      // One-time data-integrity sweep: remove duplicate Question rows
      (async () => {
        try {
          const allQuestions = await base44.entities.Question.filter({ quiz_id: quizId }, null, 1000);
          const byNodeId = new Map();
          const duplicates = [];
          for (const q of allQuestions) {
            if (byNodeId.has(q.node_id)) {
              duplicates.push(q);
            } else {
              byNodeId.set(q.node_id, q);
            }
          }
          if (duplicates.length > 0) {
            await Promise.all(duplicates.map((d) => base44.entities.Question.delete(d.id)));
            console.log(`Cleaned up ${duplicates.length} duplicate Question rows.`);
          }
        } catch (err) {
          console.error("Data integrity check failed:", err);
        }
      })();
      
      // De-duplicate: use last-write-wins by node_id
      const nodeMap = new Map();
      for (const q of dbQuestions) {
        nodeMap.set(q.node_id, q);
      }
      const uniqueQuestions = Array.from(nodeMap.values());
      
      const initNodes = questionsToNodes(uniqueQuestions);
      const initEdges = edgesToInternal(dbEdges);

      if (!cancelled) {
        runDQMigration(quizId, quiz, initNodes, initEdges).then(({ nodes: migNodes, edges: migEdges, count }) => {
          if (!cancelled) {
            if (count > 0) showToast(`Migrated ${count} old DQ option${count > 1 ? "s" : ""} to Result nodes.`);
            setNodes(migNodes);
            setEdges(migEdges);
            qc.invalidateQueries(["questions", quizId]);
            qc.invalidateQueries(["edges", quizId]);
          }
        });
      }
    }
    return () => { cancelled = true; };
  }, [loadingQ, loadingE, quiz?.id]);

  // Save ticker
  useEffect(() => {
    const t = setInterval(() => setSaveTicker((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Persist connectionMode to localStorage
  useEffect(() => {
    try { localStorage.setItem("cc_connectionMode", connectionMode); } catch {}
  }, [connectionMode]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const doSave = useCallback(async (nds, eds) => {
    setSaveStatus("saving");
    try {
      const existingQMap = {};
      for (const q of dbQuestions) existingQMap[q.node_id] = q;
      const existingEMap = {};
      for (const e of dbEdges) existingEMap[e.edge_id] = e;

      await Promise.all(nds.map(async (n) => {
        const payload = {
          quiz_id: quizId, node_id: n.id, node_type: n.node_type,
          position_x: Math.round(n.position.x), position_y: Math.round(n.position.y),
          label: n.label, title_display: n.title_display || "",
          help_text: n.help_text || "", placeholder: n.placeholder || "",
          required: n.required ?? true,
          answer_options: n.answer_options || [],
          validation_rules: n.validation_rules || [],
          config: n.config || {},
          scripts: n.scripts || [],
          tags_to_add: n.tags_to_add || [],
          tags_to_remove: n.tags_to_remove || [],
          custom_field_assignments: n.custom_field_assignments || [],
          media_image_url: n.media_image_url || "",
        };
        const existing = existingQMap[n.id];
        if (existing) return base44.entities.Question.update(existing.id, payload);
        return base44.entities.Question.create(payload);
      }));

      // Delete removed
      const nodeIds = new Set(nds.map((n) => n.id));
      await Promise.all(dbQuestions.filter((q) => !nodeIds.has(q.node_id)).map((q) => base44.entities.Question.delete(q.id)));

      await Promise.all(eds.map(async (e) => {
        const payload = {
          quiz_id: quizId, edge_id: e.id,
          source_node_id: e.source, target_node_id: e.target,
          source_handle: e.sourceHandle || "next",
          target_handle: e.targetHandle || "in",
          label: e.label || "", animated: false,
          style_color: e.style_color || "#94a3b8",
        };
        const existing = existingEMap[e.id];
        if (existing) return base44.entities.Edge.update(existing.id, payload);
        return base44.entities.Edge.create(payload);
      }));

      const edgeIds = new Set(eds.map((e) => e.id));
      await Promise.all(dbEdges.filter((e) => !edgeIds.has(e.edge_id)).map((e) => base44.entities.Edge.delete(e.id)));

      await base44.entities.Quiz.update(quizId, {
        total_nodes: nds.length,
        total_edges: eds.length,
        react_flow_data: { ...(quiz?.react_flow_data || {}), nodes: nds, edges: eds },
      });

      qc.invalidateQueries(["questions", quizId]);
      qc.invalidateQueries(["edges", quizId]);
      setSavedAt(new Date());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("clean"), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("failed");
    }
  }, [dbQuestions, dbEdges, quizId, qc, quiz]);

  const bumpSave = useCallback((nds, eds) => {
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(nds, eds), SAVE_DEBOUNCE);
  }, [doSave]);

  // ── History ───────────────────────────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    historyRef.current.past.push({ nodes: nodesRef.current, edges: edgesRef.current });
    if (historyRef.current.past.length > HISTORY_CAP) historyRef.current.past.shift();
    historyRef.current.future = [];
  }, []);

  const mutate = useCallback((fn) => {
    pushHistory();
    const [newNodes, newEdges] = fn(nodesRef.current, edgesRef.current);
    setNodes(newNodes);
    setEdges(newEdges);
    bumpSave(newNodes, newEdges);
  }, [pushHistory, bumpSave]);

  const undo = useCallback(() => {
    const prev = historyRef.current.past.pop();
    if (!prev) return;
    historyRef.current.future.push({ nodes: nodesRef.current, edges: edgesRef.current });
    setNodes(prev.nodes); setEdges(prev.edges);
    bumpSave(prev.nodes, prev.edges);
  }, [bumpSave]);

  const redo = useCallback(() => {
    const next = historyRef.current.future.pop();
    if (!next) return;
    historyRef.current.past.push({ nodes: nodesRef.current, edges: edgesRef.current });
    setNodes(next.nodes); setEdges(next.edges);
    bumpSave(next.nodes, next.edges);
  }, [bumpSave]);

  // ── Node operations ───────────────────────────────────────────────────────────

  // Direct position set (from DesignCanvas drag)
  const onMoveNode = useCallback((nodeId, pos) => {
    setNodes((prev) => {
      const updated = prev.map((n) => n.id === nodeId ? { ...n, position: pos } : n);
      bumpSave(updated, edgesRef.current);
      return updated;
    });
  }, [bumpSave]);

  const onCanvasDrop = useCallback((typeKey, wx, wy, connectFrom, extraConfig) => {
    const nodeId = crypto.randomUUID();
    const { node_type, config } = persistType(typeKey, extraConfig || {});
    const newNode = {
      id: nodeId,
      label: node_type,
      node_type,
      position: { x: wx, y: wy },
      title_display: "", help_text: "", placeholder: "", required: true,
      answer_options: ["single_select", "checkbox_multi_select"].includes(node_type)
        ? [
            { option_id: crypto.randomUUID(), label: "Option 1", value: "option_1", is_dq: false, score: 0, tags_to_add: [], tags_to_remove: {} },
            { option_id: crypto.randomUUID(), label: "Option 2", value: "option_2", is_dq: false, score: 0, tags_to_add: [], tags_to_remove: {} },
          ]
        : [],
      validation_rules: [], config, scripts: [],
      tags_to_add: [], tags_to_remove: [], custom_field_assignments: [],
      media_image_url: "", _dbId: null,
    };
    mutate((ns, es) => {
      const newNodes = [...ns, newNode];
      let newEdges = es;
      if (connectFrom) {
        const edgeId = crypto.randomUUID();
        newEdges = [...es, {
          id: edgeId, source: connectFrom.source, sourceHandle: connectFrom.sourceHandle,
          target: nodeId, targetHandle: "in", label: "", animated: false, style_color: "#94a3b8",
        }];
      }
      return [newNodes, newEdges];
    });
  }, [mutate]);

  const onNodeDelete = useCallback((nodeId) => {
    mutate((ns, es) => [
      ns.filter((n) => n.id !== nodeId),
      es.filter((e) => e.source !== nodeId && e.target !== nodeId),
    ]);
    setSelection((s) => s.filter((id) => id !== nodeId));
  }, [mutate]);

  const onNodeDuplicate = useCallback((nodeId) => {
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;
    const newId = crypto.randomUUID();
    mutate((ns, es) => [[...ns, {
      ...node, id: newId, _dbId: null,
      label: node.label + " (Copy)",
      position: { x: node.position.x + 40, y: node.position.y + 40 },
    }], es]);
  }, [mutate]);

  const onTitleCommit = useCallback((nodeId, newLabel) => {
    mutate((ns, es) => [
      ns.map((n) => n.id === nodeId ? { ...n, label: newLabel } : n),
      es,
    ]);
  }, [mutate]);

  const onConnect = useCallback((connection) => {
    const edgeId = crypto.randomUUID();
    mutate((ns, es) => [ns, [...es, {
      id: edgeId,
      source: connection.source,
      sourceHandle: connection.sourceHandle || "next",
      target: connection.target,
      targetHandle: connection.targetHandle || "in",
      label: "", animated: false, style_color: "#94a3b8",
    }]]);
  }, [mutate]);

  const onEdgeDelete = useCallback((edgeId) => {
    mutate((ns, es) => [ns, es.filter((e) => e.id !== edgeId)]);
    setSelectedEdgeId(null);
  }, [mutate]);

  const onSelect = useCallback((ids, additive) => {
    if (Array.isArray(ids)) {
      setSelection(additive ? (s) => [...new Set([...s, ...ids])] : ids);
    } else {
      setSelection(additive ? (s) => [...new Set([...s, ids])] : [ids]);
    }
    setSelectedEdgeId(null);
  }, []);

  const onClearSelection = useCallback(() => {
    setSelection([]);
    setSelectedEdgeId(null);
    setEditingNode(null);
  }, []);

  const onSelectAll = useCallback(() => {
    setSelection(nodesRef.current.map((n) => n.id));
  }, []);

  const onDeleteSelected = useCallback(() => {
    const ids = new Set(selection);
    mutate((ns, es) => [
      ns.filter((n) => !ids.has(n.id)),
      es.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
    ]);
    setSelection([]);
  }, [selection, mutate]);

  const onDuplicateSelected = useCallback(() => {
    const sel = selection;
    mutate((ns, es) => {
      const newNodes = [...ns];
      sel.forEach((id) => {
        const n = ns.find((x) => x.id === id);
        if (!n) return;
        newNodes.push({ ...n, id: crypto.randomUUID(), _dbId: null, label: n.label + " (Copy)", position: { x: n.position.x + 40, y: n.position.y + 40 } });
      });
      return [newNodes, es];
    });
  }, [selection, mutate]);

  // Open node editor on double-click or single-selection after 300ms dwell
  const onNodeSingleSelect = useCallback((nodeId, additive) => {
    onSelect([nodeId], additive);
    if (!additive) {
      const n = nodesRef.current.find((x) => x.id === nodeId);
      if (n) setEditingNode(n);
    }
  }, [onSelect]);

  const onSaveNode = useCallback((updatedData) => {
    const nodeId = updatedData.node_id || updatedData.id;
    mutate((ns, es) => [
      ns.map((n) => n.id === nodeId ? { ...n, ...updatedData, id: nodeId, position: n.position } : n),
      es,
    ]);
  }, [mutate]);

  // Auto-layout
  const handleAutoLayout = useCallback(() => {
    mutate((ns, es) => [bfsLayout(ns, es), es]);
  }, [mutate]);

  // Jump to node
  const jumpToNode = useCallback((nodeId) => {
    vpRef.current?.jumpToNode?.(nodeId);
    onSelect([nodeId], false);
  }, [onSelect]);

  // Publish
  const handlePublish = useCallback(async () => {
    const user = await base44.auth.me();
    const newVersion = (quiz?.version || 1) + 1;
    const snapshot = {
      version: newVersion, published_at: new Date().toISOString(),
      published_by: user?.email || "admin",
      nodes_snapshot: nodesRef.current,
      edges_snapshot: edgesRef.current,
    };
    await base44.entities.Quiz.update(quizId, {
      status: "published", version: newVersion,
      published_at: snapshot.published_at, published_by: snapshot.published_by,
      version_history: [...(quiz?.version_history || []), snapshot],
    });
    qc.invalidateQueries(["quiz", quizId]);
    showToast("Published successfully!");
  }, [quiz, quizId, qc]);

  // Export JSON
  const handleExport = useCallback(() => {
    const data = { name: quiz?.title, nodes: nodesRef.current, edges: edgesRef.current };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quiz?.title || "tree"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [quiz]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const active = document.activeElement;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (ctrl && e.key === "s") { e.preventDefault(); if (saveTimerRef.current) clearTimeout(saveTimerRef.current); doSave(nodesRef.current, edgesRef.current); }
      if (ctrl && e.key === "a") { e.preventDefault(); onSelectAll(); }
      if (ctrl && e.key === "d") { e.preventDefault(); onDuplicateSelected(); }
      if ((e.key === "Delete" || e.key === "Backspace") && (selection.length > 0 || selectedEdgeId)) {
        if (selectedEdgeId) onEdgeDelete(selectedEdgeId);
        else onDeleteSelected();
      }
      if (e.key === "?") setShowHelp((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, doSave, onSelectAll, onDuplicateSelected, onDeleteSelected, selection, selectedEdgeId, onEdgeDelete]);

  // Before-unload guard
  useEffect(() => {
    const handler = (e) => { if (saveStatus === "unsaved" || saveStatus === "saving") { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveStatus]);

  const toggleDark = useCallback(() => {
    setIsDark((v) => {
      const next = !v;
      try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch {}
      return next;
    });
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (loadingQuiz || loadingQ || loadingE) {
    return <div className="flex items-center justify-center h-screen bg-zinc-950"><Loader2 className="w-7 h-7 animate-spin text-slate-500" /></div>;
  }
  if (!quiz) return <div className="p-8 text-slate-500">Decision tree not found.</div>;

  const chromeBg = isDark ? "rgba(20,20,24,0.92)" : "rgba(252,251,248,0.92)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const textPrimary = isDark ? "#e2e8f0" : "#1e293b";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";

  // Issue count computed lazily inside ValidationPopover

  const savePill = () => {
    if (saveStatus === "unsaved") return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: "rgba(113,113,122,0.1)", color: textSecondary }}>
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Unsaved
      </span>
    );
    if (saveStatus === "saving") return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs animate-pulse" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Saving...
      </span>
    );
    if (saveStatus === "saved" || (saveStatus === "clean" && savedAt)) {
      const secs = savedAt ? Math.floor((Date.now() - savedAt.getTime()) / 1000) : 0;
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
          <CheckCircle2 size={10} /> Saved {secs === 0 ? "just now" : `${secs}s ago`}
        </span>
      );
    }
    if (saveStatus === "failed") return (
      <button onClick={() => doSave(nodesRef.current, edgesRef.current)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-rose-400" style={{ background: "rgba(244,63,94,0.08)" }}>
        Save failed - retry
      </button>
    );
    return null;
  };

  const testTraversedNodes = [];
  const testNodeId = null;

  return (
    <TooltipProvider>
      <style>{`
        @keyframes ccPulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes ccSlideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes ccSaving { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
      <div
        className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
        style={{ fontFamily: "Inter, sans-serif", fontFeatureSettings: '"cv11","ss01","ss03"', letterSpacing: "-0.005em" }}
      >
        {/* TOPBAR */}
        <div
          className="flex items-center gap-2 px-3 flex-shrink-0"
          style={{
            height: 56, zIndex: 30,
            background: chromeBg,
            backdropFilter: "blur(14px) saturate(140%)",
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          <button onClick={() => navigate("/admin/decision-trees")} className="p-1.5 rounded transition-colors hover:bg-violet-500/10 flex-shrink-0" style={{ color: textSecondary }}>
            <ArrowLeft size={15} />
          </button>

          <div style={{ width: 1, height: 16, background: borderColor, flexShrink: 0 }} />

          {/* Tree name */}
          {editingTitle ? (
            <input
              autoFocus
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onBlur={() => { setEditingTitle(false); if (titleVal !== quiz.title) updateQuizMut.mutate({ title: titleVal }); }}
              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { setEditingTitle(false); setTitleVal(quiz.title || ""); } }}
              className="text-sm font-medium bg-transparent outline-none border-b max-w-[200px]"
              style={{ color: textPrimary, borderColor: "#8b5cf6" }}
            />
          ) : (
            <button
              onClick={() => { setEditingTitle(true); setTitleVal(quiz.title || ""); }}
              className="text-sm font-medium hover:text-violet-400 transition-colors truncate max-w-[200px]"
              style={{ color: textPrimary }}
            >
              {quiz.title || "Untitled"}
            </button>
          )}

          {/* Save pill */}
          {savePill()}

          <div className="flex-1" />

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={undo} disabled={!historyRef.current.past.length} className="p-1.5 rounded transition-colors hover:bg-violet-500/10 disabled:opacity-30" style={{ color: textSecondary }}>
                <RotateCcw size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={redo} disabled={!historyRef.current.future.length} className="p-1.5 rounded transition-colors hover:bg-violet-500/10 disabled:opacity-30" style={{ color: textSecondary }}>
                <RotateCw size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>

          {/* Auto-layout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleAutoLayout} className="p-1.5 rounded transition-colors hover:bg-violet-500/10" style={{ color: textSecondary }}>
                <LayoutGrid size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Auto-layout</TooltipContent>
          </Tooltip>

          {/* Validate */}
          <button
            onClick={() => setShowValidation((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: showValidation ? "rgba(139,92,246,0.12)" : "transparent",
              color: showValidation ? "#8b5cf6" : textSecondary,
              border: `1px solid ${showValidation ? "rgba(139,92,246,0.3)" : borderColor}`,
            }}
          >
            <AlertCircle size={12} /> Validate
          </button>

          {/* Connection mode toggle */}
          <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: borderColor }}>
            <button
              onClick={() => setConnectionMode("click")}
              title="Click handles to connect"
              className={`px-2.5 h-8 text-xs font-medium flex items-center gap-1 transition-colors ${
                connectionMode === "click"
                  ? isDark ? "bg-zinc-800 text-zinc-100" : "bg-slate-100 text-slate-900"
                  : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MousePointerClick size={13} strokeWidth={1.75} />
              Click
            </button>
            <button
              onClick={() => setConnectionMode("drag")}
              title="Drag from output to input to connect"
              className={`px-2.5 h-8 text-xs font-medium flex items-center gap-1 transition-colors ${
                connectionMode === "drag"
                  ? isDark ? "bg-zinc-800 text-zinc-100" : "bg-slate-100 text-slate-900"
                  : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Move size={13} strokeWidth={1.75} />
              Drag
            </button>
          </div>

          {/* Test mode */}
          <button
            onClick={() => setTestMode((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: testMode ? "rgba(16,185,129,0.12)" : "transparent",
              color: testMode ? "#10b981" : textSecondary,
              border: `1px solid ${testMode ? "rgba(16,185,129,0.3)" : borderColor}`,
            }}
          >
            <Play size={12} /> {testMode ? "Exit Test" : "Test"}
          </button>

          {/* Published toggle */}
          <button
            onClick={() => updateQuizMut.mutate({ status: quiz.status === "published" ? "draft" : "published" })}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: quiz.status === "published" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.10)",
              color: quiz.status === "published" ? "#10b981" : "#f59e0b",
              border: `1px solid ${quiz.status === "published" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
            }}
          >
            {quiz.status === "published" ? "Published" : "Draft"}
          </button>

          {/* Theme toggle */}
          <button onClick={toggleDark} className="p-1.5 rounded transition-colors hover:bg-violet-500/10" style={{ color: isDark ? "#f59e0b" : textSecondary }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Export */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleExport} className="p-1.5 rounded transition-colors hover:bg-violet-500/10" style={{ color: textSecondary }}>
                <Download size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Export JSON</TooltipContent>
          </Tooltip>

          {/* Help */}
          <button onClick={() => setShowHelp((v) => !v)} className="p-1.5 rounded transition-colors hover:bg-violet-500/10" style={{ color: textSecondary }}>
            <HelpCircle size={14} />
          </button>

          <div style={{ width: 1, height: 16, background: borderColor }} />

          {/* Publish */}
          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors text-white"
            style={{ background: "linear-gradient(135deg, #7c5cff 0%, #6d4dff 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(109,77,255,0.4)" }}
          >
            <Zap size={12} /> Publish
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* LIBRARY */}
          <DesignLibrary isLight={!isDark} collapsed={libraryCollapsed} onToggle={() => setLibraryCollapsed((v) => !v)} />

          {/* CANVAS */}
          <DesignCanvas
            nodes={nodes}
            edges={edges}
            selection={selection}
            isLight={!isDark}
            testNodeId={testNodeId}
            testTraversedNodes={testTraversedNodes}
            selectedEdgeId={selectedEdgeId}
            onMoveNode={onMoveNode}
            onSelect={(ids, additive) => {
              if (!Array.isArray(ids)) ids = [ids];
              setSelection(additive ? (s) => [...new Set([...s, ...ids])] : ids);
              setSelectedEdgeId(null);
              if (!additive && ids.length === 1) {
                const n = nodesRef.current.find((x) => x.id === ids[0]);
                if (n) setEditingNode(n);
              }
            }}
            onClearSelection={onClearSelection}
            onSelectAll={onSelectAll}
            onDeleteSelected={onDeleteSelected}
            onDuplicateSelected={onDuplicateSelected}
            onEdgeClick={setSelectedEdgeId}
            onEdgeDelete={onEdgeDelete}
            onNodeDelete={onNodeDelete}
            onNodeDuplicate={onNodeDuplicate}
            onConnect={onConnect}
            onCanvasDrop={onCanvasDrop}
            onTitleCommit={onTitleCommit}
            onViewportRef={vpRef}
            libraryWidth={libraryCollapsed ? 56 : 280}
            connectionMode={connectionMode}
          />

          {/* VALIDATION POPOVER */}
          {showValidation && (
            <ValidationPopover
              nodes={nodes}
              edges={edges}
              isDark={isDark}
              onJumpToNode={jumpToNode}
              onClose={() => setShowValidation(false)}
            />
          )}

          {/* SETTINGS / EDITOR */}
          {!testMode && editingNode && selection.length === 1 && (
            <div
              className="flex-shrink-0 z-30 overflow-hidden"
              style={{ animation: "ccSlideIn 220ms cubic-bezier(0.22,1,0.36,1)" }}
            >
              <NodeInspectorPanel
                node={editingNode}
                allNodes={nodes.map((n) => ({ ...n, _flowId: n.id }))}
                allEdges={edges}
                quiz={quiz}
                quizId={quizId}
                onUpdate={(patch) => {
                  const updated = { ...editingNode, ...patch };
                  setEditingNode(updated);
                  onSaveNode(updated);
                }}
                onClose={() => setEditingNode(null)}
                isDirty={false}
                onSave={() => {}}
                onDiscard={() => {}}
              />
            </div>
          )}

          {/* TEST MODE PANEL */}
          {testMode && (
            <TestModePanel
              nodes={nodes}
              edges={edges}
              startNodeId={testStartNodeId}
              isDark={isDark}
              onClose={() => setTestMode(false)}
              onJumpToNode={jumpToNode}
            />
          )}
        </div>

        {/* Help popover */}
        {showHelp && (
          <div
            className="fixed bottom-16 right-4 z-50 rounded-xl p-4 space-y-2 text-xs"
            style={{
              width: 400, background: chromeBg, backdropFilter: "blur(16px)",
              border: `1px solid ${borderColor}`, boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm" style={{ color: textPrimary }}>Keyboard Shortcuts</span>
              <button onClick={() => setShowHelp(false)} style={{ color: textSecondary }}>Close</button>
            </div>
            {[
              ["Pan", "Space + drag, or two-finger drag"],
              ["Zoom", "Cmd/Ctrl + scroll, or pinch"],
              ["Select all", "Cmd/Ctrl + A"],
              ["Marquee select", "Drag on empty canvas"],
              ["Duplicate", "Cmd/Ctrl + D"],
              ["Delete", "Delete or Backspace"],
              ["Undo", "Cmd/Ctrl + Z"],
              ["Redo", "Shift + Cmd/Ctrl + Z"],
              ["Save", "Cmd/Ctrl + S"],
              ["Help", "?"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span style={{ color: textSecondary }}>{v}</span>
                <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor, color: textPrimary, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderBottomWidth: 2 }}>{k}</kbd>
              </div>
            ))}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-xl"
            style={{ background: "rgba(22,22,28,0.97)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {toast}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}