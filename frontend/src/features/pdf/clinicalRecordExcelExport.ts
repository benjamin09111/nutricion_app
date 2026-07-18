"use client";

import type { ClinicalRecordPdfData } from "./ClinicalRecordPdfDocument";

function esc(val?: string | number | boolean | null): string {
  if (val === undefined || val === null || val === "") return "";
  return String(val);
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "059669" } };
const SUBHEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "10b981" } };
const ALT_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "f0fdf4" } };
const BORDER_THIN = { style: "thin" as const, color: { rgb: "d1fae5" } };

function hdrCell(text: string, colWidth = 12) {
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

function labelCell(text: string) {
  return {
    t: "s",
    v: text,
    s: {
      font: { bold: true, color: { rgb: "065f46" }, sz: 9 },
      fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "d1fae5" } },
      alignment: { horizontal: "left" as const, vertical: "middle" as const },
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
      fill: highlight ? ALT_FILL : { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "ffffff" } },
      alignment: { horizontal: "left" as const, vertical: "middle" as const },
      border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
    },
    wch: 28,
  };
}

function sectionTitleCell(text: string, span = 4) {
  return {
    t: "s",
    v: text,
    s: {
      font: { bold: true, color: { rgb: "ffffff" }, sz: 11 },
      fill: SUBHEADER_FILL,
      alignment: { horizontal: "left" as const, vertical: "middle" as const },
      border: { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN },
    },
    wch: span * 10,
  };
}

function emptyCell() {
  return { t: "s", v: "", s: { fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "ffffff" } } }, wch: 12 };
}

// ─── Build sheet data ─────────────────────────────────────────────────────────

function buildIdentificationSheet(data: ClinicalRecordPdfData) {
  const rows = [
    [hdrCell("DATO", 20), hdrCell("VALOR", 40)],
    [labelCell("Nombre completo"), valueCell(esc(data.patientName))],
    [labelCell("Email"), valueCell(esc(data.patientEmail))],
    [labelCell("Teléfono"), valueCell(esc(data.patientPhone))],
    [labelCell("RUT"), valueCell(esc(data.patientRut))],
    [labelCell("Sexo biológico"), valueCell(esc(data.patientGender))],
    [labelCell("Edad"), valueCell(data.patientAge ? `${data.patientAge} años` : "—")],
    [labelCell("Fecha de nacimiento"), valueCell(esc(data.patientBirthDate))],
  ];
  return { rows, cols: [{ wch: 22 }, { wch: 40 }] };
}

function buildObjectivesSheet(data: ClinicalRecordPdfData) {
  const rows = [
    [hdrCell("CAMPO", 22), hdrCell("VALOR", 40)],
    [labelCell("Motivo de consulta"), valueCell(esc(data.motivoConsulta))],
    [labelCell("Enfoque nutricional"), valueCell(esc(data.nutritionalFocus))],
    [labelCell("Meta fitness"), valueCell(esc(data.fitnessGoals))],
    [labelCell("Nivel de actividad"), valueCell(esc(data.activityLevel))],
  ];
  return { rows, cols: [{ wch: 22 }, { wch: 40 }] };
}

function buildAnthropometrySheet(data: ClinicalRecordPdfData) {
  const rows = [
    [hdrCell("MEDICIÓN", 22), hdrCell("VALOR", 16), hdrCell("UNIDAD", 12)],
    [labelCell("Peso"), valueCell(data.weight ? String(data.weight) : "—", true), valueCell("kg")],
    [labelCell("Altura"), valueCell(data.height ? String(data.height) : "—", true), valueCell("cm")],
    [labelCell("IMC"), valueCell(data.bmi ? String(data.bmi) : "—", true), valueCell("kg/m²")],
    [labelCell("Clasificación IMC"), valueCell(esc(data.bmiClassification))],
    [labelCell("GET"), valueCell(data.get ? String(data.get) : "—", true), valueCell("kcal/día")],
    [labelCell("Peso habitual"), valueCell(esc(data.weightHabitual)), valueCell("kg")],
    [labelCell("Peso objetivo prof."), valueCell(esc(data.weightTarget)), valueCell("kg")],
    [labelCell("Ajuste calórico"), valueCell(esc(data.manualCaloriesAdjustment)), valueCell("kcal")],
    [],
    [sectionTitleCell("PLIEGUES CUTÁNEOS", 3)],
    [hdrCell("MEDICIÓN", 22), hdrCell("VALOR", 16), hdrCell("UNIDAD", 12)],
    [labelCell("Tricipital"), valueCell(esc(data.tricipital)), valueCell("mm")],
    [labelCell("Bicipital"), valueCell(esc(data.bicipital)), valueCell("mm")],
    [labelCell("Subescapular"), valueCell(esc(data.subescapular)), valueCell("mm")],
    [labelCell("Suprailiaco"), valueCell(esc(data.suprailiac)), valueCell("mm")],
    [],
    [sectionTitleCell("PERÍMETROS", 3)],
    [hdrCell("MEDICIÓN", 22), hdrCell("VALOR", 16), hdrCell("UNIDAD", 12)],
    [labelCell("Altura de rodilla"), valueCell(esc(data.kneeHeight)), valueCell("cm")],
    [labelCell("Circ. pantorrilla"), valueCell(esc(data.calfCircumference)), valueCell("cm")],
    [labelCell("Circ. braquial"), valueCell(esc(data.armCircumference)), valueCell("cm")],
    [labelCell("Circ. cintura"), valueCell(esc(data.waistCircumference)), valueCell("cm")],
    [labelCell("Circ. cadera"), valueCell(esc(data.hipCircumference)), valueCell("cm")],
  ];
  return { rows, cols: [{ wch: 22 }, { wch: 18 }, { wch: 14 }] };
}

function buildVitalHistorySheet(data: ClinicalRecordPdfData) {
  const rows = [
    [hdrCell("CAMPO", 22), hdrCell("VALOR", 44)],
    [labelCell("Ocupación"), valueCell(esc(data.occupation))],
    [labelCell("Horario laboral"), valueCell(esc(data.workSchedule))],
    [labelCell("Calidad de sueño"), valueCell(esc(data.sleepQuality))],
    [labelCell("Estrés percibido"), valueCell(esc(data.perceivedStress))],
    [labelCell("Ejercicio semanal"), valueCell(esc(data.weeklyExercise))],
    [],
    [sectionTitleCell("ANTECEDENTES CLÍNICOS", 2)],
    [labelCell("Medicamentos"), valueCell(esc(data.medications))],
    [labelCell("Suplementos / drogas"), valueCell(esc(data.supplementsOrDrugs))],
    [labelCell("Condición clínica principal"), valueCell(esc(data.primaryCondition))],
    [labelCell("Patologías diagnosticadas"), valueCell(esc(data.diagnosedPathologies))],
    [labelCell("Antecedentes familiares"), valueCell(esc(data.familyHistory))],
  ];
  return { rows, cols: [{ wch: 22 }, { wch: 44 }] };
}

function buildNutritionalAnamnesisSheet(data: ClinicalRecordPdfData) {
  const restrictions = data.dietRestrictions && data.dietRestrictions.length > 0
    ? data.dietRestrictions.join(", ")
    : "Sin restricciones";

  const rows = [
    [hdrCell("CAMPO", 22), hdrCell("VALOR", 44)],
    [labelCell("Restricciones dietéticas"), valueCell(restrictions)],
    [labelCell("Gustos y preferencias"), valueCell(esc(data.eatingPreferences))],
    [labelCell("Alimentos rechazados"), valueCell(esc(data.rejectedFoods))],
    [labelCell("Síntesis clínica"), valueCell(esc(data.clinicalObservations))],
    [labelCell("Diagnóstico nutricional"), valueCell(esc(data.diagnosticoNutricional))],
  ];

  if (data.isPregnant) {
    rows.push(
      [],
      [sectionTitleCell("DATOS GESTANTES", 2)],
      [labelCell("Semanas de gestación"), valueCell(esc(data.pregnancyWeeks))],
      [labelCell("Peso pre-gestacional"), valueCell(esc(data.pregestationalWeight), true)],
      [labelCell("Tipo de embarazo"), valueCell(esc(data.pregnancyType))],
    );
  }

  return { rows, cols: [{ wch: 22 }, { wch: 44 }] };
}

function buildSummarySheet(data: ClinicalRecordPdfData) {
  const date = data.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  const rows = [
    // Brand header
    [{ t: "s", v: "NUTRI NET", s: { font: { bold: true, color: { rgb: "ffffff" }, sz: 18 }, fill: HEADER_FILL, alignment: { horizontal: "center" as const } }, wch: 30 }, emptyCell(), emptyCell(), emptyCell()],
    [{ t: "s", v: "FICHA CLÍNICA NUTRICIONAL", s: { font: { bold: true, color: { rgb: "ffffff" }, sz: 12 }, fill: HEADER_FILL, alignment: { horizontal: "center" as const } }, wch: 30 }, emptyCell(), emptyCell(), emptyCell()],
    [{ t: "s", v: `Generado el ${date}`, s: { font: { color: { rgb: "6b7280" }, sz: 9 }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { rgb: "f9fafb" } }, alignment: { horizontal: "center" as const } }, wch: 30 }, emptyCell(), emptyCell(), emptyCell()],
    [emptyCell(), emptyCell(), emptyCell(), emptyCell()],
    [sectionTitleCell("PACIENTE", 4)],
    [labelCell("Nombre"), valueCell(esc(data.patientName), true)],
    [labelCell("RUT"), valueCell(esc(data.patientRut))],
    [labelCell("Sexo / Edad"), valueCell(data.patientAge ? `${data.patientGender || ""} · ${data.patientAge} años` : esc(data.patientGender))],
    [labelCell("Email"), valueCell(esc(data.patientEmail))],
    [labelCell("Teléfono"), valueCell(esc(data.patientPhone))],
    [emptyCell(), emptyCell(), emptyCell(), emptyCell()],
    [sectionTitleCell("INDICADORES PRINCIPALES", 4)],
    [labelCell("Peso"), valueCell(data.weight ? `${data.weight} kg` : "—", true), emptyCell(), emptyCell()],
    [labelCell("Altura"), valueCell(data.height ? `${data.height} cm` : "—", true), emptyCell(), emptyCell()],
    [labelCell("IMC"), valueCell(data.bmi ? `${data.bmi} kg/m²` : "—", true), emptyCell(), emptyCell()],
    [labelCell("Clasificación IMC"), valueCell(esc(data.bmiClassification)), emptyCell(), emptyCell()],
    [labelCell("GET"), valueCell(data.get ? `${data.get} kcal/día` : "—", true), emptyCell(), emptyCell()],
    [emptyCell(), emptyCell(), emptyCell(), emptyCell()],
    [sectionTitleCell("ENFOQUE NUTRICIONAL", 4)],
    [labelCell("Enfoque"), valueCell(esc(data.nutritionalFocus)), emptyCell(), emptyCell()],
    [labelCell("Meta fitness"), valueCell(esc(data.fitnessGoals)), emptyCell(), emptyCell()],
    [labelCell("Nivel de actividad"), valueCell(esc(data.activityLevel)), emptyCell(), emptyCell()],
    [labelCell("Restricciones"), valueCell(Array.isArray(data.dietRestrictions) ? data.dietRestrictions.join(", ") : "—"), emptyCell(), emptyCell()],
  ];
  return { rows, cols: [{ wch: 22 }, { wch: 24 }, { wch: 12 }, { wch: 12 }] };
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function downloadClinicalRecordExcel(data: ClinicalRecordPdfData): Promise<void> {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumen ──────────────────────────────────────────────────────
  const summary = buildSummarySheet(data);
  const wsSummary = XLSX.utils.aoa_to_sheet(summary.rows);
  wsSummary["!cols"] = summary.cols;
  wsSummary["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

  // ── Sheet 2: Identificación ───────────────────────────────────────────────
  const ident = buildIdentificationSheet(data);
  const wsIdent = XLSX.utils.aoa_to_sheet(ident.rows);
  wsIdent["!cols"] = ident.cols;
  XLSX.utils.book_append_sheet(wb, wsIdent, "Identificación");

  // ── Sheet 3: Objetivos ─────────────────────────────────────────────────────
  const obj = buildObjectivesSheet(data);
  const wsObj = XLSX.utils.aoa_to_sheet(obj.rows);
  wsObj["!cols"] = obj.cols;
  XLSX.utils.book_append_sheet(wb, wsObj, "Objetivos");

  // ── Sheet 4: Antropometría ────────────────────────────────────────────────
  const anth = buildAnthropometrySheet(data);
  const wsAnth = XLSX.utils.aoa_to_sheet(anth.rows);
  wsAnth["!cols"] = anth.cols;
  XLSX.utils.book_append_sheet(wb, wsAnth, "Antropometría");

  // ── Sheet 5: Anamnesis General ────────────────────────────────────────────
  const vital = buildVitalHistorySheet(data);
  const wsVital = XLSX.utils.aoa_to_sheet(vital.rows);
  wsVital["!cols"] = vital.cols;
  XLSX.utils.book_append_sheet(wb, wsVital, "Anamnesis General");

  // ── Sheet 6: Anamnesis Nutricional ────────────────────────────────────────
  const nutr = buildNutritionalAnamnesisSheet(data);
  const wsNutr = XLSX.utils.aoa_to_sheet(nutr.rows);
  wsNutr["!cols"] = nutr.cols;
  XLSX.utils.book_append_sheet(wb, wsNutr, "Anamnesis Nutricional");

  // ── Write file ────────────────────────────────────────────────────────────
  const safeName = (data.patientName || "Paciente")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");
  const filename = `Ficha_Clinica_${safeName}_NutriNet.xlsx`;

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
