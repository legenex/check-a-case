import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

function buildPathKey(run) {
  if (!run.path_taken || !run.path_taken.length) return null;
  return run.path_taken.map(s => s.node_id).join(" > ");
}

export default function PathExplorer({ runs, nodes }) {
  const [showMore, setShowMore] = useState(false);

  const nodeLabel = (nodeId) => {
    const n = nodes.find(n => (n.node_id || n.id) === nodeId);
    return n?.label || n?.title_display || nodeId?.slice(0, 8) + "...";
  };

  const pathMap = {};
  for (const run of runs) {
    const key = buildPathKey(run);
    if (!key) continue;
    if (!pathMap[key]) pathMap[key] = { key, runs: [], count: 0 };
    pathMap[key].runs.push(run);
    pathMap[key].count++;
  }

  const paths = Object.values(pathMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, showMore ? 50 : 10);

  const total = runs.length || 1;

  if (paths.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
        No path data yet. Runs with path_taken data will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Top Paths Through Tree</h3>
      <div className="space-y-3">
        {paths.map((path, idx) => {
          const nodeIds = path.key.split(" > ");
          const completed = path.runs.filter(r => r.is_complete).length;
          const qualified = path.runs.filter(r => r.is_qualified).length;
          const completionRate = path.count > 0 ? Math.round((completed / path.count) * 100) : 0;
          const qualRate = completed > 0 ? Math.round((qualified / completed) * 100) : 0;
          const dwells = path.runs
            .filter(r => r.path_taken)
            .map(r => (r.path_taken || []).reduce((sum, s) => sum + (s.dwell_seconds || 0), 0))
            .filter(d => d > 0);
          const avgDwell = dwells.length > 0 ? Math.round(dwells.reduce((s, v) => s + v, 0) / dwells.length) : 0;

          return (
            <div key={idx} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center flex-wrap gap-1 flex-1 min-w-0">
                  {nodeIds.slice(0, 8).map((id, i) => (
                    <React.Fragment key={i}>
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded max-w-[100px] truncate" title={nodeLabel(id)}>
                        {nodeLabel(id)}
                      </span>
                      {i < Math.min(nodeIds.length, 8) - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                  {nodeIds.length > 8 && <span className="text-xs text-muted-foreground">+{nodeIds.length - 8} more</span>}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-foreground">{path.count}</p>
                  <p className="text-xs text-muted-foreground">{Math.round((path.count / total) * 100)}% of runs</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">{completionRate}% complete</span>
                <span className="text-amber-600 font-medium">{qualRate}% qualified</span>
                {avgDwell > 0 && <span>{avgDwell >= 60 ? `${Math.floor(avgDwell/60)}m ${avgDwell%60}s` : `${avgDwell}s`} avg</span>}
                <span>{nodeIds.length} steps</span>
              </div>
            </div>
          );
        })}
      </div>
      {Object.keys(pathMap).length > 10 && (
        <button onClick={() => setShowMore(!showMore)}
          className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          {showMore ? "Show Less" : `Show More (${Object.keys(pathMap).length - 10} more paths)`}
        </button>
      )}
    </div>
  );
}