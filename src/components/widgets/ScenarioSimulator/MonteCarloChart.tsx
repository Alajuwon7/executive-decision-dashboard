"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import type { MonteCarloResults } from "@/lib/data/types";
import { cn } from "@/lib/utils/formatters";
import { formatCompactCurrency } from "@/lib/utils/currency";

interface Props {
  results: MonteCarloResults | null;
}

function probColor(p: number): string {
  if (p >= 75) return "#22C55E";
  if (p >= 50) return "#F59E0B";
  return "#EF4444";
}

export function MonteCarloChart({ results }: Props) {
  if (!results) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">
          Goal Probabilities ({results.simulations.toLocaleString()} simulations)
        </p>
        <div className="space-y-2">
          {results.goalProbabilities.length === 0 && (
            <p className="text-xs text-text-faint italic">No goals with target dates to simulate.</p>
          )}
          {results.goalProbabilities.map((g) => (
            <div key={g.goalId}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-muted truncate max-w-[60%]">{g.goalTitle}</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    g.probabilityOfSuccess >= 75 ? "text-success" : g.probabilityOfSuccess >= 50 ? "text-accent" : "text-danger"
                  )}
                >
                  {g.probabilityOfSuccess.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${g.probabilityOfSuccess}%`,
                    backgroundColor: probColor(g.probabilityOfSuccess),
                  }}
                />
              </div>
              <p className="text-[10px] text-text-faint mt-0.5 font-mono">
                P50: {g.p50Date} · P10: {g.p10Date} · P90: {g.p90Date}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-2">Surplus Distribution</p>
        <div className="h-40 bg-surface-elevated rounded-card p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={results.histogram.map((h) => ({ bucket: Math.round((h.bucketMin + h.bucketMax) / 2), count: h.count }))}>
              <XAxis dataKey="bucket" stroke="#525252" fontSize={10} tickFormatter={(v) => formatCompactCurrency(v)} />
              <YAxis stroke="#525252" fontSize={10} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", fontSize: 11 }}
                formatter={(v: any) => [v, "count"]}
                labelFormatter={(v) => `~${formatCompactCurrency(Number(v))}`}
              />
              <ReferenceLine x={0} stroke="#F59E0B" strokeDasharray="3 3" />
              <Bar dataKey="count">
                {results.histogram.map((h, i) => (
                  <Cell key={i} fill={h.bucketMin >= 0 ? "#14B8A6" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-5 gap-1 mt-2 text-[10px] font-mono text-text-faint">
          <div>P10 <span className="text-text-muted block">{formatCompactCurrency(results.surplusDistribution.p10)}</span></div>
          <div>P25 <span className="text-text-muted block">{formatCompactCurrency(results.surplusDistribution.p25)}</span></div>
          <div>P50 <span className="text-text-muted block">{formatCompactCurrency(results.surplusDistribution.p50)}</span></div>
          <div>P75 <span className="text-text-muted block">{formatCompactCurrency(results.surplusDistribution.p75)}</span></div>
          <div>P90 <span className="text-text-muted block">{formatCompactCurrency(results.surplusDistribution.p90)}</span></div>
        </div>
      </div>
    </div>
  );
}
