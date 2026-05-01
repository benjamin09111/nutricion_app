import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

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

const DEFAULT_DISH_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="100%" stop-color="#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" rx="48" fill="url(#bg)"/>
      <circle cx="400" cy="260" r="128" fill="#ffffff" opacity="0.95"/>
      <circle cx="400" cy="260" r="84" fill="#f8fafc"/>
      <path d="M318 208c0-22 18-40 40-40 8 0 15 2 21 6 11-22 33-36 58-36 31 0 57 21 64 50 4-1 8-2 13-2 22 0 40 18 40 40v14H318v-32z" fill="#d97706"/>
      <rect x="340" y="240" width="120" height="72" rx="24" fill="#f59e0b"/>
      <text x="400" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#92400e">Plato NutriSaaS</text>
    </svg>
  `);

export interface QuickRecipesPdfData {
  title: string;
  dietName?: string;
  patientName?: string | null;
  nutritionistNotes?: string;
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
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 32,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 9,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: "1px solid #cbd5e1",
  },
  brand: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#d97706",
    marginBottom: 3,
  },
  docTitle: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  meta: {
    fontSize: 8,
    color: "#64748b",
  },
  infoBox: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
  },
  notesBox: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#fefce8",
    border: "1px solid #fde68a",
    borderRadius: 4,
  },
  boxLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  notesLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  boxText: {
    fontSize: 8,
    color: "#334155",
    lineHeight: 1.5,
  },
  notesText: {
    fontSize: 8,
    color: "#78350f",
    lineHeight: 1.5,
  },
  dishCard: {
    marginBottom: 14,
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  dishHeader: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dishTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    flex: 1,
  },
  mealSectionBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    backgroundColor: "#fef3c7",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 99,
    textTransform: "uppercase",
  },
  dishBody: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dishImage: {
    width: "100%",
    height: 130,
    objectFit: "cover",
    borderRadius: 6,
    marginBottom: 8,
  },
  description: {
    fontSize: 8.5,
    color: "#475569",
    marginBottom: 6,
    lineHeight: 1.5,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
    marginTop: 6,
  },
  preparationText: {
    fontSize: 8.5,
    color: "#374151",
    lineHeight: 1.55,
  },
  macroRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  macroBox: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  macroValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  macroLabel: {
    fontSize: 6.5,
    color: "#64748b",
    textTransform: "uppercase",
    marginTop: 1,
  },
  ingredientsGrid: {
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  ingredientChip: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ingredientName: {
    fontSize: 7.5,
    color: "#166534",
    fontFamily: "Helvetica-Bold",
  },
  ingredientQty: {
    fontSize: 7,
    color: "#15803d",
  },
  portionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  portionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  portionValue: {
    fontSize: 8.5,
    color: "#374151",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    paddingTop: 7,
    borderTop: "1px solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94a3b8",
  },
  muted: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
});

function formatMacro(value: number | string | undefined): string {
  const num = Number(value);
  if (!value || !Number.isFinite(num)) return "-";
  return String(Math.round(num));
}

const joinList = (items?: string[]) =>
  Array.isArray(items) && items.length > 0 ? items.join(" · ") : "";

export function QuickRecipesPdfDocument({ data }: { data: QuickRecipesPdfData }) {
  const generatedAt = data.generatedAt || new Date().toLocaleDateString("es-CL");
  const allowedFoods = joinList(data.allowedFoodsMain);
  const restrictedFoods = joinList(data.restrictedFoods);
  const referenceDishes = joinList(data.referenceDishes);
  const resources = joinList(data.resources);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>NutriSaaS</Text>
          <Text style={styles.docTitle}>{data.title || "Recetas Rápidas"}</Text>
          <View style={styles.metaRow}>
            {data.dietName ? <Text style={styles.meta}>Dieta: {data.dietName}</Text> : null}
            {data.patientName ? <Text style={styles.meta}>Paciente: {data.patientName}</Text> : null}
            <Text style={styles.meta}>Generado: {generatedAt}</Text>
            <Text style={styles.meta}>{data.dishes.length} plato(s)</Text>
          </View>
        </View>

        {allowedFoods ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxLabel}>Alimentos permitidos principales</Text>
            <Text style={styles.boxText}>{allowedFoods}</Text>
          </View>
        ) : null}

        {restrictedFoods ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxLabel}>Restricciones de alimentos</Text>
            <Text style={styles.boxText}>{restrictedFoods}</Text>
          </View>
        ) : null}

        {data.specialConsiderations?.trim() ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxLabel}>Consideraciones especiales</Text>
            <Text style={styles.boxText}>{data.specialConsiderations}</Text>
          </View>
        ) : null}

        {referenceDishes ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxLabel}>Platos de referencia</Text>
            <Text style={styles.boxText}>{referenceDishes}</Text>
          </View>
        ) : null}

        {resources ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxLabel}>Recursos</Text>
            <Text style={styles.boxText}>{resources}</Text>
          </View>
        ) : null}

        {data.nutritionistNotes?.trim() ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notas del nutricionista</Text>
            <Text style={styles.notesText}>{data.nutritionistNotes}</Text>
          </View>
        ) : null}

        {data.finalNotes?.trim() ? (
          <View style={styles.infoBox}>
            <Text style={styles.boxLabel}>Notas finales</Text>
            <Text style={styles.boxText}>{data.finalNotes}</Text>
          </View>
        ) : null}

        {data.dishes.length === 0 ? (
          <Text style={styles.muted}>Sin platos registrados.</Text>
        ) : (
          data.dishes.map((dish, index) => (
            <View key={index} style={styles.dishCard} wrap={false}>
              <View style={styles.dishHeader}>
                <Text style={styles.dishTitle}>{dish.title || `Plato ${index + 1}`}</Text>
                {dish.mealSection ? (
                  <Text style={styles.mealSectionBadge}>{dish.mealSection}</Text>
                ) : null}
              </View>

              <View style={styles.dishBody}>
                <Image alt="" src={dish.imageUrl || DEFAULT_DISH_IMAGE} style={styles.dishImage} />

                {dish.description?.trim() ? (
                  <Text style={styles.description}>{dish.description}</Text>
                ) : null}

                <View style={styles.macroRow}>
                  <View style={styles.macroBox}>
                    <Text style={styles.macroValue}>{formatMacro(dish.calories)} kcal</Text>
                    <Text style={styles.macroLabel}>Calorías</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={styles.macroValue}>{formatMacro(dish.protein)} g</Text>
                    <Text style={styles.macroLabel}>Proteínas</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={styles.macroValue}>{formatMacro(dish.carbs)} g</Text>
                    <Text style={styles.macroLabel}>HC</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={styles.macroValue}>{formatMacro(dish.fats)} g</Text>
                    <Text style={styles.macroLabel}>Grasas</Text>
                  </View>
                </View>

                {dish.recommendedPortion?.trim() ? (
                  <View style={styles.portionRow}>
                    <Text style={styles.portionLabel}>Porción recomendada:</Text>
                    <Text style={styles.portionValue}>{dish.recommendedPortion}</Text>
                  </View>
                ) : null}

                {dish.ingredients && dish.ingredients.length > 0 ? (
                  <>
                    <Text style={styles.sectionLabel}>Ingredientes</Text>
                    <View style={styles.ingredientsGrid}>
                      {dish.ingredients
                        .filter((ingredient) => ingredient.name?.trim())
                        .map((ingredient, ingredientIndex) => (
                          <View key={ingredientIndex} style={styles.ingredientChip}>
                            <Text style={styles.ingredientName}>{ingredient.name}</Text>
                            {ingredient.quantity?.trim() ? (
                              <Text style={styles.ingredientQty}>· {ingredient.quantity}</Text>
                            ) : null}
                          </View>
                        ))}
                    </View>
                  </>
                ) : null}

                {dish.preparation?.trim() ? (
                  <>
                    <Text style={styles.sectionLabel}>Preparación</Text>
                    <Text style={styles.preparationText}>{dish.preparation}</Text>
                  </>
                ) : null}
              </View>
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Text>NutriSaaS · Recetas Express</Text>
          <Text>Generado el {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}
