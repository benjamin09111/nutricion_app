import React from "react";
import { View, Text, Image, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import { colors } from "../styles/pdfStyles";
import { getCategoryB64 } from "./NutriNetPdfAssets";

export interface AvoidFoodItem {
  name: string;
  category?: string;
}

export interface PdfAvoidFoodsSectionProps {
  avoidFoods?: string[] | AvoidFoodItem[];
  title?: string;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCream,
    borderWidth: 1,
    borderColor: colors.borderAmber,
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  cardsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  foodCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderAmber,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  foodImage: {
    width: 24,
    height: 24,
    marginBottom: 3,
    objectFit: "contain",
  },
  foodLabel: {
    fontSize: 6.5,
    color: colors.slate700,
    textAlign: "center",
    lineHeight: 1.2,
  },
});

const DEFAULT_AVOID_CATEGORIES = [
  { key: "lacteos", label: "Lácteos enteros o quesos grasos" },
  { key: "bebidas", label: "Bebidas gaseosas y alcohol" },
  { key: "grasas_aceites", label: "Frituras y ultraprocesados" },
  { key: "azucares_miel", label: "Azúcares simples" },
  { key: "cereales", label: "Harinas blancas refinadas" },
];

export function PdfAvoidFoodsSection({
  avoidFoods,
  title = "Alimentos a evitar",
}: PdfAvoidFoodsSectionProps) {
  // If no specific avoid foods or empty, display default educational categories
  const hasCustom = Array.isArray(avoidFoods) && avoidFoods.length > 0;

  const itemsToRender = hasCustom
    ? (avoidFoods as (string | AvoidFoodItem)[]).slice(0, 5).map((item) => {
        const name = typeof item === "string" ? item : item.name;
        const b64 = getCategoryB64(name) || getCategoryB64("grasas_aceites");
        return { label: name, b64 };
      })
    : DEFAULT_AVOID_CATEGORIES.map((cat) => ({
        label: cat.label,
        b64: getCategoryB64(cat.key),
      }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Svg width={12} height={12} viewBox="0 0 24 24">
          <Path
            fill={colors.prohibitRed}
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"
          />
        </Svg>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.cardsGrid}>
        {itemsToRender.map((item, idx) => (
          <View key={idx} style={styles.foodCard}>
            {item.b64 && <Image src={item.b64} style={styles.foodImage} />}
            <Text style={styles.foodLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

