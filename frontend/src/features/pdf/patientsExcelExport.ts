"use client";

import type { Patient } from "@/features/patients/types";

function esc(val?: string | number | boolean | null): string {
  if (val === undefined || val === null || val === "") return "";
  return String(val);
}

const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "059669" } };
const ALT_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "f0fdf4" } };
const BORDER_THIN = { style: "thin" as const, color: { rgb: "d1fae5" } };

function hdrCell(text: string, colWidth = 18) {
  return {
    t: "s",
    v: text,
    s: {
      font: { bold: true, color: { rgb: "ffffff" }, sz: 10 },
      fill: HEADER_FILL,
      alignment: { horizontal: "center" as const, vertical: "middle" as const },
      border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
    },
    wch: colWidth,
  };
}

function dataCell(text: string, isAlt = false, bold = false) {
  return {
    t: "s",
    v: text,
    s: {
      font: { bold, color: { rgb: "1e293b" }, sz: 10 },
      fill: isAlt ? ALT_FILL : { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "ffffff" } },
      alignment: { vertical: "middle" as const },
      border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
    },
    wch: 20,
  };
}

export function exportPatientsToExcel(patients: Patient[]) {
  const XLSX = require("xlsx");

  const headers = [
    hdrCell("Nombre", 25),
    hdrCell("RUT", 14),
    hdrCell("Email", 25),
    hdrCell("Teléfono", 14),
    hdrCell("Fecha de nacimiento", 16),
    hdrCell("Edad", 8),
    hdrCell("Género", 12),
    hdrCell("Altura (cm)", 12),
    hdrCell("Peso (kg)", 12),
    hdrCell("Estado", 10),
    hdrCell("Restricciones dietéticas", 30),
    hdrCell("Fecha de registro", 16),
  ];

  const rows = patients.map((p, i) => {
    const isAlt = i % 2 === 1;
    const restrictions = Array.isArray(p.dietRestrictions) ? p.dietRestrictions.join(", ") : "";
    const status = p.status === "Active" ? "Activo" : "Inactivo";
    const birthDate = p.birthDate
      ? new Date(p.birthDate).toLocaleDateString("es-CL")
      : "";
    const createdAt = new Date(p.createdAt).toLocaleDateString("es-CL");

    return [
      dataCell(esc(p.fullName), isAlt, true),
      dataCell(esc(p.documentId), isAlt),
      dataCell(esc(p.email), isAlt),
      dataCell(esc(p.phone), isAlt),
      dataCell(birthDate, isAlt),
      dataCell(esc(p.age), isAlt),
      dataCell(esc(p.gender), isAlt),
      dataCell(esc(p.height), isAlt),
      dataCell(esc(p.weight), isAlt),
      dataCell(status, isAlt),
      dataCell(restrictions, isAlt),
      dataCell(createdAt, isAlt),
    ];
  });

  const date = new Date().toLocaleDateString("es-CL");

  const topRows = [
    [
      {
        t: "s",
        v: "NUTRI NET",
        s: { font: { bold: true, color: { rgb: "ffffff" }, sz: 16 }, fill: HEADER_FILL, alignment: { horizontal: "center" as const } },
        wch: 30,
      },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
    ],
    [
      {
        t: "s",
        v: `LISTA DE PACIENTES · Generado: ${date}`,
        s: { font: { color: { rgb: "64748b" }, sz: 9 }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "f9fafb" } }, alignment: { horizontal: "center" as const } },
        wch: 30,
      },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
      { t: "s", v: "", s: {}, wch: 14 },
    ],
    [hdrCell("Nombre", 25), hdrCell("RUT", 14), hdrCell("Email", 25), hdrCell("Teléfono", 14), hdrCell("Fecha de nacimiento", 16), hdrCell("Edad", 8), hdrCell("Género", 12), hdrCell("Altura (cm)", 12), hdrCell("Peso (kg)", 12), hdrCell("Estado", 10), hdrCell("Restricciones dietéticas", 30), hdrCell("Fecha de registro", 16)],
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows.length === 0 ? [headers] : topRows);

  ws["!cols"] = [
    { wch: 25 },
    { wch: 14 },
    { wch: 25 },
    { wch: 14 },
    { wch: 16 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
  XLSX.writeFile(wb, `nutinet_pacientes_${date.replace(/\//g, "-")}.xlsx`);
}
