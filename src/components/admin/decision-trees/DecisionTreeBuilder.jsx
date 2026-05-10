import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Save, Eye, Settings, MoreHorizontal, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import NodeSidebar from "./builder/NodeSidebar";
import NodeConfigPanel from "./builder/NodeConfigPanel";
import NodeInspector from "./builder/NodeInspector";
import PreviewModal from "./builder/PreviewModal";
import { uuidv4 } from "@/lib/uuid";

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function DecisionTreeBuilder({ quizId, onBack }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimer = useRef(null);
  const pendingUpdates = useRef({});

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => base44.entities.Quiz.filter({ id: quizId }).then((r) => r[0]),
  });

  const { data: questions = [], isLoading: nodesLoading } = useQuery({
    queryKey: ["questions", quizId],
    queryFn: () => base44.entities.Question.filter({ quiz_id: quizId }, "order_index", 200),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["dt-brands"],
    queryFn: () => base44.entities.DecisionTreeBrand.list("brand_name", 50),
  });

  const updateQuizMutation = useMutation({
    mutationFn: (data) => base44.entities.Quiz.update(quizId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quiz", quizId] }),
  });

  const createNodeMutation = useMutation({
    mutationFn: (data) => base44.entities.Question.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions", quizId] }),
  });

  const updateNodeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Question.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions", quizId] }),
  });

  const deleteNodeMutation = useMutation({
    mutationFn: (id) => base44.entities.Question.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
      setSelectedNodeId(null);
    },
  });

  const reorderNodesMutation = useMutation({
    mutationFn: async (orderedIds) => {
      await Promise.all(orderedIds.map((id, index) => base44.entities.Question.update(id, { order_index: index })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions", quizId] }),
  });

  // Auto-save
  const doSave = useCallback(async () => {
    const updates = pendingUpdates.current;
    if (Object.keys(updates).length === 0) return;
    pendingUpdates.current = {};
    try {
      await Promise.all(Object.entries(updates).map(([id, data]) => base44.entities.Question.update(id, data)));
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
    } catch {
      toast({ title: "Auto-save failed", variant: "destructive" });
    }
  }, [quizId, queryClient, toast]);

  useEffect(() => {
    autoSaveTimer.current = setInterval(doSave, 5000);
    return () => clearInterval(autoSaveTimer.current);
  }, [doSave]);

  const handleNodeUpdate = useCallback((nodeId, data) => {
    pendingUpdates.current[nodeId] = { ...(pendingUpdates.current[nodeId] || {}), ...data };
    // Optimistic update in cache
    queryClient.setQueryData(["questions", quizId], (old) =>
      old?.map((q) => q.id === nodeId ? { ...q, ...data } : q) || []
    );
  }, [quizId, queryClient]);

  const handleManualSave = async () => {
    await doSave();
    toast({ title: "Saved successfully" });
  };

  const handleAddNode = async (nodeType) => {
    const maxOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.order_index || 0)) : -1;
    const defaults = getNodeDefaults(nodeType, maxOrder + 1);
    const created = await createNodeMutation.mutateAsync({ ...defaults, quiz_id: quizId });
    await updateQuizMutation.mutateAsync({ total_nodes: questions.length + 1 });
    setSelectedNodeId(created.id);
  };

  const handleDeleteNode = async (nodeId) => {
    if (!confirm("Delete this node?")) return;
    await deleteNodeMutation.mutateAsync(nodeId);
    await updateQuizMutation.mutateAsync({ total_nodes: Math.max(0, questions.length - 1) });
  };

  const selectedNode = questions.find((q) => q.id === selectedNodeId) || null;

  if (quizLoading || nodesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz) return <div className="p-8 text-muted-foreground">Decision tree not found.</div>;

  return (
    <div className="flex flex-col h-screen -m-4 sm:-m-6 lg:-m-8">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background z-10 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-sm text-muted-foreground">Decision Trees /</div>
        <div className="font-semibold text-foreground truncate max-w-64">{quiz.title}</div>
        <div className="flex-1" />
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-background shadow-sm">Basic</button>
          <button disabled className="px-3 py-1.5 rounded-md text-sm text-muted-foreground cursor-not-allowed" title="Coming in Phase 2">Advanced</button>
        </div>
        {/* Status */}
        <Select value={quiz.status || "draft"} onValueChange={(v) => updateQuizMutation.mutate({ status: v })}>
          <SelectTrigger className={`w-32 border font-medium text-sm ${STATUS_COLORS[quiz.status] || STATUS_COLORS.draft}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
          <Eye className="w-4 h-4 mr-1.5" /> Preview
        </Button>
        <Button size="sm" onClick={handleManualSave}>
          <Save className="w-4 h-4 mr-1.5" /> Save
        </Button>
        {lastSaved && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: node list */}
        <div className="w-72 flex-shrink-0 border-r overflow-y-auto bg-muted/20">
          <NodeSidebar
            nodes={questions}
            selectedNodeId={selectedNodeId}
            onSelect={setSelectedNodeId}
            onAdd={handleAddNode}
            onReorder={(orderedIds) => reorderNodesMutation.mutate(orderedIds)}
            onDelete={handleDeleteNode}
          />
        </div>

        {/* Center: config form */}
        <div className="flex-1 overflow-y-auto">
          {selectedNode ? (
            <NodeConfigPanel
              node={selectedNode}
              quiz={quiz}
              onChange={(data) => handleNodeUpdate(selectedNode.id, data)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="font-medium">Select a node to configure it</p>
                <p className="text-sm mt-1">Or add a new node from the left sidebar</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: inspector */}
        <div className="w-80 flex-shrink-0 border-l overflow-y-auto bg-muted/10">
          <NodeInspector
            node={selectedNode}
            quiz={quiz}
            onChange={(data) => selectedNode && handleNodeUpdate(selectedNode.id, data)}
            onQuizChange={(data) => updateQuizMutation.mutate(data)}
            brands={brands}
          />
        </div>
      </div>

      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} quiz={quiz} nodes={questions} />
    </div>
  );
}

function getNodeDefaults(nodeType, orderIndex) {
  const base = {
    node_id: uuidv4(),
    node_type: nodeType,
    order_index: orderIndex,
    position_x: 0,
    position_y: orderIndex * 200,
    label: nodeType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    title_display: "",
    required: true,
    answer_options: [],
    custom_field_assignments: [],
    validation_rules: [],
    tags_to_add: [],
    tags_to_remove: [],
    scripts: [],
    config: {},
  };
  if (["single_select", "multiple_choice", "checkbox_multi_select", "dropdown"].includes(nodeType)) {
    base.answer_options = [
      { option_id: uuidv4(), label: "", value: "", score: 0, is_dq: false, tags_to_add: [], tags_to_remove: [] },
      { option_id: uuidv4(), label: "", value: "", score: 0, is_dq: false, tags_to_add: [], tags_to_remove: [] },
      { option_id: uuidv4(), label: "", value: "", score: 0, is_dq: false, tags_to_add: [], tags_to_remove: [] },
    ];
  }
  if (nodeType === "slider") {
    base.config = { min: 0, max: 100, step: 1, default: 50, prefix: "", suffix: "", format: "number" };
  }
  if (nodeType === "date_picker") {
    base.config = { bucket_into_ranges: false };
  }
  if (nodeType === "start_page") {
    base.required = false;
    base.config = { url_param_handlers: [] };
  }
  if (nodeType === "results_page") {
    base.required = false;
    base.config = { qualification_tier: null, redirect_url: "", result_template: "" };
  }
  return base;
}