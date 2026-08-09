import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { resolveCssVar } from "../../lib/chartTheme";

interface BusinessTrendChartProps {
  capitalTzs: number;
  monthlyProfitTzs: number;
  breakevenMonths: number;
  t: (key: string) => string;
}

/**
 * Illustrative cumulative net-position trajectory for a single business,
 * month 0 through breakeven + 6 (capped at 24 months).
 *
 * This is NOT observed/historical data — there's no real month-by-month
 * time series for any of these activities. It's a disclosed, simple
 * ramp-up model (50% of steady-state profit in months 1-2, full
 * estimated profit from month 3 onward) starting from -capital, so the
 * shape is illustrative of WHEN the business is expected to turn the
 * corner — the breakeven marker itself comes from the real model
 * estimate, not from this chart's own math, so the two stay consistent
 * even though the curve in between is a simplification.
 */
export function BusinessTrendChart({
  capitalTzs,
  monthlyProfitTzs,
  breakevenMonths,
  t,
}: BusinessTrendChartProps) {
  const horizon = Math.min(24, Math.max(6, Math.round(breakevenMonths) + 6));

  // Resolved once per render — see chartTheme.ts for why this can't
  // just be "var(--clr-border)" passed straight to stroke/fill.
  const borderColor = resolveCssVar("--clr-border", "#E5E7EB");
  const textMutedColor = resolveCssVar("--clr-text-3", "#9CA3AF");
  const accentColor = "#E8A838";
  const primaryColor = "#0D6E6E";

  const data = [];
  let cumulative = -capitalTzs;
  data.push({ month: 0, net: Math.round(cumulative) });
  for (let m = 1; m <= horizon; m++) {
    const rampFactor = m <= 2 ? 0.5 : 1;
    cumulative += monthlyProfitTzs * rampFactor;
    data.push({ month: m, net: Math.round(cumulative) });
  }

  function formatTick(v: number) {
    const abs = Math.abs(v);
    const sign = v < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K`;
    return String(v);
  }

  return (
    <div style={{ marginTop: "var(--space-3)" }}>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 22, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: textMutedColor }}
            tickFormatter={(m: number) => `M${m}`}
          />
          <YAxis tick={{ fontSize: 10, fill: textMutedColor }} tickFormatter={formatTick} />
          <ReferenceLine y={0} stroke={textMutedColor} strokeDasharray="2 2" />
          <ReferenceLine
            x={Math.round(breakevenMonths)}
            stroke={accentColor}
            strokeWidth={1.5}
            label={{
              value: t("chart.breakeven_marker"),
              fontSize: 10,
              fontWeight: 700,
              fill: accentColor,
              position: "top",
              offset: 8,
            }}
          />
          <Tooltip
            formatter={(v: any) => [`TZS ${Number(v).toLocaleString()}`, t("chart.net_position")]}
            labelFormatter={(m: any) => `${t("chart.month_label")} ${m}`}
            contentStyle={{
              background: "var(--clr-card)",
              border: "1px solid var(--clr-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke={primaryColor}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 9.5, color: "var(--clr-text-3)", textAlign: "center", marginTop: 2 }}>
        {t("chart.trajectory_disclaimer")}
      </p>
    </div>
  );
}
