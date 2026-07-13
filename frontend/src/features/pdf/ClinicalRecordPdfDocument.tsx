import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { colors, shared } from "./styles/pdfStyles";

export interface ClinicalRecordPdfData {
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patientRut?: string;
  patientGender?: string;
  patientAge?: number;
  patientBirthDate?: string;
  // Anthropometry
  weight?: number;
  height?: number;
  bmi?: number;
  bmiClassification?: string;
  get?: number;
  weightHabitual?: string;
  weightTarget?: string;
  manualCaloriesAdjustment?: string;
  activityLevel?: string;
  // Skinfolds
  tricipital?: string;
  bicipital?: string;
  subescapular?: string;
  suprailiac?: string;
  // Circumferences
  kneeHeight?: string;
  calfCircumference?: string;
  armCircumference?: string;
  waistCircumference?: string;
  hipCircumference?: string;
  // Vital History
  occupation?: string;
  workSchedule?: string;
  medications?: string;
  supplementsOrDrugs?: string;
  diagnosedPathologies?: string;
  familyHistory?: string;
  sleepQuality?: string;
  perceivedStress?: string;
  weeklyExercise?: string;
  motivoConsulta?: string;
  // Nutritional Anamnesis
  dietRestrictions?: string[];
  eatingPreferences?: string;
  rejectedFoods?: string;
  clinicalObservations?: string;
  diagnosticoNutricional?: string;
  // Gyneco
  isPregnant?: boolean;
  pregnancyWeeks?: string;
  pregestationalWeight?: string;
  pregnancyType?: string;
  // Meta
  nutritionalFocus?: string;
  fitnessGoals?: string;
  generatedAt?: string;
}

const S = StyleSheet.create({
  page: {
    ...shared.page,
  },
  coverHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 24,
    marginHorizontal: -32,
    marginTop: -30,
    marginBottom: 20,
  },
  coverBrand: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    marginBottom: 2,
  },
  coverSubtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Helvetica",
  },
  coverDate: {
    fontSize: 8,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  patientBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  patientBadgeText: {
    fontSize: 9,
    color: colors.primaryDark,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  patientName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    marginTop: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1px solid ${colors.primaryLight}`,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  dataRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dataLabel: {
    fontSize: 8,
    color: colors.slate500,
    fontFamily: "Helvetica-Bold",
    width: 90,
    textTransform: "uppercase",
  },
  dataValue: {
    fontSize: 9,
    color: colors.slate900,
    flex: 1,
    fontFamily: "Helvetica",
  },
  dataValueBold: {
    fontSize: 9,
    color: colors.slate900,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  badge: {
    backgroundColor: colors.slate100,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 7,
    color: colors.slate700,
    fontFamily: "Helvetica-Bold",
  },
  restrictionBadge: {
    backgroundColor: "#ffe4e6",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  restrictionBadgeText: {
    fontSize: 7,
    color: "#be123c",
    fontFamily: "Helvetica-Bold",
  },
  box: {
    backgroundColor: colors.slate50,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    border: `1px solid ${colors.slate100}`,
  },
  boxLabel: {
    fontSize: 7,
    color: colors.slate500,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  boxValue: {
    fontSize: 9,
    color: colors.slate900,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  boxValueLarge: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.slate900,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderRadius: 6,
    padding: 10,
    border: `1px solid ${colors.slate100}`,
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.slate900,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 7,
    color: colors.slate500,
    textTransform: "uppercase",
    textAlign: "center",
  },
  statUnit: {
    fontSize: 8,
    color: colors.slate500,
    marginTop: 1,
  },
 pregnancyBox: {
    backgroundColor: "#fdf2f8",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    border: `1px solid #f9a8d4`,
  },
  pregnancyLabel: {
    fontSize: 8,
    color: "#9d174d",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  pageFooter: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: `1px solid ${colors.slate300}`,
    paddingTop: 6,
  },
  pageFooterText: {
    fontSize: 8,
    color: colors.slate500,
  },
  pageFooterBrand: {
    fontSize: 8,
    color: colors.primary,
    fontFamily: "Helvetica-Bold",
  },
});

function notEmpty(val?: string | number | boolean | null | string[]): boolean {
  if (val === undefined || val === null || val === "") return false;
  if (typeof val === "boolean") return val;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

function fmtNum(val?: number | string | null): string {
  if (val === undefined || val === null || val === "") return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return n.toFixed(1);
}

function DataRow({ label, value }: { label: string; value?: string | number | boolean | null | string[] }) {
  if (!notEmpty(value as string | number | boolean | string[])) return null;
  const display = Array.isArray(value) ? value.join(", ") : String(value);
  return (
    <View style={S.dataRow}>
      <Text style={S.dataLabel}>{label}</Text>
      <Text style={S.dataValue}>{display}</Text>
    </View>
  );
}

export function ClinicalRecordPdfDocument({ data }: { data: ClinicalRecordPdfData }) {
  const date = data.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.coverHeader}>
          <Text style={S.coverBrand}>NutriNet</Text>
          <Text style={S.coverSubtitle}>Ficha Clínica Nutricional</Text>
          <Text style={S.coverDate}>Generado el {date}</Text>
          <View style={S.patientBadge}>
            <Text style={S.patientBadgeText}>Expediente del Paciente</Text>
          </View>
          <Text style={S.patientName}>{data.patientName}</Text>
        </View>

        {/* Key Metrics */}
        <View style={S.statsRow}>
          <View style={S.statBox}>
            <Text style={S.statValue}>{fmtNum(data.weight)}</Text>
            <Text style={S.statLabel}>Peso (kg)</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statValue}>{fmtNum(data.height)}</Text>
            <Text style={S.statLabel}>Altura (cm)</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statValue}>{fmtNum(data.bmi)}</Text>
            <Text style={S.statLabel}>IMC</Text>
            <Text style={S.statUnit}>{data.bmiClassification || "—"}</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statValue}>{fmtNum(data.get)}</Text>
            <Text style={S.statLabel}>GET (kcal)</Text>
          </View>
        </View>

        {/* Identification */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Datos del Paciente</Text>
          <View style={S.twoCol}>
            <View style={S.col}>
              <DataRow label="Email" value={data.patientEmail} />
              <DataRow label="Teléfono" value={data.patientPhone} />
              <DataRow label="RUT" value={data.patientRut} />
            </View>
            <View style={S.col}>
              <DataRow label="Sexo biológico" value={data.patientGender} />
              <DataRow label="Edad" value={data.patientAge ? `${data.patientAge} años` : undefined} />
              <DataRow label="Nacimiento" value={data.patientBirthDate} />
            </View>
          </View>
        </View>

        {/* Objectives */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Objetivos y Actividad</Text>
          <DataRow label="Motivo de consulta" value={data.motivoConsulta} />
          <View style={S.twoCol}>
            <View style={S.col}>
              <DataRow label="Enfoque nutricional" value={data.nutritionalFocus} />
            </View>
            <View style={S.col}>
              <DataRow label="Meta fitness" value={data.fitnessGoals} />
            </View>
          </View>
          <DataRow label="Nivel de actividad" value={data.activityLevel} />
        </View>

        {/* Anthropometry */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Antropometría</Text>
          <View style={S.twoCol}>
            <View style={S.col}>
              <DataRow label="Peso habitual" value={data.weightHabitual ? `${data.weightHabitual} kg` : undefined} />
              <DataRow label="Peso objetivo prof." value={data.weightTarget ? `${data.weightTarget} kg` : undefined} />
              <DataRow label="Ajuste calórico" value={data.manualCaloriesAdjustment ? `${data.manualCaloriesAdjustment} kcal` : undefined} />
            </View>
            <View style={S.col}>
              <DataRow label="Tricipital" value={data.tricipital ? `${data.tricipital} mm` : undefined} />
              <DataRow label="Bicipital" value={data.bicipital ? `${data.bicipital} mm` : undefined} />
              <DataRow label="Subescapular" value={data.subescapular ? `${data.subescapular} mm` : undefined} />
              <DataRow label="Suprailiaco" value={data.suprailiac ? `${data.suprailiac} mm` : undefined} />
            </View>
          </View>
          <View style={S.twoCol}>
            <View style={S.col}>
              <DataRow label="Circ. rodilla" value={data.kneeHeight ? `${data.kneeHeight} cm` : undefined} />
              <DataRow label="Circ. pantorrilla" value={data.calfCircumference ? `${data.calfCircumference} cm` : undefined} />
            </View>
            <View style={S.col}>
              <DataRow label="Circ. braquial" value={data.armCircumference ? `${data.armCircumference} cm` : undefined} />
              <DataRow label="Circ. cintura" value={data.waistCircumference ? `${data.waistCircumference} cm` : undefined} />
              <DataRow label="Circ. cadera" value={data.hipCircumference ? `${data.hipCircumference} cm` : undefined} />
            </View>
          </View>
        </View>

        {/* General Anamnesis */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Anamnesis General</Text>
          <View style={S.twoCol}>
            <View style={S.col}>
              <DataRow label="Ocupación" value={data.occupation} />
              <DataRow label="Horario laboral" value={data.workSchedule} />
            </View>
            <View style={S.col}>
              <DataRow label="Calidad de sueño" value={data.sleepQuality} />
              <DataRow label="Estrés percibido" value={data.perceivedStress} />
              <DataRow label="Ejercicio semanal" value={data.weeklyExercise} />
            </View>
          </View>
          <DataRow label="Medicamentos" value={data.medications} />
          <DataRow label="Suplementos / drogas" value={data.supplementsOrDrugs} />
          <DataRow label="Patologías diagnosticadas" value={data.diagnosedPathologies} />
          <DataRow label="Antecedentes familiares" value={data.familyHistory} />
        </View>

        {/* Pregnancy */}
        {data.isPregnant && (
          <View style={S.pregnancyBox}>
            <Text style={S.pregnancyLabel}>Modo Gestante</Text>
            <View style={S.twoCol}>
              <DataRow label="Semanas de gestación" value={data.pregnancyWeeks ? `${data.pregnancyWeeks} sem` : undefined} />
              <DataRow label="Peso pre-gestacional" value={data.pregestationalWeight ? `${data.pregestationalWeight} kg` : undefined} />
            </View>
            <DataRow label="Tipo de embarazo" value={data.pregnancyType} />
          </View>
        )}

        {/* Nutritional Anamnesis */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Anamnesis Nutricional</Text>
          {data.dietRestrictions && data.dietRestrictions.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 6 }}>
              {data.dietRestrictions.map((r) => (
                <View key={r} style={S.restrictionBadge}>
                  <Text style={S.restrictionBadgeText}>{r}</Text>
                </View>
              ))}
            </View>
          )}
          <DataRow label="Gustos y preferencias" value={data.eatingPreferences} />
          <DataRow label="Alimentos rechazados" value={data.rejectedFoods} />
          <DataRow label="Síntesis clínica" value={data.clinicalObservations} />
          <DataRow label="Diagnóstico nutricional" value={data.diagnosticoNutricional} />
        </View>

        {/* Footer */}
        <View style={S.pageFooter} fixed>
          <Text style={S.pageFooterText}>NutriNet — Ficha Clínica Nutricional</Text>
          <Text style={S.pageFooterBrand}>NutriNet</Text>
        </View>
      </Page>
    </Document>
  );
}
