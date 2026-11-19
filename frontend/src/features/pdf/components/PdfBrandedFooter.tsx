import React from "react";
import { View, Text, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import { colors } from "../styles/pdfStyles";

export interface PdfBrandedFooterProps {
  pageNumber?: number;
  totalPages?: number;
  nutritionistName?: string;
}

const styles = StyleSheet.create({
  footerWrapper: {
    marginTop: "auto",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  taglineText: {
    fontSize: 7,
    color: colors.slate500,
  },
  infoText: {
    fontSize: 7,
    color: colors.slate500,
  },
});

export function PdfBrandedFooter({
  pageNumber,
  totalPages,
  nutritionistName,
}: PdfBrandedFooterProps) {
  return (
    <View style={styles.footerWrapper} fixed>
      <View style={styles.footerRow}>
        <View style={styles.brandGroup}>
          <Svg width={9} height={9} viewBox="0 0 24 24">
            <Path
              fill={colors.secondary}
              d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
            />
          </Svg>
          <Text style={styles.brandText}>NutriNet</Text>
          <Text style={styles.taglineText}>· Salud & Nutrición Inteligente</Text>
        </View>

        {nutritionistName && (
          <Text style={styles.infoText}>Nutricionista: {nutritionistName}</Text>
        )}

        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <Text style={styles.infoText}>
            {new Date().toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
          {pageNumber !== undefined && (
            <Text style={styles.infoText}>
              Pág. {pageNumber} {totalPages ? `/ ${totalPages}` : ""}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

