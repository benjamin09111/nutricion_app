import React from "react";
import { Document, Page, StyleSheet, Text, View, Image, Svg, Path } from "@react-pdf/renderer";
import { colors } from "./styles/pdfStyles";
import {
  PdfBrandedHeader,
  PdfSectionHeader,
  PdfAvoidFoodsSection,
  PdfBrandedFooter,
  getCategoryB64,
  CATEGORY_ICONS_B64,
} from "./components";

export interface FastMealPlanItem {
  id: string;
  section: string;
  time: string;
  mealText: string;
  portion?: string;
  optionTexts?: string[];
}

export interface FastDeliverableParagraphItem {
  title: string;
  subtitle?: string;
  foods: string[];
  imagePath?: string | null;
}

export interface FastDeliverableResourcePage {
  resourceId: string;
  title: string;
  content: string;
  variables?: Record<string, string>;
}

export interface FastDeliverableRecipeItem {
  id: string;
  name: string;
  section?: string;
  time?: string;
  portion?: string;
  ingredients?: string[];
  instructions?: string;
  calories?: number | string;
  protein?: number | string;
  carbs?: number | string;
  fats?: number | string;
}

export interface FastDeliverableCartItem {
  name: string;
  category: string;
  sources?: ("dieta" | "plato")[];
}

export interface FastDeliverableIntroData {
  greetingName?: string | null;
  message: string;
}

export interface FastDeliverableClosingData {
  message: string;
}

export interface FastDeliverablePdfData {
  name: string;
  patientName?: string | null;
  patient?: {
    name?: string | null;
    ageYears?: number | null;
    weight?: number | null;
    height?: number | null;
    bmi?: number | null;
  } | null;
  clinicalRestriction?: string | null;
  contentMode?: "table" | "paragraphs" | "both";
  tableMode?: "simple" | "options";
  paragraphs?: FastDeliverableParagraphItem[];
  nutritionistName?: string | null;
  nutritionistEmail?: string | null;
  planObjective?: string;
  showPlanObjectiveInPdf?: boolean;
  intro?: FastDeliverableIntroData | null;
  meals: FastMealPlanItem[];
  avoidFoods: string[];
  recipes?: FastDeliverableRecipeItem[];
  cart?: FastDeliverableCartItem[];
  resources: FastDeliverableResourcePage[];
  portionGuide: Array<{ category: string; portion: string }>;
  supplementNote?: string;
  closing?: FastDeliverableClosingData | null;
  generatedAt?: string;
}

type ResourceBlock = {
  text: string;
  kind: "paragraph" | "heading" | "bullet";
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));

const parseResourceContent = (content: string): ResourceBlock[] => {
  const normalized = content
    .replace(/(<li[^>]*>)\s*<p[^>]*>/gi, "$1")
    .replace(/<\/p>\s*(?=<\/li>)/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<h[1-6][^>]*>/gi, "\n__HEADING__")
    .replace(/<\/h[1-6\s]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n__BULLET__")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<\/?(?:p|div|section|article|blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  return decodeHtmlEntities(normalized)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("__HEADING__")) {
        return { kind: "heading" as const, text: line.slice("__HEADING__".length).trim() };
      }
      if (line.startsWith("__BULLET__")) {
        return { kind: "bullet" as const, text: line.slice("__BULLET__".length).trim() };
      }
      return { kind: "paragraph" as const, text: line };
    });
};

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
    marginTop: 8,
    marginBottom: 8,
  },
  // Table Container
  tableWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
    overflow: "hidden",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.slate50,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  cellHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.slate600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Meal row card
  mealRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    alignItems: "center",
  },
  mealRowEven: {
    backgroundColor: colors.slate50,
  },
  cellTime: {
    width: "12%",
    paddingRight: 4,
  },
  timePill: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.secondaryDark,
  },
  cellSection: {
    width: "20%",
    paddingRight: 6,
  },
  sectionPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  sectionText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    textAlign: "center",
  },
  cellImage: {
    width: "10%",
    alignItems: "center",
    justifyContent: "center",
  },
  mealAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    objectFit: "cover",
  },
  cellMeal: {
    width: "48%",
    paddingLeft: 6,
    paddingRight: 6,
  },
  mealDescriptionText: {
    fontSize: 8,
    color: colors.slate800,
    lineHeight: 1.35,
  },
  optionLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginBottom: 3,
  },
  optionBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  optionBadgeText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  optionText: {
    flex: 1,
    fontSize: 7.5,
    color: colors.slate800,
    lineHeight: 1.25,
  },
  cellPortion: {
    width: "10%",
    alignItems: "center",
    justifyContent: "center",
  },
  portionText: {
    fontSize: 8,
    color: colors.slate500,
  },
  // Introduction Card
  introBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  introGreeting: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    marginBottom: 2,
  },
  introMessage: {
    fontSize: 8,
    color: colors.slate700,
    lineHeight: 1.35,
  },
  // Recipe card
  recipeCard: {
    width: "100%",
    marginBottom: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 10,
    backgroundColor: colors.slate50,
  },
  recipeName: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    marginBottom: 2,
  },
  recipeMeta: {
    fontSize: 7.5,
    color: colors.slate500,
    marginBottom: 4,
  },
  recipeSubLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.slate700,
    marginBottom: 2,
  },
  recipeText: {
    fontSize: 7.5,
    color: colors.slate700,
    lineHeight: 1.3,
    marginBottom: 4,
  },
  recipeMacrosRow: {
    flexDirection: "row",
    gap: 6,
  },
  recipeMacroChip: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    backgroundColor: colors.white,
    borderColor: colors.slate200,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 6,
    color: colors.primary,
  },
  // Cart
  cartHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  cartRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  cartCellName: {
    width: "50%",
    fontSize: 8,
    color: colors.slate800,
  },
  cartCellCategory: {
    width: "30%",
    fontSize: 8,
    color: colors.slate600,
  },
  cartCellSource: {
    width: "20%",
    fontSize: 7.5,
    color: colors.primary,
    fontFamily: "Helvetica-Bold",
  },
  // Closing box
  closingBox: {
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 10,
    padding: 8,
    marginTop: 6,
  },
  closingMessage: {
    fontSize: 8,
    color: colors.secondaryDark,
    lineHeight: 1.35,
    marginBottom: 4,
  },
  closingSignature: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.secondaryDark,
  },
});

export function FastDeliverablePdfDocument({
  data,
}: {
  data: FastDeliverablePdfData;
}) {
  const patientName = data.patient?.name || data.patientName || "Paciente";
  const nutritionistName = data.nutritionistName?.trim() || "Nutricionista NutriNet";

  const extraMeta = [
    data.patient?.ageYears ? { label: "Edad", value: `${data.patient.ageYears} años` } : null,
    data.patient?.weight ? { label: "Peso", value: `${data.patient.weight} kg` } : null,
    data.patient?.bmi ? { label: "IMC", value: `${data.patient.bmi}` } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const showTable =
    (data.contentMode === "table" || data.contentMode === "both" || !data.contentMode) &&
    (data.meals?.length || 0) > 0;

  // Helper to pick a category image for meal
  const getMealAvatar = (section: string) => {
    const s = section.toLowerCase();
    if (s.includes("desayuno")) return CATEGORY_ICONS_B64["platos_preparados"];
    if (s.includes("almuerzo")) return CATEGORY_ICONS_B64["carnes_visceras"];
    if (s.includes("once") || s.includes("colaci")) return CATEGORY_ICONS_B64["postres_leche"];
    if (s.includes("cena")) return CATEGORY_ICONS_B64["salmon_bowl"] || CATEGORY_ICONS_B64["pescados_mariscos"];
    return CATEGORY_ICONS_B64["verduras"] || CATEGORY_ICONS_B64["cereales"];
  };

  // Helper to format options A / B if present
  const renderMealOptions = (mealText: string) => {
    const lines = mealText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const hasOptions = lines.some((l) => /^[A-Ea-e][:\-\)]\s*/.test(l));

    if (!hasOptions) {
      return <Text style={styles.mealDescriptionText}>{mealText}</Text>;
    }

    return (
      <View>
        {lines.map((line, lIdx) => {
          const match = line.match(/^([A-Ea-e])[:\-\)]\s*(.*)$/);
          if (match) {
            const letter = match[1].toUpperCase();
            const text = match[2];
            return (
              <View key={lIdx} style={styles.optionLine}>
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>{letter}</Text>
                </View>
                <Text style={styles.optionText}>{text}</Text>
              </View>
            );
          }
          return (
            <Text key={lIdx} style={styles.mealDescriptionText}>
              {line}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Reusable Canva Branded Header */}
        <PdfBrandedHeader
          title={data.name || "Pauta Nutricional Express"}
          subtitle={data.clinicalRestriction || "Recomposición Corporal"}
          badgeLabel="Pauta Alimentaria"
          objective={data.planObjective?.trim()}
          patientName={patientName}
          date={data.generatedAt}
          extraMeta={extraMeta}
        />

        {/* Intro */}
        {data.intro?.message?.trim() ? (
          <View style={styles.introBox}>
            <Text style={styles.introGreeting}>
              {data.intro.greetingName ? `Hola, ${data.intro.greetingName}` : "Bienvenido/a a tu plan"}
            </Text>
            <Text style={styles.introMessage}>{data.intro.message.trim()}</Text>
          </View>
        ) : null}

        {/* Plan de comidas */}
        {showTable && (
          <View style={styles.section}>
            <PdfSectionHeader title="Plan de comidas" icon="cutlery" />
            <View style={styles.tableWrapper}>
              <View style={styles.tableHeader}>
                <View style={styles.cellTime}>
                  <Text style={styles.cellHeaderText}>Hora</Text>
                </View>
                <View style={styles.cellSection}>
                  <Text style={styles.cellHeaderText}>Sección</Text>
                </View>
                <View style={styles.cellImage}>
                  <Text style={styles.cellHeaderText}>Foto</Text>
                </View>
                <View style={styles.cellMeal}>
                  <Text style={styles.cellHeaderText}>Indicaciones / Alimentos</Text>
                </View>
                <View style={styles.cellPortion}>
                  <Text style={styles.cellHeaderText}>Porción</Text>
                </View>
              </View>

              {data.meals.map((meal, index) => {
                const avatar = getMealAvatar(meal.section || "");
                return (
                  <View
                    key={meal.id || index}
                    style={[styles.mealRow, index % 2 === 1 ? styles.mealRowEven : {}]}
                  >
                    <View style={styles.cellTime}>
                      <View style={styles.timePill}>
                        <Text style={styles.timeText}>{meal.time || "-"}</Text>
                      </View>
                    </View>
                    <View style={styles.cellSection}>
                      <View style={styles.sectionPill}>
                        <Text style={styles.sectionText}>{meal.section || "-"}</Text>
                      </View>
                    </View>
                    <View style={styles.cellImage}>
                      {avatar && <Image src={avatar} style={styles.mealAvatar} />}
                    </View>
                    <View style={styles.cellMeal}>
                      {renderMealOptions(meal.mealText || "-")}
                    </View>
                    <View style={styles.cellPortion}>
                      <Text style={styles.portionText}>{meal.portion || "-"}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Alimentos a evitar */}
        <PdfAvoidFoodsSection avoidFoods={data.avoidFoods} />

        {/* Recetas (si hay) */}
        {data.recipes && data.recipes.length > 0 && (
          <View style={styles.section}>
            <PdfSectionHeader title="Recetas sugeridas" icon="recipe" />
            {data.recipes.slice(0, 2).map((recipe, index) => (
              <View key={recipe.id || index} style={styles.recipeCard}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeMeta}>
                  {[recipe.section, recipe.time, recipe.portion].filter(Boolean).join(" • ")}
                </Text>
                {recipe.ingredients && (
                  <Text style={styles.recipeText}>
                    <Text style={styles.recipeSubLabel}>Ingredientes: </Text>
                    {recipe.ingredients.join(", ")}
                  </Text>
                )}
                {recipe.instructions && (
                  <Text style={styles.recipeText}>
                    <Text style={styles.recipeSubLabel}>Preparación: </Text>
                    {recipe.instructions}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Mensaje de cierre */}
        {data.closing?.message?.trim() && (
          <View style={styles.closingBox}>
            <Text style={styles.closingMessage}>{data.closing.message.trim()}</Text>
            <Text style={styles.closingSignature}>— {nutritionistName}</Text>
          </View>
        )}

        {/* Footer */}
        <PdfBrandedFooter nutritionistName={nutritionistName} />
      </Page>
    </Document>
  );
}
