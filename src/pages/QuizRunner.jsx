import React from "react";
import { useParams } from "react-router-dom";
import DecisionTreeRunner from "./DecisionTreeRunner";

export default function QuizRunner() {
  const { slug } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const previewMode = searchParams.get('preview') === '1';
  const replayMode = searchParams.get('replay') === '1';
  const replayRunId = searchParams.get('run_id') || null;

  return (
    <DecisionTreeRunner
      slug={slug}
      previewMode={previewMode || replayMode}
      replayMode={replayMode}
      replayRunId={replayRunId}
    />
  );
}