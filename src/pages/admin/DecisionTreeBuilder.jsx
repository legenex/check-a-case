import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import BuilderTopBar from "@/components/admin/dt/BuilderTopBar";
import NodeSidebar from "@/components/admin/dt/NodeSidebar";
import NodeConfigPanel from "@/components/admin/dt/NodeConfigPanel";
import TreeSettingsSidebar from "@/components/admin/dt/TreeSettingsSidebar";
import PreviewModal from "@/components/admin/dt/PreviewModal";
import { Loader2 } from "lucide-react";

export default function DecisionTreeBuilder() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const qc = useQueryClient();

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [pendingSave, setPendingSave] = useState(false);
  const saveTimerRef = useRef(null);

  const { data: quiz, isLoading: loadingQuiz } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => base44.entities.Quiz.filter({ id: quizId }).then((r) => r[0]),
  });

  const { data: nodes = [], isLoading: loadingNodes } = useQuery({
    queryKey: ["questions", quizId],
    queryFn: () => base44.entities.Question.filter({ quiz_id: quizId }, "order_index"),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["dt-brands"],
    queryFn: () => base44.entities.DecisionTreeBrand.list(),
  });

  const updateQuizMut = useMutation({
    mutationFn: (data) => base44.entities.Quiz.update(quizId, data),
    onSuccess: () => {
      qc.invalidateQueries(["quiz", quizId]);
      setSavedAt(new Date());
      setPendingSave(false);
    },
  });

  const updateNodeMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Question.update(id, data),
    onSuccess: () => qc.invalidateQueries(["questions", quizId]),
  });

  const createNodeMut = useMutation({
    mutationFn: (data) => base44.entities.Question.create(data),
    onSuccess: (newNode) => {
      qc.invalidateQueries(["questions", quizId]);
      if (newNode?.id) setSelectedNodeId(newNode.id);
    },
  });

  const deleteNodeMut = useMutation({
    mutationFn: (id) => base44.entities.Question.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["questions", quizId]);
      setSelectedNodeId(null);
    },
  });

  // Auto-save every 5s
  const scheduleAutoSave = useCallback((quizData) => {
    setPendingSave(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateQuizMut.mutate(quizData);
    }, 5000);
  }, []);

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const handleUpdateQuiz = (data) => {
    scheduleAutoSave(data);
  };

  const handleSaveNow = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (quiz) updateQuizMut.mutate({});
  };

  const handleUpdateNode = (nodeId, data) => {
    updateNodeMut.mutate({ id: nodeId, data });
  };

  const handleAddNode = (nodeType) => {
    const maxOrder = nodes.length ? Math.max(...nodes.map((n) => n.order_index || 0)) : -1;
    createNodeMut.mutate({
      node_id: crypto.randomUUID(),
      quiz_id: quizId,
      node_type: nodeType,
      order_index: maxOrder + 1,
      position_x: (maxOrder + 1) * 100,
      position_y: 100,
      label: nodeType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      title_display: "",
      required: true,
      answer_options: ["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"].includes(nodeType)
        ? [
            { option_id: crypto.randomUUID(), label: "Option 1", value: "option_1", is_dq: false, score: 0, tags_to_add: [], tags_to_remove: [], custom_field_overrides: {} },
            { option_id: crypto.randomUUID(), label: "Option 2", value: "option_2", is_dq: false, score: 0, tags_to_add: [], tags_to_remove: [], custom_field_overrides: {} },
            { option_id: crypto.randomUUID(), label: "Option 3", value: "option_3", is_dq: false, score: 0, tags_to_add: [], tags_to_remove: [], custom_field_overrides: {} },
          ]
        : [],
      custom_field_assignments: [],
      tags_to_add: [],
      tags_to_remove: [],
      scripts: [],
      validation_rules: [],
      config: {},
    });
  };

  const handleReorderNodes = (reordered) => {
    reordered.forEach((node, idx) => {
      if (node.order_index !== idx) {
        updateNodeMut.mutate({ id: node.id, data: { order_index: idx } });
      }
    });
  };

  if (loadingQuiz || loadingNodes) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz) {
    return <div className="p-8 text-muted-foreground">Decision tree not found.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-muted/30 overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      <BuilderTopBar
        quiz={quiz}
        nodes={nodes}
        savedAt={savedAt}
        pendingSave={pendingSave}
        brands={brands}
        onUpdateQuiz={handleUpdateQuiz}
        onSaveNow={handleSaveNow}
        onPreview={() => setShowPreview(true)}
        onBack={() => navigate("/admin/decision-trees")}
        onSwitchAdvanced={() => navigate(`/admin/decision-trees/${quizId}/advanced`)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: node list */}
        <NodeSidebar
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          scoreEnabled={quiz?.settings?.score_enabled}
          onSelect={setSelectedNodeId}
          onAddNode={handleAddNode}
          onReorder={handleReorderNodes}
          onDelete={(id) => deleteNodeMut.mutate(id)}
        />

        {/* Center: config form */}
        <div className="flex-1 overflow-auto p-6">
          {selectedNode ? (
            <NodeConfigPanel
              node={selectedNode}
              quiz={quiz}
              quizId={quizId}
              onUpdate={(data) => handleUpdateNode(selectedNode.id, data)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
                🌿
              </div>
              <p className="text-lg font-medium">Select a node to configure</p>
              <p className="text-sm">or click + Add Node to get started</p>
            </div>
          )}
        </div>

        {/* Right: tree settings / node inspector */}
        <TreeSettingsSidebar
          quiz={quiz}
          selectedNode={selectedNode}
          quizId={quizId}
          brands={brands}
          onUpdateQuiz={handleUpdateQuiz}
          onUpdateNode={selectedNode ? (data) => handleUpdateNode(selectedNode.id, data) : null}
        />
      </div>

      {showPreview && (
        <PreviewModal
          nodes={nodes}
          quiz={quiz}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}