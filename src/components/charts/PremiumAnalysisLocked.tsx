import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "../common/UI";

interface PremiumAnalysisLockedProps {
  t: (key: string) => string;
}

export function PremiumAnalysisLocked({ t }: PremiumAnalysisLockedProps) {
  const navigate = useNavigate();
  return (
    <Card
      style={{
        textAlign: "center",
        border: "1.5px dashed var(--clr-accent)",
        background: "var(--clr-accent-lt)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.05rem",
          marginBottom: 6,
          color: "var(--clr-text)",
        }}
      >
        {t("chart.premium_locked_title")}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--clr-text-2)",
          maxWidth: 480,
          margin: "0 auto var(--space-4)",
          lineHeight: 1.6,
        }}
      >
        {t("chart.premium_locked_body")}
      </p>
      <Button onClick={() => navigate("/upgrade")}>
        {t("chart.premium_locked_cta")}
      </Button>
    </Card>
  );
}
