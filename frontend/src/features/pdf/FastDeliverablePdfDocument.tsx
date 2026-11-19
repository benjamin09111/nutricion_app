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
  quantity?: string | number;
  estimatedPrice?: string | number;
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
  avoidFoods: Array<string | { name: string; category?: string }>;
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
  // Category / Base Diet Card
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48.5%",
    marginBottom: 8,
    padding: 8,
    backgroundColor: colors.slate50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    paddingBottom: 4,
  },
  categoryIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    objectFit: "contain",
  },
  categoryTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  categoryCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  categoryCountText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  categorySubtitle: {
    fontSize: 7.5,
    color: colors.slate500,
    marginBottom: 3,
  },
  categoryFoodText: {
    fontSize: 7.5,
    color: colors.slate700,
    lineHeight: 1.3,
  },
  // Recipe card
  recipeCard: {
    width: "100%",
    marginBottom: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 10,
    backgroundColor: colors.slate50,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  recipeName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    flex: 1,
  },
  recipeBadge: {
    backgroundColor: colors.secondaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  recipeBadgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.secondaryDark,
  },
  recipeMeta: {
    fontSize: 7.5,
    color: colors.slate500,
    marginBottom: 4,
  },
  recipeMacrosRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  recipeMacroChip: {
    backgroundColor: colors.white,
    borderColor: colors.slate200,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },
  recipeMacroChipLabel: {
    fontSize: 6.5,
    color: colors.slate500,
    textTransform: "uppercase",
  },
  recipeMacroChipVal: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
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
    lineHeight: 1.35,
  },
  // Cart
  cartWrapper: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    overflow: "hidden",
    marginBottom: 8,
  },
  cartHeader: {
    flexDirection: "row",
    backgroundColor: colors.slate100,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  cartHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.slate700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cartRow: {
    flexDirection: "row",
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    alignItems: "center",
  },
  cartRowEven: {
    backgroundColor: colors.slate50,
  },
  cartCellName: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.slate800,
  },
  cartCellCategory: {
    fontSize: 7.5,
    color: colors.slate600,
  },
  cartCellQty: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  cartCellPrice: {
    fontSize: 7.5,
    color: colors.slate500,
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

  const showTable = (data.meals?.length || 0) > 0;

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
    <Document
      title={data.name || "Plan Alimentario Personalizado"}
      author={nutritionistName}
      subject="Pauta Nutricional Personalizada"
      creator="NutriNet Canva Engine"
    >
      {/* ─── PÁGINA 1: PLAN ALIMENTARIO PRINCIPAL Y HORARIOS ─── */}
      <Page size="A4" style={styles.page}>
        <PdfBrandedHeader
          title={data.name || "Plan Alimentario Personalizado"}
          subtitle={data.clinicalRestriction || "Pauta Nutricional"}
          badgeLabel="Plan Nutricional"
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

        {/* Plan de comidas y distribución de horarios */}
        {showTable && (
          <View style={styles.section}>
            <PdfSectionHeader title="Plan de Comidas y Horarios" icon="cutlery" />
            <View style={styles.tableWrapper}>
              <View style={styles.tableHeader}>
                <View style={styles.cellTime}>
                  <Text style={styles.cellHeaderText}>Hora</Text>
                </View>
                <View style={styles.cellSection}>
                  <Text style={styles.cellHeaderText}>Tiempo</Text>
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
                    wrap={false}
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

        {/* Si NO hay tabla de comidas pero sí párrafos estructurados, renderizar en pág 1 */}
        {!showTable && data.paragraphs && data.paragraphs.length > 0 && (
          <View style={styles.section}>
            <PdfSectionHeader title="Estructura de la Pauta Base" icon="cutlery" />
            <View style={styles.categoryGrid}>
              {data.paragraphs.map((p, pIdx) => {
                const catIcon = p.imagePath || getCategoryB64(p.title);
                return (
                  <View key={pIdx} wrap={false} style={styles.categoryCard}>
                    <View style={styles.categoryHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                        {catIcon ? <Image src={catIcon} style={styles.categoryIcon} /> : null}
                        <Text style={styles.categoryTitle}>{p.title}</Text>
                      </View>
                      <View style={styles.categoryCountBadge}>
                        <Text style={styles.categoryCountText}>
                          {p.foods.length} {p.foods.length === 1 ? "alimento" : "alimentos"}
                        </Text>
                      </View>
                    </View>
                    {p.subtitle ? <Text style={styles.categorySubtitle}>{p.subtitle}</Text> : null}
                    <View style={{ marginTop: 3 }}>
                      {p.foods.map((food, fIdx) => (
                        <Text key={fIdx} style={styles.categoryFoodText}>• {food}</Text>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Alimentos a evitar */}
        {data.avoidFoods && data.avoidFoods.length > 0 ? (
          <PdfAvoidFoodsSection
            avoidFoods={data.avoidFoods.map((item) =>
              typeof item === "string" ? { name: item } : item,
            )}
          />
        ) : null}

        {/* Mensaje de cierre */}
        {data.closing?.message?.trim() ? (
          <View style={styles.closingBox}>
            <Text style={styles.closingMessage}>{data.closing.message.trim()}</Text>
            <Text style={styles.closingSignature}>— {nutritionistName}</Text>
          </View>
        ) : null}

        {/* Footer fijo */}
        <PdfBrandedFooter nutritionistName={nutritionistName} />
      </Page>

      {/* ─── PÁGINA 2: RECETARIO Y PREPARACIONES SUGERIDAS ─── */}
      {data.recipes && data.recipes.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <PdfSectionHeader
              title="Recetario y Preparaciones Sugeridas"
              badge={`${data.recipes.length} ${data.recipes.length === 1 ? "Plato" : "Platos"}`}
              icon="recipe"
            />
            {data.recipes.map((recipe, index) => (
              <View key={recipe.id || index} wrap={false} style={styles.recipeCard}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  {recipe.section ? (
                    <View style={styles.recipeBadge}>
                      <Text style={styles.recipeBadgeText}>{recipe.section}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.recipeMeta}>
                  {[
                    recipe.time ? `Horario: ${recipe.time}` : null,
                    recipe.portion ? `Porción: ${recipe.portion}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </Text>

                {/* Macros row if present */}
                {(recipe.calories || recipe.protein || recipe.carbs || recipe.fats) ? (
                  <View style={styles.recipeMacrosRow}>
                    {recipe.calories ? (
                      <View style={styles.recipeMacroChip}>
                        <Text style={styles.recipeMacroChipLabel}>Cal:</Text>
                        <Text style={styles.recipeMacroChipVal}>
                          {Math.round(Number(recipe.calories))} kcal
                        </Text>
                      </View>
                    ) : null}
                    {recipe.protein ? (
                      <View style={styles.recipeMacroChip}>
                        <Text style={styles.recipeMacroChipLabel}>Prot:</Text>
                        <Text style={styles.recipeMacroChipVal}>
                          {Number(recipe.protein).toFixed(1)}g
                        </Text>
                      </View>
                    ) : null}
                    {recipe.carbs ? (
                      <View style={styles.recipeMacroChip}>
                        <Text style={styles.recipeMacroChipLabel}>Carb:</Text>
                        <Text style={styles.recipeMacroChipVal}>
                          {Number(recipe.carbs).toFixed(1)}g
                        </Text>
                      </View>
                    ) : null}
                    {recipe.fats ? (
                      <View style={styles.recipeMacroChip}>
                        <Text style={styles.recipeMacroChipLabel}>Grasas:</Text>
                        <Text style={styles.recipeMacroChipVal}>
                          {Number(recipe.fats).toFixed(1)}g
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.recipeSubLabel}>Ingredientes:</Text>
                    <Text style={styles.recipeText}>{recipe.ingredients.join(", ")}</Text>
                  </View>
                )}

                {recipe.instructions ? (
                  <View>
                    <Text style={styles.recipeSubLabel}>Instrucciones de preparación:</Text>
                    <Text style={styles.recipeText}>{recipe.instructions}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
          <PdfBrandedFooter nutritionistName={nutritionistName} />
        </Page>
      )}

      {/* ─── PÁGINA 3: LISTA DE COMPRAS / DESPENSA SUGERIDA ─── */}
      {data.cart && data.cart.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <PdfSectionHeader
              title="Lista de Compras / Despensa Sugerida"
              badge={`${data.cart.length} Alimentos`}
              icon="cutlery"
            />
            <View style={styles.cartWrapper}>
              <View style={styles.cartHeader}>
                <View style={{ width: "45%" }}>
                  <Text style={styles.cartHeaderText}>Alimento / Ingrediente</Text>
                </View>
                <View style={{ width: "30%" }}>
                  <Text style={styles.cartHeaderText}>Categoría</Text>
                </View>
                <View style={{ width: "15%", alignItems: "center" }}>
                  <Text style={styles.cartHeaderText}>Cantidad</Text>
                </View>
                <View style={{ width: "10%", alignItems: "flex-end" }}>
                  <Text style={styles.cartHeaderText}>Dinero est.</Text>
                </View>
              </View>

              {data.cart.map((item, index) => (
                <View
                  key={index}
                  wrap={false}
                  style={[styles.cartRow, index % 2 === 1 ? styles.cartRowEven : {}]}
                >
                  <View style={{ width: "45%" }}>
                    <Text style={styles.cartCellName}>{item.name}</Text>
                  </View>
                  <View style={{ width: "30%" }}>
                    <Text style={styles.cartCellCategory}>{item.category || "General"}</Text>
                  </View>
                  <View style={{ width: "15%", alignItems: "center" }}>
                    <Text style={styles.cartCellQty}>
                      {item.quantity ? String(item.quantity) : "1 unid."}
                    </Text>
                  </View>
                  <View style={{ width: "10%", alignItems: "flex-end" }}>
                    <Text style={styles.cartCellPrice}>
                      {item.estimatedPrice ? String(item.estimatedPrice) : "-"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <PdfBrandedFooter nutritionistName={nutritionistName} />
        </Page>
      )}

      {/* ─── PÁGINA 4: RECURSOS CLÍNICOS Y MATERIAL EDUCATIVO ─── */}
      {data.resources && data.resources.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <PdfSectionHeader
              title="Recursos Clínicos y Material Educativo"
              badge={`${data.resources.length} Guías`}
              icon="leaf"
            />
            {data.resources.map((resource, index) => (
              <View
                key={resource.resourceId || index}
                wrap={false}
                style={{
                  marginBottom: 10,
                  padding: 9,
                  backgroundColor: colors.slate50,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.slate200,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "Helvetica-Bold",
                    color: colors.primaryDark,
                    marginBottom: 4,
                  }}
                >
                  {resource.title}
                </Text>
                {parseResourceContent(resource.content || "").map((block, blockIndex) => (
                  <Text
                    key={`${resource.resourceId || index}-${blockIndex}`}
                    style={{
                      fontSize: block.kind === "heading" ? 9 : 8,
                      fontFamily: block.kind === "heading" ? "Helvetica-Bold" : "Helvetica",
                      color: block.kind === "heading" ? colors.primaryDark : colors.slate700,
                      marginBottom: 2.5,
                      marginLeft: block.kind === "bullet" ? 8 : 0,
                      lineHeight: 1.35,
                    }}
                  >
                    {block.kind === "bullet" ? `• ${block.text}` : block.text}
                  </Text>
                ))}
              </View>
            ))}
          </View>
          <PdfBrandedFooter nutritionistName={nutritionistName} />
        </Page>
      )}

      {/* ─── PÁGINA 5: GUÍA PRÁCTICA DE PORCIONES DE INTERCAMBIO ─── */}
      {data.portionGuide && data.portionGuide.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <PdfSectionHeader
              title="Guía Práctica de Porciones de Intercambio"
              badge="Equivalencias"
              icon="cutlery"
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              {data.portionGuide.map((pg: any, idx: number) => (
                <View
                  key={idx}
                  wrap={false}
                  style={{
                    width: "48.5%",
                    minHeight: 48,
                    padding: 8,
                    backgroundColor: colors.slate50,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.slate200,
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: colors.slate800 }}>
                    {pg.grupo || pg.category || "Grupo"}
                  </Text>
                  <Text style={{ fontSize: 7.5, color: colors.primaryDark, marginTop: 2, lineHeight: 1.3 }}>
                    {pg.porcion || pg.portion || ""}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <PdfBrandedFooter nutritionistName={nutritionistName} />
        </Page>
      )}
    </Document>
  );
}
