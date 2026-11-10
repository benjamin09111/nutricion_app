import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { colors } from "./styles/pdfStyles";
import {
  PdfBrandedHeader,
  PdfSectionHeader,
  PdfAvoidFoodsSection,
  PdfBrandedFooter,
} from "./components";

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
  primaryCondition?: string;
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
    backgroundColor: colors.white,
    fontFamily: "Helvetica",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    fontSize: 9,
    lineHeight: 1.4,
    color: colors.slate800,
  },
  section: {
    marginBottom: 8,
  },
  twoCol: {
    flexDirection: "row",
    gap: 8,
  },
  col: {
    flex: 1,
  },
  // Stat Box
  statsGrid: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 7,
    color: colors.slate500,
    textTransform: "uppercase",
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  statVal: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  statBadge: {
    backgroundColor: colors.secondaryLight,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 6,
    marginTop: 2,
  },
  statBadgeText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: colors.secondaryDark,
  },
  // Card Container
  cardBox: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  dataLabel: {
    fontSize: 7.5,
    color: colors.slate500,
    fontFamily: "Helvetica-Bold",
  },
  dataValue: {
    fontSize: 7.5,
    color: colors.slate800,
    maxWidth: "60%",
    textAlign: "right",
  },
  badgePill: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  pregnancyBox: {
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
});

function DataRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <View style={S.dataRow}>
      <Text style={S.dataLabel}>{label}</Text>
      <Text style={S.dataValue}>{String(value)}</Text>
    </View>
  );
}

export function ClinicalRecordPdfDocument({ data }: { data: ClinicalRecordPdfData }) {
  const extraMeta = [
    data.patientRut ? { label: "RUT", value: data.patientRut } : null,
    data.patientAge ? { label: "Edad", value: `${data.patientAge} años` } : null,
    data.patientGender ? { label: "Sexo", value: data.patientGender } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header Canva */}
        <PdfBrandedHeader
          title="Ficha Clínica Nutricional"
          subtitle={data.primaryCondition || "Evaluación Clínica Integral"}
          badgeLabel="Ficha Clínica"
          objective={data.motivoConsulta || "Control nutricional y seguimiento biométrico."}
          patientName={data.patientName}
          date={data.generatedAt}
          extraMeta={extraMeta}
        />

        {/* Quick Stats Grid */}
        <View style={S.statsGrid}>
          <View style={S.statCard}>
            <Text style={S.statLabel}>Peso Actual</Text>
            <Text style={S.statVal}>{data.weight ? `${data.weight} kg` : "—"}</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statLabel}>Estatura</Text>
            <Text style={S.statVal}>{data.height ? `${data.height} cm` : "—"}</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statLabel}>IMC</Text>
            <Text style={S.statVal}>{data.bmi ? data.bmi.toFixed(1) : "—"}</Text>
            {data.bmiClassification && (
              <View style={S.statBadge}>
                <Text style={S.statBadgeText}>{data.bmiClassification}</Text>
              </View>
            )}
          </View>
          <View style={S.statCard}>
            <Text style={S.statLabel}>Peso Objetivo</Text>
            <Text style={S.statVal}>{data.weightTarget ? `${data.weightTarget} kg` : "—"}</Text>
          </View>
        </View>

        {/* Antropometría y Pliegues */}
        <View style={S.section}>
          <PdfSectionHeader title="Antropometría y Mediciones" icon="clinical" />
          <View style={S.twoCol}>
            <View style={[S.col, S.cardBox]}>
              <DataRow label="Peso habitual" value={data.weightHabitual ? `${data.weightHabitual} kg` : null} />
              <DataRow label="Ajuste calórico" value={data.manualCaloriesAdjustment ? `${data.manualCaloriesAdjustment} kcal` : null} />
              <DataRow label="Nivel de actividad" value={data.activityLevel} />
              <DataRow label="Circ. cintura" value={data.waistCircumference ? `${data.waistCircumference} cm` : null} />
              <DataRow label="Circ. cadera" value={data.hipCircumference ? `${data.hipCircumference} cm` : null} />
            </View>
            <View style={[S.col, S.cardBox]}>
              <DataRow label="Pliegue Tricipital" value={data.tricipital ? `${data.tricipital} mm` : null} />
              <DataRow label="Pliegue Bicipital" value={data.bicipital ? `${data.bicipital} mm` : null} />
              <DataRow label="Pliegue Subescapular" value={data.subescapular ? `${data.subescapular} mm` : null} />
              <DataRow label="Pliegue Suprailiaco" value={data.suprailiac ? `${data.suprailiac} mm` : null} />
              <DataRow label="Circ. braquial" value={data.armCircumference ? `${data.armCircumference} cm` : null} />
            </View>
          </View>
        </View>

        {/* Anamnesis General y Hábitos */}
        <View style={S.section}>
          <PdfSectionHeader title="Anamnesis General & Estilo de Vida" icon="chart" />
          <View style={S.cardBox}>
            <View style={S.twoCol}>
              <View style={S.col}>
                <DataRow label="Ocupación" value={data.occupation} />
                <DataRow label="Calidad de sueño" value={data.sleepQuality} />
                <DataRow label="Ejercicio semanal" value={data.weeklyExercise} />
              </View>
              <View style={S.col}>
                <DataRow label="Patologías" value={data.diagnosedPathologies} />
                <DataRow label="Medicamentos" value={data.medications} />
                <DataRow label="Suplementos" value={data.supplementsOrDrugs} />
              </View>
            </View>
          </View>
        </View>

        {/* Gestación (si aplica) */}
        {data.isPregnant && (
          <View style={S.pregnancyBox}>
            <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#9D174D", marginBottom: 3 }}>
              Modo Gestante Activo
            </Text>
            <View style={S.twoCol}>
              <DataRow label="Semanas de gestación" value={data.pregnancyWeeks ? `${data.pregnancyWeeks} sem` : null} />
              <DataRow label="Peso pregestacional" value={data.pregestationalWeight ? `${data.pregestationalWeight} kg` : null} />
            </View>
          </View>
        )}

        {/* Anamnesis Nutricional & Restricciones */}
        <View style={S.section}>
          <PdfSectionHeader title="Diagnóstico Nutricional & Restricciones" icon="leaf" />
          <View style={S.cardBox}>
            {data.dietRestrictions && data.dietRestrictions.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
                {data.dietRestrictions.map((r, i) => (
                  <View key={i} style={S.badgePill}>
                    <Text style={S.badgeText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
            <DataRow label="Preferencias" value={data.eatingPreferences} />
            <DataRow label="Rechazos" value={data.rejectedFoods} />
            <DataRow label="Diagnóstico clínico" value={data.diagnosticoNutricional || data.clinicalObservations} />
          </View>
        </View>

        {/* Alimentos a evitar si hay restricciones */}
        {data.dietRestrictions && data.dietRestrictions.length > 0 && (
          <PdfAvoidFoodsSection avoidFoods={data.dietRestrictions} title="Restricciones alimentarias críticas" />
        )}

        {/* Footer Canva */}
        <PdfBrandedFooter />
      </Page>
    </Document>
  );
}
