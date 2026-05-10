import React from "react";
import { useParams } from "react-router-dom";
import DecisionTreeRunner from "./DecisionTreeRunner";

export default function QuizRunner() {
  const { slug } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const previewMode = searchParams.get('preview') === '1';

  return <DecisionTreeRunner slug={slug} previewMode={previewMode} />;
}