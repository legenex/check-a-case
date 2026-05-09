import React from "react";
import { useLocation } from "react-router-dom";
import Footer from "@/components/public/Footer";
import MinimalLegalFooter from "@/components/public/MinimalLegalFooter";

const MINIMAL_PATTERNS = [
  /^\/a\//,
  /^\/tools\//,
  /^\/lp\//,
  /^\/Sorry$/,
  /^\/Submitted$/,
  /^\/Thanks$/,
];

export default function FooterRouter(props) {
  const { pathname } = useLocation();
  const useMinimal = MINIMAL_PATTERNS.some((p) => p.test(pathname));
  return useMinimal ? <MinimalLegalFooter {...props} /> : <Footer {...props} />;
}