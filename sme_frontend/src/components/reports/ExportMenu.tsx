import React, { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import { exportCsv, exportExcel, exportPdf, ReportRow, ReportMeta } from "../../lib/reportExport";

interface ExportMenuProps {
  rows: ReportRow[];
  meta: ReportMeta;
  filenameBase: string;
  /** Ref to the on-screen container of charts to snapshot into the PDF
   * (donut/bar/mini/trend charts). Optional — PDF still works as a
   * text+table report without it, just without the visual pages. */
  chartsContainerRef?: React.RefObject<HTMLElement>;
  t: (key: string) => string;
}

export function ExportMenu({ rows, meta, filenameBase, chartsContainerRef, t }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handle(kind: "csv" | "excel" | "pdf") {
    // Close the dropdown *before* capturing anything — otherwise the
    // open menu is still part of the live DOM when html2canvas clones
    // the charts container and ends up baked into the PDF image on top
    // of the charts. Waiting a couple of animation frames lets React
    // actually remove it from the DOM first.
    setOpen(false);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    setBusy(kind);
    try {
      if (kind === "csv") exportCsv(rows, meta, filenameBase);
      else if (kind === "excel") exportExcel(rows, meta, filenameBase);
      else await exportPdf(rows, meta, filenameBase, chartsContainerRef?.current ?? null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy !== null}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "var(--clr-card)",
          border: "1.5px solid var(--clr-primary)",
          color: "var(--clr-primary-dk, var(--clr-primary))",
          borderRadius: 10,
          padding: "9px 16px",
          fontSize: 13,
          fontWeight: 700,
          cursor: busy !== null ? "not-allowed" : "pointer",
          opacity: busy !== null ? 0.7 : 1,
        }}
      >
        <Download size={15} />
        {busy !== null ? t("export.generating") : t("export.button")}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 30,
            background: "var(--clr-card)",
            border: "1px solid var(--clr-border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            minWidth: 240,
            overflow: "hidden",
          }}
        >
          {[
            { kind: "csv" as const, label: t("export.csv") },
            { kind: "excel" as const, label: t("export.excel") },
            { kind: "pdf" as const, label: t("export.pdf") },
          ].map((opt) => (
            <button
              key={opt.kind}
              onClick={() => handle(opt.kind)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "11px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--clr-text)",
                background: "none",
                border: "none",
                borderBottom: "1px solid var(--clr-border)",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
