import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

function StatusPill({ status }) {
  if (status === "success") return (
    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
      <CheckCircle className="w-3 h-3" /> Connected
    </Badge>
  );
  if (status === "failed") return (
    <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
      <XCircle className="w-3 h-3" /> Error
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <Clock className="w-3 h-3" /> Not tested
    </Badge>
  );
}

export function MaskedField({ label, value, onReveal }) {
  const [revealed, setRevealed] = useState(false);
  const [timer, setTimer] = useState(null);

  const handleReveal = () => {
    if (revealed) {
      setRevealed(false);
      if (timer) clearTimeout(timer);
      return;
    }
    setRevealed(true);
    const t = setTimeout(() => setRevealed(false), 30000);
    setTimer(t);
    if (onReveal) onReveal();
  };

  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground w-28 flex-shrink-0">{label}:</span>
      <span className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
        {revealed ? value : "••••••••••••"}
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={handleReveal} className="h-7 px-2">
        {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
}

export default function IntegrationCard({
  icon,
  name,
  description,
  status,
  lastTested,
  enabled,
  onToggle,
  onTest,
  onSave,
  testMessage,
  testing,
  children,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="rounded-xl border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="w-9 h-9 flex-shrink-0">{icon}</div>}
            <div>
              <h3 className="font-semibold text-foreground text-sm">{name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <StatusPill status={status} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {lastTested && (
          <p className="text-xs text-muted-foreground mt-1">
            Last tested: {format(new Date(lastTested), "MMM d, yyyy HH:mm")}
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4 border-t border-border">
          <div className="pt-4 space-y-4">
            {children}
          </div>

          {testMessage && (
            <div className={`text-xs rounded-lg px-3 py-2 font-mono ${
              status === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {testMessage}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={onToggle} />
              <span className="text-sm text-muted-foreground">{enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onTest}
                disabled={testing}
                className="gap-1.5"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Test Connection
              </Button>
              <Button type="button" size="sm" onClick={onSave}>
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}