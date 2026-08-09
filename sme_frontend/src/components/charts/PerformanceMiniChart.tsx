import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { resolveCssVar } from "../../lib/chartTheme";

interface PerformanceMiniChartProps {
  profit: number;
  roi: number;
  breakevenMonths: number;
  /** Best values across the businesses currently shown on this page —
   *  used to normalize each business's bars to a 0-100 relative scale
   *  so cards can be compared at a glance. */
  pageMaxProfit: number;
  pageMaxRoi: number;
  pageMinBreakeven: number;
  labels: { profit: string; roi: string; speed: string; tapHint: string };
}

/**
 * Compact three-metric performance chart for a single recommendation
 * card: Profit / ROI / Speed-to-breakeven, each normalized against the
 * best performer on the current page (so "who's actually strongest
 * here" reads at a glance, not just absolute numbers).
 *
 * Touch-friendly by design: recharts translates a tap into the same
 * onClick/Tooltip events as a mouse click, so no separate touch
 * handling is needed — tapping a bar reveals its exact figure below
 * the chart (not just an easy-to-miss hover tooltip).
 */
export function PerformanceMiniChart({
  profit,
  roi,
  breakevenMonths,
  pageMaxProfit,
  pageMaxRoi,
  pageMinBreakeven,
  labels,
}: PerformanceMiniChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const textMutedColor = resolveCssVar("--clr-text-3", "#9CA3AF");
  const bgMutedColor = resolveCssVar("--clr-bg-2", "#F3F4F6");

  // Speed score: fastest break-even on the page = 100, slower = lower.
  const speedScore =
    breakevenMonths > 0
      ? Math.min(100, Math.round((pageMinBreakeven / breakevenMonths) * 100))
      : 0;

  const data = [
    {
      name: labels.profit,
      value: pageMaxProfit > 0 ? Math.round((profit / pageMaxProfit) * 100) : 0,
      raw: `TZS ${Math.round(profit).toLocaleString()}`,
      // Recharts renders Cell's `fill` as a raw SVG presentation
      // attribute, and CSS custom properties (var(--clr-primary)) don't
      // resolve inside plain attribute strings the way they do inside
      // a style/CSS value — that silently produced solid black bars.
      // Using the same static brand hex values defined in legacy.css
      // sidesteps that entirely.
      color: "#0D6E6E",
    },
    {
      name: labels.roi,
      value: pageMaxRoi > 0 ? Math.round((roi / pageMaxRoi) * 100) : 0,
      raw: `${roi}%`,
      color: "#E8A838",
    },
    {
      name: labels.speed,
      value: speedScore,
      raw: `${breakevenMonths} mo`,
      color: "#16A34A",
    },
  ];

  return (
    <div style={{ marginTop: "var(--space-3)" }}>
      <ResponsiveContainer width="100%" height={96}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 10, left: 0, bottom: 2 }}
          onClick={(state: any) => {
            const idx = state?.activeTooltipIndex;
            setActiveIndex(idx === undefined ? null : idx);
          }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={58}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: textMutedColor }}
          />
          <Tooltip
            cursor={{ fill: bgMutedColor }}
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div
                  style={{
                    background: "var(--clr-card)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--clr-text)",
                  }}
                >
                  {p.name}: {p.raw}
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={13} isAnimationActive={false}>
            {data.map((d, idx) => (
              <Cell
                key={idx}
                fill={d.color}
                opacity={activeIndex === null || activeIndex === idx ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p
        style={{
          fontSize: 10,
          color: "var(--clr-text-3)",
          textAlign: "center",
          marginTop: 2,
        }}
      >
        {activeIndex !== null
          ? `${data[activeIndex].name}: ${data[activeIndex].raw}`
          : labels.tapHint}
      </p>
    </div>
  );
}
