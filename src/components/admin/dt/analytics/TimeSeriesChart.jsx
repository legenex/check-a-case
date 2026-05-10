import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { eachDayOfInterval, format, startOfDay } from "date-fns";

export default function TimeSeriesChart({ runs, dateFrom, dateTo }) {
  const days = eachDayOfInterval({ start: startOfDay(dateFrom), end: startOfDay(dateTo) });

  const data = days.map(day => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayRuns = runs.filter(r => r.started_at && r.started_at.startsWith(dayStr));
    return {
      date: format(day, "MMM d"),
      Starts: dayRuns.length,
      Completes: dayRuns.filter(r => r.is_complete).length,
      Qualified: dayRuns.filter(r => r.is_qualified).length,
    };
  });

  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Starts / Completes / Qualified Over Time</h3>
      {data.length < 2 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Not enough data for this range.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Starts" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Completes" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Qualified" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}