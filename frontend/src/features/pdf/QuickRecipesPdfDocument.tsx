import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { colors } from "./styles/pdfStyles";
import { formatIngredientQuantityLabel } from "./pdfFormatters";
import {
  PdfBrandedHeader,
  PdfSectionHeader,
  PdfAvoidFoodsSection,
  PdfBrandedFooter,
} from "./components";

export interface QuickRecipeIngredientPdf {
  name: string;
  quantity?: string;
  amount?: number | string;
  unit?: string;
}

export interface QuickDishPdf {
  title: string;
  mealSection?: string;
  description?: string;
  preparation?: string;
  imageUrl?: string;
  recommendedPortion?: string;
  portions?: number | string;
  protein?: number | string;
  calories?: number | string;
  carbs?: number | string;
  fats?: number | string;
  ingredients?: QuickRecipeIngredientPdf[];
}

export interface QuickRecipesPdfData {
  title: string;
  dietName?: string;
  patientName?: string | null;
  nutritionistNotes?: string;
  planObjective?: string;
  showPlanObjectiveInPdf?: boolean;
  finalNotes?: string;
  allowedFoodsMain?: string[];
  restrictedFoods?: string[];
  specialConsiderations?: string;
  referenceDishes?: string[];
  resources?: string[];
  dishes: QuickDishPdf[];
  generatedAt?: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    backgroundColor: colors.white,
    fontFamily: "Helvetica",
    color: colors.slate800,
    fontSize: 9.5,
    lineHeight: 1.45,
  },
  section: {
    marginBottom: 8,
  },
  notesBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 8,
    color: colors.slate700,
    lineHeight: 1.35,
  },
  dishCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  dishHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  dishTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    flex: 1,
  },
  mealBadge: {
    backgroundColor: colors.secondaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  mealBadgeText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.secondaryDark,
  },
  macroRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  macroBox: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 6,
    padding: 4,
    alignItems: "center",
  },
  macroVal: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  macroLabel: {
    fontSize: 6.5,
    color: colors.slate500,
    textTransform: "uppercase",
  },
  prepLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    marginTop: 4,
    marginBottom: 2,
  },
  prepText: {
    fontSize: 7.5,
    color: colors.slate700,
    lineHeight: 1.35,
  },
  ingredientsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  ingredientPill: {
    backgroundColor: colors.slate100,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  ingredientText: {
    fontSize: 7,
    color: colors.slate700,
  },
});

export function QuickRecipesPdfDocument({ data }: { data: QuickRecipesPdfData }) {
  const extraMeta = [
    data.dietName ? { label: "Plan", value: data.dietName } : null,
    { label: "Platos", value: `${data.dishes.length}` },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfBrandedHeader
          title={data.title || "Recetario Saludable"}
          subtitle="Preparaciones & Platos Recomendados"
          badgeLabel="Recetario NutriNet"
          objective={data.planObjective?.trim() || "Instrucciones de preparación e ingredientes por porción."}
          patientName={data.patientName}
          date={data.generatedAt}
          extraMeta={extraMeta}
        />

        {data.nutritionistNotes?.trim() && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Indicaciones del Nutricionista</Text>
            <Text style={styles.notesText}>{data.nutritionistNotes.trim()}</Text>
          </View>
        )}

        <View style={styles.section}>
          <PdfSectionHeader title="Recetas & Preparaciones" icon="recipe" />
          {data.dishes.map((dish, index) => (
            <View key={index} style={styles.dishCard}>
              <View style={styles.dishHeader}>
                <Text style={styles.dishTitle}>{dish.title || `Receta ${index + 1}`}</Text>
                {dish.mealSection && (
                  <View style={styles.mealBadge}>
                    <Text style={styles.mealBadgeText}>{dish.mealSection}</Text>
                  </View>
                )}
              </View>

              {/* Macros */}
              <View style={styles.macroRow}>
                <View style={styles.macroBox}>
                  <Text style={styles.macroVal}>{dish.calories ? `${dish.calories}` : "—"}</Text>
                  <Text style={styles.macroLabel}>Calorías (kcal)</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroVal}>{dish.protein ? `${dish.protein}g` : "—"}</Text>
                  <Text style={styles.macroLabel}>Proteínas</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroVal}>{dish.carbs ? `${dish.carbs}g` : "—"}</Text>
                  <Text style={styles.macroLabel}>Carbohidratos</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroVal}>{dish.fats ? `${dish.fats}g` : "—"}</Text>
                  <Text style={styles.macroLabel}>Grasas</Text>
                </View>
              </View>

              {/* Ingredientes */}
              {dish.ingredients && dish.ingredients.length > 0 && (
                <>
                  <Text style={styles.prepLabel}>Ingredientes:</Text>
                  <View style={styles.ingredientsWrap}>
                    {dish.ingredients.map((ing, iIdx) => {
                      const qty = formatIngredientQuantityLabel(ing.quantity, ing.amount, ing.unit);
                      return (
                        <View key={iIdx} style={styles.ingredientPill}>
                          <Text style={styles.ingredientText}>
                            • {ing.name} {qty ? `(${qty})` : ""}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Preparación */}
              {dish.preparation && (
                <>
                  <Text style={styles.prepLabel}>Preparación:</Text>
                  <Text style={styles.prepText}>{dish.preparation}</Text>
                </>
              )}
            </View>
          ))}
        </View>

        {/* Alimentos restringidos si aplica */}
        {data.restrictedFoods && data.restrictedFoods.length > 0 && (
          <PdfAvoidFoodsSection avoidFoods={data.restrictedFoods} />
        )}

        <PdfBrandedFooter />
      </Page>
    </Document>
  );
}
