import React from "react";

const LEVELS = [
  { value: "very_low", color: "#2F9E44" },
  { value: "low", color: "#74B816" },
  { value: "average", color: "#E8A838" },
  { value: "high", color: "#F08C00" },
  { value: "very_high", color: "#E03131" },
];

interface RiskToleranceScaleProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: string;
  levelLabels: Record<string, string>;
}

/**
 * A 5-segment colored scale (green -> red, cautious -> aggressive) for
 * picking how much risk the person is willing to take on in the
 * businesses they're shown. Clicking a segment selects it; the
 * selected segment scales up and the others dim, so the choice is
 * unambiguous without needing a separate label readout.
 */
export function RiskToleranceScale({ value, onChange, label, hint, levelLabels }: RiskToleranceScaleProps) {
  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--clr-text-2)",
          marginBottom: "var(--space-2)",
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", gap: 6 }}>
        {LEVELS.map((lvl) => {
          const selected = value === lvl.value;
          return (
            <button
              key={lvl.value}
              type="button"
              onClick={() => onChange(selected ? "" : lvl.value)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                border: selected ? "2.5px solid var(--clr-text)" : "1.5px solid transparent",
                background: lvl.color,
                opacity: selected ? 1 : 0.55,
                cursor: "pointer",
                transform: selected ? "scale(1.06)" : "scale(1)",
                transition: "all 0.15s ease",
                boxShadow: selected ? `0 3px 10px ${lvl.color}66` : "none",
              }}
              aria-pressed={selected}
              aria-label={levelLabels[lvl.value] || lvl.value}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <span style={{ fontSize: 10.5, color: "var(--clr-text-3)" }}>
          {levelLabels.very_low}
        </span>
        <span style={{ fontSize: 10.5, color: "var(--clr-text-3)" }}>
          {levelLabels.very_high}
        </span>
      </div>
      {value && (
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: LEVELS.find((l) => l.value === value)?.color,
            marginTop: 4,
          }}
        >
          {levelLabels[value]}
        </p>
      )}
      {hint && (
        <p style={{ fontSize: 11.5, color: "var(--clr-text-3)", marginTop: 4 }}>{hint}</p>
      )}
    </div>
  );
}
