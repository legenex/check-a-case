import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DecisionTreesList from "@/components/admin/dt/DecisionTreesList";
import DecisionTreeNewModal from "@/components/admin/dt/DecisionTreeNewModal";

export default function DecisionTrees() {
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  const handleOpenBuilder = (quizId) => {
    navigate(`/admin/decision-trees/${quizId}/edit`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Decision Trees</h1>
          <p className="text-muted-foreground mt-1">Build multi-step qualification flows with branching logic and brand support.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          + New Decision Tree
        </button>
      </div>

      <DecisionTreesList onOpenBuilder={handleOpenBuilder} />

      {showNew && (
        <DecisionTreeNewModal
          onClose={() => setShowNew(false)}
          onCreated={(quizId) => {
            setShowNew(false);
            handleOpenBuilder(quizId);
          }}
        />
      )}
    </div>
  );
}