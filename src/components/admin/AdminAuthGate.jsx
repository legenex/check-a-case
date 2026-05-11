import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const ALLOWED_ROLES = new Set(["admin", "Admin", "editor", "Editor", "analyst", "Analyst"]);

export default function AdminAuthGate({ children }) {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const me = await base44.auth.me();
        if (!alive) return;

        if (!me || !me.email) {
          setStatus("unauthenticated");
          return;
        }

        if (me.role && ALLOWED_ROLES.has(me.role)) {
          setUser(me);
          setStatus("authorized");
        } else {
          setUser(me);
          setStatus("forbidden");
        }
      } catch {
        if (alive) setStatus("unauthenticated");
      }
    })();

    return () => { alive = false; };
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <img
            src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png"
            alt="Check A Case"
            className="h-12 mx-auto mb-6"
            loading="lazy"
          />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin sign in required</h1>
          <p className="text-slate-600 mb-6 text-sm">
            This area is restricted to authorized Check A Case team members.
          </p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold hover:shadow-lg transition"
          >
            Sign in with Base44
          </button>
          <p className="text-xs text-slate-400 mt-4">
            Don't have access? Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access denied</h1>
          <p className="text-slate-600 mb-6 text-sm">
            Your account ({user?.email || "this account"}) doesn't have permission to access the admin panel.
          </p>
          <button
            onClick={() => base44.auth.logout("/")}
            className="text-blue-600 hover:underline text-sm"
          >
            Sign out and return home
          </button>
        </div>
      </div>
    );
  }

  return children;
}