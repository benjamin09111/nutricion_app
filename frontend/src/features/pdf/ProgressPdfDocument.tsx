import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import { colors, shared } from "./styles/pdfStyles";

export interface MetricSummary {
  key: string;
  label: string;
  unit: string;
  firstValue: string;
  lastValue: string;
  diff: string;
  diffColor: string;
}

export interface ProgressPdfData {
  patientName: string;
  dateFrom: string;
  dateTo: string;
  metrics: MetricSummary[];
  chartImages: Record<string, string>; // key → data URL
  generatedAt: string;
}

const S = StyleSheet.create({
  page: {
    ...shared.page,
  },
  coverHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 22,
    marginHorizontal: -32,
    marginTop: -30,
    marginBottom: 18,
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
    marginTop: 6,
  },
  periodRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  periodText: {
    fontSize: 9,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Helvetica",
  },
  section: {
    marginBottom: 14,
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
  // Summary table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.slate900,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: colors.white,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: `1px solid ${colors.slate100}`,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 8.5,
    color: colors.slate700,
    flex: 1,
  },
  tableCellBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: colors.slate900,
    flex: 1,
  },
  // Chart section
  chartSection: {
    marginTop: 6,
    marginBottom: 16,
    breakInside: "avoid" as const,
  },
  chartTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.slate900,
    marginBottom: 4,
    marginTop: 10,
  },
  chartSubtitle: {
    fontSize: 7,
    color: colors.slate500,
    marginBottom: 6,
  },
  chartImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    objectFit: "contain" as const,
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderRadius: 6,
    padding: 8,
    border: `1px solid ${colors.slate100}`,
    alignItems: "center",
  },
  statValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.slate900,
  },
  statLabel: {
    fontSize: 7,
    color: colors.slate500,
    textTransform: "uppercase",
    textAlign: "center" as const,
    marginTop: 2,
  },
  // Footer
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
  emptyText: {
    fontSize: 9,
    color: colors.slate500,
    textAlign: "center" as const,
    marginTop: 12,
  },
});

export function ProgressPdfDocument({ data }: { data: ProgressPdfData }) {
  const date = new Date(data.generatedAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const chartKeys = data.metrics.map((m) => m.key);

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.coverHeader}>
          <Text style={S.coverBrand}>NutriNet</Text>
          <Text style={S.coverSubtitle}>Informe de Evolución Biométrica</Text>
          <Text style={S.coverDate}>Generado el {date}</Text>
          <View style={S.patientBadge}>
            <Text style={S.patientBadgeText}>Resumen de Progreso</Text>
          </View>
          <Text style={S.patientName}>{data.patientName}</Text>
          {data.dateFrom && data.dateTo && (
            <View style={S.periodRow}>
              <Text style={S.periodText}>
                {data.dateFrom} — {data.dateTo}
              </Text>
            </View>
          )}
        </View>

        {/* Summary Table */}
        {data.metrics.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Resumen de Cambios</Text>
            <View style={S.tableHeader}>
              <Text style={{ ...S.tableHeaderCell, flex: 2 }}>Métrica</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1.5 }}>Inicio</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1.5 }}>Actual</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1.2 }}>Cambio</Text>
            </View>
            {data.metrics.map((m, i) => (
              <View
                key={m.key}
                style={[
                  S.tableRow,
                  i % 2 === 1
                    ? { backgroundColor: colors.slate50 } as any
                    : {},
                ]}
              >
                <Text style={{ ...S.tableCellBold, flex: 2 }}>
                  {m.label}
                </Text>
                <Text style={{ ...S.tableCell, flex: 1.5 }}>
                  {m.firstValue} {m.unit}
                </Text>
                <Text style={{ ...S.tableCell, flex: 1.5 }}>
                  {m.lastValue} {m.unit}
                </Text>
                <Text
                  style={{
                    ...S.tableCell,
                    flex: 1.2,
                    fontFamily: "Helvetica-Bold",
                    color: m.diffColor,
                  }}
                >
                  {m.diff}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.metrics.length === 0 && (
          <Text style={S.emptyText}>
            Sin datos de evolución registrados para este paciente.
          </Text>
        )}

        {/* Chart images */}
        {chartKeys.map((key) => {
          const m = data.metrics.find((mt) => mt.key === key);
          const imgSrc = data.chartImages[key];

          if (!imgSrc || !m) return null;

          return (
            <View key={key} style={S.chartSection} wrap={false}>
              <Text style={S.chartTitle}>
                {m.label} ({m.unit})
              </Text>
              <View style={S.statsRow}>
                <View style={S.statBox}>
                  <Text style={S.statValue}>{m.firstValue}</Text>
                  <Text style={S.statLabel}>Inicial</Text>
                </View>
                <View style={S.statBox}>
                  <Text style={S.statValue}>{m.lastValue}</Text>
                  <Text style={S.statLabel}>Actual</Text>
                </View>
                <View style={S.statBox}>
                  <Text style={{ ...S.statValue, color: m.diffColor }}>
                    {m.diff}
                  </Text>
                  <Text style={S.statLabel}>Cambio</Text>
                </View>
              </View>
              <Image src={imgSrc} style={S.chartImage} />
            </View>
          );
        })}

        {/* Footer */}
        <View style={S.pageFooter} fixed>
          <Text style={S.pageFooterText}>
            NutriNet — Informe de Evolución Biométrica
          </Text>
          <Text style={S.pageFooterBrand}>NutriNet</Text>
        </View>
      </Page>
    </Document>
  );
}
