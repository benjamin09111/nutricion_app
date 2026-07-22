"use client";

import type { Consultation } from "@/features/consultations";
import { buildMetricSeriesForKey } from "@/features/patients/utils/patient-helpers";

interface ProgressRow {
  date: string;
  fullDate: string;
  [key: string]: unknown;
}

function esc(val?: unknown): string {
  if (val === undefined || val === null || val === "") return "";
  return String(val);
}

const PATTERN_FILL = "pattern";
const SOLID_PATTERN = "solid";

const HEADER_FILL = { type: PATTERN_FILL, pattern: SOLID_PATTERN, fgColor: { rgb: "059669" } };
const ALT_FILL = { type: PATTERN_FILL, pattern: SOLID_PATTERN, fgColor: { rgb: "f0fdf4" } };
const GREEN_FILL = { type: PATTERN_FILL, pattern: SOLID_PATTERN, fgColor: { rgb: "10b981" } };
const LIGHT_FILL = { type: PATTERN_FILL, pattern: SOLID_PATTERN, fgColor: { rgb: "f9fafb" } };
const GREY_FILL = { type: PATTERN_FILL, pattern: SOLID_PATTERN, fgColor: { rgb: "f8fafc" } };
const WHITE_FILL = { type: PATTERN_FILL, pattern: SOLID_PATTERN, fgColor: { rgb: "ffffff" } };
const BORDER_THIN = { style: "thin", color: { rgb: "d1fae5" } };

function hdrCell(text: string) {
  return {
    t: "s",
    v: text,
    s: {
      font: { bold: true, color: { rgb: "ffffff" }, sz: 10 },
      fill: HEADER_FILL,
      alignment: { horizontal: "center", vertical: "middle" },
      border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
    },
    wch: 14,
  };
}

function labelCell(text: string) {
  return {
    t: "s",
    v: text,
    s: {
      font: { bold: true, color: { rgb: "065f46" }, sz: 9 },
      fill: { type: PATTERN_FILL, pattern: SOLID_PATTERN, fgColor: { rgb: "d1fae5" } },
      alignment: { horizontal: "left", vertical: "middle" },
      border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
    },
    wch: 20,
  };
}

function valueCell(text: string, highlight = false) {
  return {
    t: "s",
    v: text,
    s: {
      font: { bold: highlight, color: { rgb: highlight ? "059669" : "1e293b" }, sz: 9 },
      fill: highlight ? ALT_FILL : WHITE_FILL,
      alignment: { horizontal: "left", vertical: "middle" },
      border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
    },
    wch: 16,
  };
}

function numCell(num?: number | string | null, highlight = false) {
  const val = num !== undefined && num !== null && num !== "" ? String(num) : "—";
  return {
    t: "s",
    v: val,
    s: {
      font: { bold: highlight, color: { rgb: highlight ? "059669" : "1e293b" }, sz: 9 },
      fill: highlight ? ALT_FILL : WHITE_FILL,
      alignment: { horizontal: "center", vertical: "middle" },
      border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
    },
    wch: 12,
  };
}

function diffCell(unit: string, diff?: number | null) {
  if (diff === undefined || diff === null) {
    return {
      t: "s",
      v: "—",
      s: {
        font: { color: { rgb: "94a3b8" }, sz: 9 },
        fill: GREY_FILL,
        alignment: { horizontal: "center" },
        border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
      },
      wch: 10,
    };
  }
  const sign = diff > 0 ? "+" : "";
  const color = diff < 0 ? "059669" : diff > 0 ? "dc2626" : "64748b";
  return {
    t: "s",
    v: `${sign}${diff.toFixed(1)} ${unit}`,
    s: {
      font: { bold: true, color: { rgb: color }, sz: 9 },
      fill: GREY_FILL,
      alignment: { horizontal: "center", vertical: "middle" },
      border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
    },
    wch: 12,
  };
}

export async function downloadProgressExcel(
  patientName: string,
  chartData: ProgressRow[],
  metricKeys: string[],
  getMetricInfo: (key: string) => { label: string; unit: string; color: string },
  consultations: Consultation[],
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const date = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const headerRow1 = [
    { t: "s", v: "NUTRI NET", s: { font: { bold: true, color: { rgb: "ffffff" }, sz: 16 }, fill: HEADER_FILL, alignment: { horizontal: "center" } }, wch: 30 },
    { t: "s", v: "", s: {}, wch: 14 },
  ];
  const headerRow2 = [
    { t: "s", v: "SEGUIMIENTO DE EVOLUCIÓN CLÍNICA", s: { font: { bold: true, color: { rgb: "ffffff" }, sz: 11 }, fill: HEADER_FILL, alignment: { horizontal: "center" } }, wch: 30 },
    { t: "s", v: "", s: {}, wch: 14 },
  ];
  const patientRow = [
    { t: "s", v: `Paciente: ${patientName} · Generado: ${date}`, s: { font: { color: { rgb: "64748b" }, sz: 9 }, fill: LIGHT_FILL, alignment: { horizontal: "center" } }, wch: 30 },
    { t: "s", v: "", s: {}, wch: 14 },
  ];
  const spacerRow = [
    { t: "s", v: "", s: {}, wch: 30 },
    { t: "s", v: "", s: {}, wch: 14 },
  ];
  const summaryTitleRow = [
    { t: "s", v: "RESUMEN DE CAMBIOS", s: { font: { bold: true, color: { rgb: "ffffff" }, sz: 11 }, fill: GREEN_FILL }, wch: 30 },
    { t: "s", v: "", s: {}, wch: 14 },
  ];
  const summaryHeaderRow = [
    labelCell("Métrica"),
    labelCell("Unidad"),
    labelCell("Valor inicial"),
    labelCell("Último valor"),
    labelCell("Diferencia total"),
  ];

  const summaryRows = [
    headerRow1,
    headerRow2,
    patientRow,
    spacerRow,
    summaryTitleRow,
    summaryHeaderRow,
  ];

  for (const key of metricKeys) {
    const info = getMetricInfo(key);
    const series = buildMetricSeriesForKey(consultations, key);
    if (series.length >= 1) {
      const first = Number(series[0][key]);
      const last = Number(series[series.length - 1][key]);
      const diff = last - first;
      summaryRows.push([
        labelCell(info.label),
        numCell(info.unit),
        numCell(first, true),
        numCell(last, true),
        diffCell(info.unit, diff),
      ]);
    }
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  wsSummary["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

  const tableRows: Array<Array<unknown>> = [
    [
      labelCell("Fecha"),
      ...metricKeys.map((k) => {
        const info = getMetricInfo(k);
        return labelCell(`${info.label} (${info.unit})`);
      }),
      labelCell("Observaciones"),
    ],
  ];

  for (const row of chartData) {
    const cells: Array<unknown> = [valueCell(row.fullDate || row.date)];
    const isBaseline = row.isBaseline;
    for (const key of metricKeys) {
      const val = row[key];
      cells.push(numCell(val as number | string | null, Boolean(isBaseline)));
    }
    cells.push(valueCell(isBaseline ? "Valor inicial (baseline)" : ""));
    tableRows.push(cells);
  }

  const wsTable = XLSX.utils.aoa_to_sheet(tableRows);
  const colWidths = [{ wch: 18 }, ...metricKeys.map(() => ({ wch: 14 })), { wch: 24 }];
  wsTable["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsTable, "Datos por fecha");

  const safeName = patientName.replace(/\s+/g, "_").replace(/[^\w-]/g, "");
  const filename = `Progreso_${safeName}_NutriNet.xlsx`;
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
