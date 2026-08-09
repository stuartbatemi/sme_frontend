import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Card, Badge } from "../common/UI";

// Static brand hex values (matching legacy.css) rather than
// var(--clr-...) — Recharts' <Cell fill=...> renders as a raw SVG
// presentation attribute, and CSS custom properties don't resolve
// inside plain attribute strings, only inside style/CSS values. Using
// var() here silently produced invisible/black slices.
const POSITION_COLORS = ["#0D6E6E", "#CBD5E1"];
const TIMELINE_COLORS = ["#E8A838", "#16A34A"];

interface BusinessPieChartsProps {
  activity: string;
  startupCapitalTzs: number;
  monthlyProfitTzs: number;
  breakevenMonths: number;
  existingSimilarBusinesses: number;
  t: (key: string) => string;
}

/**
 * Deeper, per-business analysis in donut form — shown once a business is
 * selected from the recommendation list rather than crowding every card
 * in the grid. Two charts:
 *  - Market position: this business vs. how many similar businesses
 *    already exist nearby (a quick read on saturation for this one idea).
 *  - Capital recovery timeline: how a first year splits between
 *    "still recovering capital" and "generating net profit", based on
 *    the modelled break-even month.
 */
export function BusinessPieCharts({
  startupCapitalTzs,
  monthlyProfitTzs,
  breakevenMonths,
  existingSimilarBusinesses,
  t,
}: BusinessPieChartsProps) {
  void startupCapitalTzs;
  void monthlyProfitTzs;

  const similar = Math.max(0, Number(existingSimilarBusinesses) || 0);
  const positionData = [
    { name: t("chart.this_business"), value: 1 },
    { name: t("chart.similar_nearby_slice"), value: similar },
  ];

  const breakeven = Math.max(0, Number(breakevenMonths) || 0);
  const recoveringMonths = Math.min(breakeven, 12);
  const profitingMonths = Math.max(0, 12 - recoveringMonths);
  const timelineData = [
    { name: t("chart.recovering_capital"), value: recoveringMonths || 0.0001 },
    { name: t("chart.generating_profit"), value: profitingMonths },
  ];
  const beyondYearOne = breakeven > 12 ? Math.round(breakeven - 12) : 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "var(--space-4)",
      }}
    >
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
              fontSize: 12,
              color: "var(--clr-text-3)",
              fontWeight: 700,
              letterSpacing: ".4px",
            }}
          >
            {t("chart.market_position_title")}
          </p>
          <Badge label="premium" />
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={positionData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={74}
              paddingAngle={3}
              isAnimationActive={false}
            >
              {positionData.map((_, i) => (
                <Cell key={i} fill={POSITION_COLORS[i % POSITION_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [`${value}`, name]}
              contentStyle={{
                background: "var(--clr-card)",
                border: "1px solid var(--clr-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              wrapperStyle={{ fontSize: 11, color: "var(--clr-text-2)" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <p
          style={{
            fontSize: 11,
            color: "var(--clr-text-3)",
            textAlign: "center",
            marginTop: 2,
          }}
        >
          {similar} {t("chart.similar_nearby_caption")}
        </p>
      </Card>

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
              fontSize: 12,
              color: "var(--clr-text-3)",
              fontWeight: 700,
              letterSpacing: ".4px",
            }}
          >
            {t("chart.capital_timeline_title")}
          </p>
          <Badge label="premium" />
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={timelineData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={74}
              paddingAngle={3}
              isAnimationActive={false}
            >
              {timelineData.map((_, i) => (
                <Cell key={i} fill={TIMELINE_COLORS[i % TIMELINE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [
                `${Math.round(Number(value))} ${t("advisor.months_unit")}`,
                name,
              ]}
              contentStyle={{
                background: "var(--clr-card)",
                border: "1px solid var(--clr-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              wrapperStyle={{ fontSize: 11, color: "var(--clr-text-2)" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <p
          style={{
            fontSize: 11,
            color: "var(--clr-text-3)",
            textAlign: "center",
            marginTop: 2,
          }}
        >
          {beyondYearOne > 0
            ? `${t("chart.breakeven_beyond_year_prefix")} ${beyondYearOne} ${t(
                "chart.breakeven_beyond_year_suffix",
              )}`
            : `${t("chart.breakeven_marker")}: ${Math.round(breakeven)} ${t("advisor.months_unit")}`}
        </p>
      </Card>
    </div>
  );
}
