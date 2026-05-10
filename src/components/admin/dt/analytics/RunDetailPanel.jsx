import React, { useState } from "react";
import { X, Clock, Tag, AlertTriangle, Bell, Play, Eye, EyeOff } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const TABS = [
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "fields", label: "Field Values", icon: Eye },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "errors", label: "Errors", icon: AlertTriangle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "replay", label: "Replay", icon: Play },
];

const PII_KEYS = ["first_name", "last_name", "email", "phone", "address", "city", "zip", "zip_code"];

export default function RunDetailPanel({ run, nodes, onClose }) {
  const [activeTab, setActiveTab] = useState("timeline");
  const [revealPii, setRevealPii] = useState(false);

  const nodeLabel = (nodeId) => {
    const n = nodes.find(n => (n.node_id || n.id) === nodeId);
    return n?.label || n?.title_display || nodeId?.slice(0, 12) + "...";
  };

  const fv = run.field_values || {};
  const path = run.path_taken || [];
  const errors = run.errors || [];
  const notifications = run.notifications_log || [];
  const tags = run.tags || [];

  const formatTime = (iso) => {
    if (!iso) return "-";
    try { return format(new Date(iso), "MMM d, h:mm:ss a"); } catch { return iso; }
  };

  const replayUrl = `/q/${run.quiz_id}?replay=1&run_id=${run.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="w-full max-w-xl h-full bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Run Detail</p>
            <p className="text-xs text-muted-foreground font-mono">{run.session_id?.slice(0, 16)}...</p>
          </div>
          <div className="flex items-center gap-2">
            {run.qualification_tier && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${run.is_qualified ? "bg-green-100 text-green-700" : run.is_disqualified ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                {run.qualification_tier}
              </span>
            )}
            <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border overflow-x-auto flex-shrink-0 bg-card">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Timeline */}
          {activeTab === "timeline" && (
            <div className="p-4 space-y-2">
              {path.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No path data recorded.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {path.map((step, i) => (
                    <div key={i} className="relative pl-10 pb-4">
                      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      <div className="bg-card rounded-lg border border-border p-3">
                        <p className="text-sm font-medium text-foreground">{nodeLabel(step.node_id)}</p>
                        <p className="text-xs text-muted-foreground font-mono">{step.node_id?.slice(0, 12)}...</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {step.entered_at && <span>Entered: {formatTime(step.entered_at)}</span>}
                          {step.dwell_seconds > 0 && <span className="text-blue-600">Dwell: {step.dwell_seconds}s</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Field Values */}
          {activeTab === "fields" && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Captured Field Values</h4>
                <button onClick={() => setRevealPii(!revealPii)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {revealPii ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {revealPii ? "Mask PII" : "Reveal PII"}
                </button>
              </div>
              <div className="space-y-1">
                {Object.entries(fv).sort().map(([k, v]) => {
                  const isPii = PII_KEYS.includes(k);
                  const display = isPii && !revealPii ? "••••••••" : String(v || "");
                  return (
                    <div key={k} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <span className="text-xs font-mono text-muted-foreground min-w-[140px] flex-shrink-0">{k}</span>
                      <span className={`text-xs text-foreground break-all ${isPii && !revealPii ? "font-mono" : ""}`}>{display}</span>
                      {isPii && <span className="text-xs text-amber-500 ml-auto flex-shrink-0">PII</span>}
                    </div>
                  );
                })}
                {Object.keys(fv).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No field values captured.</p>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {activeTab === "tags" && (
            <div className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Applied Tags</h4>
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No tags applied to this run.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {activeTab === "errors" && (
            <div className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Error Log</h4>
              {errors.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">✓</div>
                  <p className="text-sm text-green-600 font-medium">No errors recorded for this run.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errors.map((err, i) => (
                    <div key={i} className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-red-800">{err.error_message}</p>
                        <span className="text-xs text-red-500 ml-2 flex-shrink-0">{formatTime(err.occurred_at)}</span>
                      </div>
                      {err.node_id && <p className="text-xs text-red-600 mt-1 font-mono">Node: {err.node_id.slice(0, 12)}</p>}
                      {err.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-500 cursor-pointer">Stack trace</summary>
                          <pre className="text-xs text-red-700 mt-1 overflow-auto">{err.stack}</pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Notifications Log</h4>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No notifications sent for this run.</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${n.status === "success" ? "bg-green-500" : "bg-red-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{n.channel} - {n.recipient}</p>
                        {n.error_message && <p className="text-xs text-red-500 truncate">{n.error_message}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(n.sent_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Replay */}
          {activeTab === "replay" && (
            <div className="p-4 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Run Replay</h4>
              <p className="text-xs text-muted-foreground">View the tree as this user experienced it, with their field values pre-loaded. Form submissions and side effects are disabled.</p>
              <a
                href={replayUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
                <Play className="w-4 h-4" />
                Open Replay in New Tab
              </a>
              <div className="rounded-lg border border-border overflow-hidden" style={{ height: 500 }}>
                <iframe
                  src={replayUrl}
                  className="w-full h-full"
                  title="Run Replay"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}