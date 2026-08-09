import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, Badge } from "../common/UI";
import { resolveCssVar } from "../../lib/chartTheme";

const TIER_COLORS: Record<string, string> = {
  High: "#2F9E44",
  Medium: "#E8A838",
  Low: "#E03131",
};

interface Rec {
  activity: string;
  success_chance: string;
  expected_monthly_profit_tzs: number;
}

interface PremiumAnalysisPanelProps {
  recs: Rec[];
  activeTier: string;
  onTierClick: (tier: string) => void;
  t: (key: string) => string;
  formatTzsTick: (v: number) => string;
}

/**
 * The full premium analysis suite: an interactive donut (tap a slice to
 * filter the recommendation list below by that tier — this panel and
 * the tier filter share one source of truth via onTierClick/activeTier,
 * so it's a real control, not just decoration) plus a touch-friendly
 * profit comparison bar chart capped at the top 10 for readability.
 */
export function PremiumAnalysisPanel({
  recs,
  activeTier,
  onTierClick,
  t,
  formatTzsTick,
}: PremiumAnalysisPanelProps) {
  const [barActive, setBarActive] = useState<number | null>(null);
  // Resolved once per render — Recharts renders stroke/fill/tick.fill as
  // raw SVG attributes, and CSS var() only resolves inside real CSS
  // values, not plain attribute strings. See chartTheme.ts.
  const borderColor = resolveCssVar("--clr-border", "#E5E7EB");
  const textMutedColor = resolveCssVar("--clr-text-3", "#9CA3AF");
  const textColor2 = resolveCssVar("--clr-text-2", "#4B5563");
  const bgMutedColor = resolveCssVar("--clr-bg-2", "#F3F4F6");

  const total = recs.length;
  const pieData = ["High", "Medium", "Low"]
    .map((cat) => ({
      name: t(`chart.${cat.toLowerCase()}`),
      key: cat,
      value: recs.filter((r) => r.success_chance === cat).length,
    }))
    .filter((d) => d.value > 0);

  const topBarData = [...recs]
    .sort(
      (a, b) =>
        (Number(b.expected_monthly_profit_tzs) || 0) -
        (Number(a.expected_monthly_profit_tzs) || 0),
    )
    .slice(0, 10)
    .map((r) => ({
      fullName: r.activity,
      name: r.activity?.length > 22 ? r.activity.slice(0, 22) + "…" : r.activity,
      profit: Number(r.expected_monthly_profit_tzs) || 0,
      tier: r.success_chance,
    }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "var(--space-4)",
      }}
    >
      {/* ── Interactive donut: tap a slice to filter the list below ── */}
      {pieData.length > 0 && (
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-3)",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "var(--clr-text-3)",
                fontWeight: 700,
                letterSpacing: ".4px",
              }}
            >
              {t("chart.success_distribution")}
            </p>
            <Badge label="premium" />
          </div>
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={82}
                  paddingAngle={3}
                  cursor="pointer"
                  onClick={(entry: any) =>
                    onTierClick(entry.key === activeTier ? "" : entry.key)
                  }
                  isAnimationActive
                >
                  {pieData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={TIER_COLORS[entry.key] || "#888"}
                      opacity={
                        !activeTier || activeTier === entry.key ? 1 : 0.35
                      }
                      stroke={activeTier === entry.key ? "var(--clr-text)" : "none"}
                      strokeWidth={activeTier === entry.key ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value}`, name]}
                  contentStyle={{
                    background: "var(--clr-card)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total — classic donut treatment */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--clr-text)" }}>
                {total}
              </div>
              <div style={{ fontSize: 10, color: "var(--clr-text-3)", fontWeight: 700 }}>
                {t("chart.businesses_label")}
              </div>
            </div>
          </div>
          {/* Legend doubles as touch targets — bigger tap area than tiny chart slices,
              and this is where the tier breakdown text lives (NOT inside the donut,
              which only ever holds the short number+word center label). */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "var(--space-3)",
              marginTop: "var(--space-2)",
              flexWrap: "wrap",
            }}
          >
            {pieData.map((d) => (
              <button
                key={d.key}
                onClick={() => onTierClick(d.key === activeTier ? "" : d.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 8px",
                  borderRadius: 8,
                  opacity: !activeTier || activeTier === d.key ? 1 : 0.45,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: TIER_COLORS[d.key],
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--clr-text-2)" }}>
                  {d.name} ({d.value})
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ── Touch-friendly profit comparison, top 10 for readability ──
          Horizontal bars, not vertical-with-rotated-labels: rotated
          diagonal text overlaps itself once names get past ~10
          characters, which Swahili business names routinely do.
          Reading left-to-right down a list avoids that entirely. */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-3)",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "var(--clr-text-3)",
              fontWeight: 700,
              letterSpacing: ".4px",
            }}
          >
            {t("chart.profit_comparison")}
            {recs.length > 10 ? ` (top 10 / ${recs.length})` : ""}
          </p>
          <Badge label="premium" />
        </div>
        <ResponsiveContainer width="100%" height={Math.max(220, topBarData.length * 34)}>
          <BarChart
            data={topBarData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
            onClick={(state: any) => {
              const idx = state?.activeTooltipIndex;
              setBarActive(idx === undefined ? null : idx);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: textMutedColor }}
              tickFormatter={formatTzsTick}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={128}
              tick={{ fontSize: 11, fill: textColor2 }}
              axisLine={false}
              tickLine={false}
              interval={0}
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
                      padding: "6px 12px",
                      fontSize: 12,
                      maxWidth: 220,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{p.fullName}</div>
                    <div>TZS {p.profit.toLocaleString()}</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="profit" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {topBarData.map((d, i) => (
                <Cell
                  key={i}
                  fill={TIER_COLORS[d.tier] || "#0D6E6E"}
                  opacity={barActive === null || barActive === i ? 1 : 0.4}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 10, color: "var(--clr-text-3)", textAlign: "center", marginTop: 4 }}>
          {t("chart.tap_for_details")}
        </p>
      </Card>
    </div>
  );
}
