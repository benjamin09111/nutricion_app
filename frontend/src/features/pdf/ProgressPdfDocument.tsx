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
  chartImages: Record<string, string>;
  generatedAt: string;
}

const S = StyleSheet.create({
  page: {
    ...shared.page,
  },
  coverHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 20,
    marginHorizontal: -32,
    marginTop: -30,
    marginBottom: 14,
  },
  coverBrand: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  coverSubtitle: {
    fontSize: 9,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Helvetica",
    marginTop: 2,
  },
  coverDate: {
    fontSize: 7,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  patientName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    marginTop: 8,
  },
  periodRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  periodText: {
    fontSize: 8,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Helvetica",
  },

  // Charts grid — 2 per row
  chartsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  chartBlock: {
    width: "48%",
    marginBottom: 12,
  },

  chartTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: colors.slate900,
    marginBottom: 3,
  },
  chartUnit: {
    fontSize: 7,
    color: colors.slate500,
  },
  chartImage: {
    width: "100%",
    height: 120,
    borderRadius: 4,
    objectFit: "contain" as const,
  },

  // Stats inside chart block
  statsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 4,
    border: `1px solid ${colors.slate100}`,
    alignItems: "center",
  },
  statValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.slate900,
  },
  statLabel: {
    fontSize: 6,
    color: colors.slate500,
    textTransform: "uppercase" as const,
    textAlign: "center" as const,
    marginTop: 1,
  },

  // Summary table (kept as overview)
  section: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: `1px solid ${colors.primaryLight}`,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.slate900,
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 1,
  },
  tableHeaderCell: {
    fontSize: 7,
    color: colors.white,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `1px solid ${colors.slate100}`,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 7.5,
    color: colors.slate700,
  },
  tableCellBold: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.slate900,
  },

  emptyText: {
    fontSize: 8,
    color: colors.slate500,
    textAlign: "center" as const,
    marginTop: 10,
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
              <Text style={{ ...S.tableHeaderCell, flex: 1.3 }}>Inicio</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1.3 }}>Actual</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1 }}>Cambio</Text>
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
                <Text style={{ ...S.tableCellBold, flex: 2 }}>{m.label}</Text>
                <Text style={{ ...S.tableCell, flex: 1.3 }}>
                  {m.firstValue} {m.unit}
                </Text>
                <Text style={{ ...S.tableCell, flex: 1.3 }}>
                  {m.lastValue} {m.unit}
                </Text>
                <Text
                  style={{
                    ...S.tableCell,
                    flex: 1,
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

        {/* Charts — 2 per row */}
        <View style={S.chartsGrid}>
          {chartKeys.map((key) => {
            const m = data.metrics.find((mt) => mt.key === key);
            const imgSrc = data.chartImages[key];
            if (!imgSrc || !m) return null;

            return (
              <View key={key} style={S.chartBlock} wrap={false}>
                <Text style={S.chartTitle}>
                  {m.label}{" "}
                  <Text style={S.chartUnit}>({m.unit})</Text>
                </Text>
                <Image src={imgSrc} style={S.chartImage} />
                <View style={S.statsRow}>
                  <View style={S.statBox}>
                    <Text style={S.statValue}>{m.firstValue}</Text>
                    <Text style={S.statLabel}>INICIAL</Text>
                  </View>
                  <View style={S.statBox}>
                    <Text style={S.statValue}>{m.lastValue}</Text>
                    <Text style={S.statLabel}>ACTUAL</Text>
                  </View>
                  <View style={S.statBox}>
                    <Text style={{ ...S.statValue, color: m.diffColor }}>
                      {m.diff}
                    </Text>
                    <Text style={S.statLabel}>CAMBIO</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

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
