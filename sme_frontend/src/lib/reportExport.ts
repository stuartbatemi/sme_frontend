import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export interface ReportMeta {
  reportTitle: string;
  generatedOnLabel: string;
  generatedOn: string;
  locationLabel: string;
  location: string;
  capitalLabel: string;
  capital: string;
  summaryHeading: string;
  summaryIntro: string;
  disclaimer: string;
  columns: {
    activity: string;
    sector: string;
    successChance: string;
    capital: string;
    monthlyProfit: string;
    annualProfit: string;
    roi: string;
    breakeven: string;
    competition: string;
  };
}

export interface ReportRow {
  activity: string;
  sector: string;
  success_chance: string;
  startup_capital_tzs: number;
  expected_monthly_profit_tzs: number;
  expected_annual_profit_tzs?: number;
  roi_percent_per_year: number;
  breakeven_months: number;
  existing_similar_businesses_in_area?: number;
}

function toSheetRows(rows: ReportRow[], meta: ReportMeta) {
  return rows.map((r) => ({
    [meta.columns.activity]: r.activity,
    [meta.columns.sector]: r.sector,
    [meta.columns.successChance]: r.success_chance,
    [meta.columns.capital]: r.startup_capital_tzs,
    [meta.columns.monthlyProfit]: r.expected_monthly_profit_tzs,
    [meta.columns.annualProfit]:
      r.expected_annual_profit_tzs ?? r.expected_monthly_profit_tzs * 12,
    [meta.columns.roi]: r.roi_percent_per_year,
    [meta.columns.breakeven]: r.breakeven_months,
    [meta.columns.competition]: r.existing_similar_businesses_in_area ?? "",
  }));
}

function filenameSafe(s: string) {
  return s.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
}

/** Plain CSV — opens anywhere, no formatting. */
export function exportCsv(rows: ReportRow[], meta: ReportMeta, filenameBase: string) {
  const sheetRows = toSheetRows(rows, meta);
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filenameSafe(filenameBase)}.csv`);
}

/**
 * Excel workbook, clean typed columns — this is the "Power BI-ready"
 * export. Power BI imports .xlsx directly; there's no real way to
 * generate an actual .pbix file outside Power BI Desktop itself, so
 * a properly-typed, cleanly-headered Excel file is the honest version
 * of "PowerBI form" — it opens straight into Get Data > Excel with no
 * cleanup needed.
 */
export function exportExcel(rows: ReportRow[], meta: ReportMeta, filenameBase: string) {
  const sheetRows = toSheetRows(rows, meta);
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  // Reasonable column widths so it's usable the moment it opens
  ws["!cols"] = [
    { wch: 42 }, { wch: 26 }, { wch: 14 }, { wch: 16 },
    { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Recommendations");
  XLSX.writeFile(wb, `${filenameSafe(filenameBase)}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Light-theme token values, duplicated from ThemeContext's 'light' palette.
// Exports must always read as a clean white document regardless of which
// theme (grey/light/dark) the person is currently browsing in — dark-theme
// cards captured as-is would paste black/near-black boxes onto a "white"
// PDF page, which is what this override exists to prevent.
const EXPORT_LIGHT_TOKENS: Record<string, string> = {
  "--clr-bg": "#FFFFFF",
  "--clr-bg-2": "#F3F4F6",
  "--clr-card": "#FFFFFF",
  "--clr-border": "#E5E7EB",
  "--clr-text": "#111827",
  "--clr-text-2": "#4B5563",
  "--clr-text-3": "#6B7280",
  "--clr-navbar": "#FFFFFF",
  "--shadow-sm": "none",
  "--shadow-md": "none",
  "--clay-highlight": "rgba(0,0,0,0)",
  "--clay-shadow-soft": "rgba(0,0,0,0)",
  "--clay-shadow-deep": "rgba(0,0,0,0)",
  "--navbar-clay-bg": "#FFFFFF",
  "--navbar-clay-bg-soft": "#FFFFFF",
  "--navbar-clay-edge": "rgba(0,0,0,0)",
  "--navbar-clay-inset": "none",
  "--navbar-clay-shadow": "none",
  "--navbar-ink": "#111827",
  "--navbar-ink-dim": "#4B5563",
};

/**
 * Snapshot a DOM node for the PDF, always rendering it as a plain white
 * document no matter what theme (grey/light/dark) is active on screen.
 * html2canvas's `backgroundColor` option only paints the outer canvas —
 * child cards/charts keep whatever dark colors they're using on screen,
 * which is what caused black boxes to show up inside otherwise-white
 * exported pages. Forcing the light palette's CSS variables onto the
 * *cloned* document (via onclone, so the live page never flashes) fixes
 * every descendant that reads var(--clr-card) etc. in one place.
 */
async function captureLight(node: HTMLElement) {
  return html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
      const root = clonedDoc.documentElement;
      const body = clonedDoc.body;
      Object.entries(EXPORT_LIGHT_TOKENS).forEach(([k, v]) => {
        root.style.setProperty(k, v);
        body.style.setProperty(k, v);
      });
      root.setAttribute("data-theme", "light");
      body.setAttribute("data-theme", "light");
      body.style.background = "#ffffff";
      body.style.color = EXPORT_LIGHT_TOKENS["--clr-text"];
      // Belt-and-braces: the captured node itself and anything still
      // carrying a dark inline background get forced white directly,
      // in case a component set an explicit color rather than a var().
      clonedEl.style.background = "#ffffff";
      clonedEl.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const inline = el.getAttribute("style") || "";
        if (/background(-color)?\s*:\s*#(0|1)[0-9a-f]{5}/i.test(inline)) {
          el.style.backgroundColor = "#ffffff";
        }
      });
    },
  });
}

/**
 * PDF report: text cover/summary page (real selectable text + table,
 * not an image) followed by a captured snapshot of the on-screen
 * charts (donut, bar comparison, per-business mini/trend charts) so
 * the visual analysis is included exactly as the user saw it, sliced
 * across as many pages as the captured content needs.
 */
export async function exportPdf(
  rows: ReportRow[],
  meta: ReportMeta,
  filenameBase: string,
  chartsContainer: HTMLElement | null,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(meta.reportTitle, margin, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`${meta.generatedOnLabel}: ${meta.generatedOn}`, margin, y);
  y += 14;
  doc.text(`${meta.locationLabel}: ${meta.location}`, margin, y);
  y += 14;
  doc.text(`${meta.capitalLabel}: ${meta.capital}`, margin, y);
  y += 24;

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(meta.summaryHeading, margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(70);
  const introLines = doc.splitTextToSize(meta.summaryIntro, pageWidth - margin * 2);
  doc.text(introLines, margin, y);
  y += introLines.length * 12 + 12;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[
      meta.columns.activity,
      meta.columns.sector,
      meta.columns.successChance,
      meta.columns.capital,
      meta.columns.monthlyProfit,
      meta.columns.roi,
      meta.columns.breakeven,
    ]],
    body: rows.map((r) => [
      r.activity,
      r.sector,
      r.success_chance,
      `TZS ${Math.round(r.startup_capital_tzs).toLocaleString()}`,
      `TZS ${Math.round(r.expected_monthly_profit_tzs).toLocaleString()}`,
      `${r.roi_percent_per_year}%`,
      `${r.breakeven_months} mo`,
    ]),
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [13, 110, 110] }, // --clr-primary
    alternateRowStyles: { fillColor: [247, 247, 247] },
  });

  // Append captured on-screen charts as image pages, if a container was provided
  if (chartsContainer) {
    try {
      const canvas = await captureLight(chartsContainer);
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = doc.internal.pageSize.getHeight() - margin * 2;

      let renderedHeight = 0;
      let firstSlice = true;
      while (renderedHeight < imgHeight) {
        doc.addPage();
        const sliceHeightPx = Math.min(
          pageHeight * (canvas.width / imgWidth),
          canvas.height - (renderedHeight * canvas.width) / imgWidth,
        );
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            (renderedHeight * canvas.width) / imgWidth,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx,
          );
          const sliceImgHeight = (sliceHeightPx * imgWidth) / canvas.width;
          doc.addImage(
            sliceCanvas.toDataURL("image/png"),
            "PNG",
            margin,
            margin,
            imgWidth,
            sliceImgHeight,
          );
          renderedHeight += sliceImgHeight;
        } else {
          break;
        }
        firstSlice = false;
      }
      void firstSlice;
    } catch {
      // Chart capture failing shouldn't block the rest of the report —
      // the text/table pages above are still a complete, useful export.
    }
  }

  // Footer disclaimer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      meta.disclaimer,
      margin,
      doc.internal.pageSize.getHeight() - 18,
      { maxWidth: pageWidth - margin * 2 },
    );
  }

  doc.save(`${filenameSafe(filenameBase)}.pdf`);
}
