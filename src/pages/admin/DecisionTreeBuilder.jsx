import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/** Basic mode removed - always redirect to the canvas (advanced) builder. */
export default function DecisionTreeBuilder() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/admin/decision-trees/${quizId}/advanced`, { replace: true });
  }, [quizId, navigate]);

  return null;
}