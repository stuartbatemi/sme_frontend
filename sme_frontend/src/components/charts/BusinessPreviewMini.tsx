import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TierBadge } from "../common/UI";

interface BusinessPreviewMiniProps {
  rec: any;
  isPremium?: boolean;
  fmt: (n: any) => string;
  t: (key: string) => string;
}

const POSITION_COLORS = ["#0D6E6E", "#CBD5E1"];

/**
 * Small at-a-glance preview shown in the sidebar when a business card is
 * hovered, before the person commits to opening its full analysis page.
 * Deliberately lightweight — just enough to help someone decide which
 * card to click into next.
 */
export function BusinessPreviewMini({ rec, isPremium, fmt, t }: BusinessPreviewMiniProps) {
  const similar = Math.max(0, Number(rec.existing_similar_businesses_in_area) || 0);
  const positionData = [
    { name: t("chart.this_business"), value: 1 },
    { name: t("chart.similar_nearby_slice"), value: similar },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <h4
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            margin: 0,
            wordBreak: "break-word",
          }}
        >
          {rec.activity}
        </h4>
        <TierBadge label={rec.success_chance} />
      </div>
      <p style={{ fontSize: 12.5, color: "var(--clr-text-2)", marginBottom: 12 }}>
        {rec.sector}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {[
          [t("advisor.capital_col"), `TZS ${fmt(rec.startup_capital_tzs)}`],
          [t("advisor.profit_col"), `TZS ${fmt(rec.expected_monthly_profit_tzs)}`],
          [t("advisor.roi_col"), `${rec.roi_percent_per_year}%`],
          [t("advisor.breakeven_col"), `${rec.breakeven_months} ${t("advisor.months_unit")}`],
        ].map(([l, v]) => (
          <div
            key={l}
            style={{ background: "var(--clr-bg)", borderRadius: "var(--radius-sm)", padding: "8px 10px" }}
          >
            <div style={{ fontSize: 10, color: "var(--clr-text-3)", fontWeight: 700 }}>{l}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      {isPremium && (
        <div style={{ marginBottom: 4 }}>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={positionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={3}
                isAnimationActive={false}
              >
                {positionData.map((_, i) => (
                  <Cell key={i} fill={POSITION_COLORS[i % POSITION_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 2 }}>
            {[
              [POSITION_COLORS[0], t("chart.this_business")],
              [POSITION_COLORS[1], t("chart.similar_nearby_slice")],
            ].map(([color, label]) => (
              <span
                key={label}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "var(--clr-text-2)" }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color as string, display: "inline-block" }} />
                {label}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--clr-text-3)", textAlign: "center", marginTop: 4 }}>
            {similar} {t("chart.similar_nearby_caption")}
          </p>
        </div>
      )}

      <p
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "var(--clr-accent, var(--clr-primary))",
          marginTop: 8,
        }}
      >
        {t("advisor.tap_for_analysis")}
      </p>
    </div>
  );
}
