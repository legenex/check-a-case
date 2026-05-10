import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TABOOLA_ID = 2036042;
const SCRIPT_ID = "tb_tfa_script";

export default function TaboolaPixel() {
  const location = useLocation();

  // Inject script once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById(SCRIPT_ID)) return;
    window._tfa = window._tfa || [];
    const script = document.createElement("script");
    script.async = true;
    script.id = SCRIPT_ID;
    script.src = "//cdn.taboola.com/libtrc/unip/" + TABOOLA_ID + "/tfa.js";
    const first = document.getElementsByTagName("script")[0];
    if (first && first.parentNode) {
      first.parentNode.insertBefore(script, first);
    } else {
      document.head.appendChild(script);
    }
  }, []);

  // Fire page_view on every SPA route change
  useEffect(() => {
    if (typeof window === "undefined") return;
    window._tfa = window._tfa || [];
    window._tfa.push({ notify: "event", name: "page_view", id: TABOOLA_ID });
  }, [location.pathname, location.search]);

  return null;
}