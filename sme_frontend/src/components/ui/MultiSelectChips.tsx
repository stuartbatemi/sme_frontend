import React from "react";

interface Option {
  code: string;
  name: string;
}

interface MultiSelectChipsProps {
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  label: string;
  hint?: string;
  emptyLabel?: string;
}

/**
 * Toggle-able chip picker for multi-select fields (skills). Tapping a
 * chip adds/removes it from the selection — no dropdown-within-dropdown
 * fuss, and every option is visible and reachable at once, which
 * matters on a touch screen with a modest-length list like this one.
 */
export function MultiSelectChips({
  options,
  selected,
  onChange,
  label,
  hint,
  emptyLabel,
}: MultiSelectChipsProps) {
  function toggle(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

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
      {options.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--clr-text-3)" }}>{emptyLabel}</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {options.map((opt) => {
            const isSelected = selected.includes(opt.code);
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => toggle(opt.code)}
                aria-pressed={isSelected}
                style={{
                  padding: "7px 13px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isSelected
                    ? "1.5px solid var(--clr-primary)"
                    : "1.5px solid var(--clr-border)",
                  background: isSelected ? "var(--clr-primary)" : "var(--clr-card)",
                  color: isSelected ? "white" : "var(--clr-text-2)",
                  transition: "all 0.12s ease",
                }}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      )}
      {hint && (
        <p style={{ fontSize: 11.5, color: "var(--clr-text-3)", marginTop: 6 }}>{hint}</p>
      )}
    </div>
  );
}
