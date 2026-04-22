import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

interface StandardTemplateProps {
  data: Record<string, unknown>;
  config: {
    includeLogo: boolean;
    selectedSections: string[];
    brandSettings?: {
      primaryColorHex?: string;
      brandBackgroundUrl?: string;
    };
  };
}

type ChapterResource = {
  title: string;
  subtitle: string;
  content: string;
};

type RecipeEntry = {
  day: string;
  dayOrder: number;
  time: string;
  section: string;
  title: string;
  portion: string;
  calories?: number | string;
  protein?: number | string;
  carbs?: number | string;
  fats?: number | string;
  description?: string;
  image?: string;
};

const INFO_SECTION_CATALOG: Record<string, { title: string; subtitle: string; defaultText: string }> = {
  hormonalIntel: {
    title: "Inteligencia Hormonal",
    subtitle: "Adaptacion por ciclo y sintomas",
    defaultText:
      "Ajusta intensidad, hidratacion y eleccion de comidas segun fase del ciclo para mejorar adherencia y energia.",
  },
  pathologyInfo: {
    title: "Patologias y Restricciones",
    subtitle: "Consideraciones clinicas",
    defaultText:
      "Resumen de restricciones activas y recomendaciones practicas para mantener seguridad alimentaria.",
  },
  exercises: {
    title: "Ejercicios Sugeridos",
    subtitle: "Movimiento complementario",
    defaultText:
      "Actividad fisica progresiva y sostenible con foco en consistencia semanal.",
  },
  myths: {
    title: "Mitos vs Realidad",
    subtitle: "Educacion nutricional",
    defaultText:
      "Aclaracion de creencias frecuentes para mejorar decisiones cotidianas.",
  },
  faq: {
    title: "Preguntas Frecuentes",
    subtitle: "Dudas comunes",
    defaultText:
      "Respuestas rapidas sobre porciones, horarios, sustituciones y flexibilidad.",
  },
  substitutes: {
    title: "Sustitutos Comunes",
    subtitle: "Opciones de reemplazo",
    defaultText:
      "Intercambios simples entre alimentos para sostener el plan sin friccion.",
  },
  psychology: {
    title: "Aspectos Psicologicos",
    subtitle: "Relacion con la comida",
    defaultText:
      "Estrategias de autocuidado y manejo emocional para sostener cambios.",
  },
  habits: {
    title: "Checklist de Habitos",
    subtitle: "Seguimiento diario",
    defaultText:
      "Checklist practico para hidratacion, descanso, movimiento y organizacion.",
  },
  hungerReal: {
    title: "Hambre Real vs Capricho",
    subtitle: "Senales y decisiones",
    defaultText:
      "Guia para diferenciar hambre fisiologica de hambre emocional.",
  },
};

const S = StyleSheet.create({
  coverPage: {
    padding: 0,
    backgroundColor: "#0b1220",
    fontFamily: "Helvetica",
  },
  coverWrap: {
    flex: 1,
    paddingHorizontal: 56,
    paddingVertical: 58,
    justifyContent: "space-between",
  },
  coverPill: {
    alignSelf: "flex-start",
    backgroundColor: "#052e2a",
    borderWidth: 1,
    borderColor: "#0f766e",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  coverPillText: {
    color: "#99f6e4",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  coverTitle: {
    marginTop: 18,
    fontSize: 36,
    lineHeight: 1.15,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
  },
  coverSubtitle: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 1.5,
    color: "#cbd5e1",
    maxWidth: 430,
  },
  coverMetaCard: {
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 16,
    backgroundColor: "#111827",
    padding: 18,
  },
  coverMetaLabel: {
    color: "#a7f3d0",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  coverMetaValue: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  coverMetaDate: {
    marginTop: 8,
    color: "#9ca3af",
    fontSize: 10,
  },

  contentPage: {
    paddingTop: 28,
    paddingBottom: 50,
    paddingHorizontal: 30,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 10,
    lineHeight: 1.55,
  },
  topHeader: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
    paddingBottom: 8,
  },
  topHeaderTitle: {
    fontSize: 14.5,
    color: "#065f46",
    fontFamily: "Helvetica-Bold",
  },
  chapter: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  chapterHeader: {
    backgroundColor: "#ecfdf5",
    borderBottomWidth: 1,
    borderBottomColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chapterOverline: {
    fontSize: 8.2,
    color: "#047857",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  chapterTitle: {
    marginTop: 2,
    color: "#065f46",
    fontSize: 12.2,
    fontFamily: "Helvetica-Bold",
  },
  chapterDesc: {
    marginTop: 2,
    color: "#475569",
    fontSize: 8.6,
    lineHeight: 1.45,
  },
  chapterBody: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  indexList: {
    marginTop: 2,
  },
  indexItem: {
    fontSize: 9.4,
    color: "#1f2937",
    lineHeight: 1.6,
    marginBottom: 4,
  },
  paragraph: {
    color: "#1f2937",
    fontSize: 10,
    lineHeight: 1.6,
  },
  muted: {
    color: "#6b7280",
    fontSize: 9.5,
    fontStyle: "italic",
  },
  tagRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  tag: {
    fontSize: 8.2,
    color: "#047857",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },

  tableChunk: {
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tableHeadText: {
    fontSize: 8.2,
    color: "#374151",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  tableCellPrimary: {
    fontSize: 9.5,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
  },
  tableCellSecondary: {
    fontSize: 8.8,
    color: "#374151",
  },
  c1: { width: "40%" },
  c2: { width: "14%" },
  c3: { width: "14%" },
  c4: { width: "16%" },
  c5: { width: "16%", textAlign: "right" },

  recipeDay: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 10,
    color: "#047857",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  recipeItem: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    marginBottom: 5,
    backgroundColor: "#f9fafb",
  },
  recipeLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  recipeTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  recipeImageWrap: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#e5e7eb",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  recipeTitle: {
    fontSize: 9.9,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  recipeMeta: {
    marginTop: 2,
    fontSize: 8.6,
    color: "#475569",
  },
  recipeDesc: {
    marginTop: 3,
    fontSize: 8.6,
    color: "#334155",
    lineHeight: 1.45,
  },
  resourceCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#f8fafc",
    marginBottom: 5,
  },
  resourceTitle: {
    fontSize: 9.8,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
  },
  resourceSubtitle: {
    marginTop: 1,
    fontSize: 8.2,
    color: "#047857",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  resourceText: {
    marginTop: 4,
    fontSize: 8.8,
    color: "#334155",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    color: "#6b7280",
    fontSize: 7.8,
  },
});

const htmlToText = (value: string) =>
  (value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const safeString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const splitChunks = <T,>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const getDayOrder = (dayRaw: string) => {
  const day = dayRaw.toLowerCase();
  if (day.includes("lun")) return 1;
  if (day.includes("mar")) return 2;
  if (day.includes("mie") || day.includes("mié")) return 3;
  if (day.includes("jue")) return 4;
  if (day.includes("vie")) return 5;
  if (day.includes("sab") || day.includes("sáb")) return 6;
  if (day.includes("dom")) return 7;
  return 99;
};

const toRecipeEntry = (day: string, slotRaw: unknown): RecipeEntry | null => {
  const slot = toRecord(slotRaw);
  const recipeUnknown = slot.recipe;
  const recipe = toRecord(recipeUnknown);
  const title =
    safeString(recipe.title) ||
    safeString(slot.recipeTitle) ||
    safeString(slot.title) ||
    safeString(slot.mealText) ||
    (typeof recipeUnknown === "string" ? safeString(recipeUnknown) : "");
  if (!title) return null;

  return {
    day: safeString(day) || "Dia",
    dayOrder: getDayOrder(safeString(day)),
    time: safeString(slot.time) || "--:--",
    section:
      safeString(slot.label) ||
      safeString(slot.mealSection) ||
      safeString(recipe.mealSection) ||
      "Bloque",
    title,
    portion:
      safeString(recipe.recommendedPortion) ||
      safeString(slot.recommendedPortion) ||
      safeString(slot.portion) ||
      "Porcion no especificada",
    calories: (recipe.calories as number | string | undefined) ?? (slot.calories as number | string | undefined),
    protein: (recipe.protein as number | string | undefined) ?? (slot.protein as number | string | undefined),
    carbs: (recipe.carbs as number | string | undefined) ?? (slot.carbs as number | string | undefined),
    fats: (recipe.fats as number | string | undefined) ?? (slot.fats as number | string | undefined),
    description: safeString(recipe.description) || safeString(slot.description),
    image: safeString(recipe.image) || safeString(slot.image) || undefined,
  };
};

const getRecipesForPdf = (recipesRaw: unknown): RecipeEntry[] => {
  const recipes = toRecord(recipesRaw);
  const collected: RecipeEntry[] = [];

  const weekSlots = recipes.weekSlots;
  if (weekSlots && typeof weekSlots === "object") {
    Object.entries(weekSlots as Record<string, unknown>).forEach(([day, slots]) => {
      if (!Array.isArray(slots)) return;
      slots.forEach((slot) => {
        const entry = toRecipeEntry(day, slot);
        if (entry) collected.push(entry);
      });
    });
  }

  if (Array.isArray(recipes.days)) {
    recipes.days.forEach((dayItemRaw) => {
      const dayItem = toRecord(dayItemRaw);
      const dayLabel = safeString(dayItem.day) || safeString(dayItem.label) || "Dia";
      const slots = Array.isArray(dayItem.slots)
        ? dayItem.slots
        : Array.isArray(dayItem.recipes)
          ? dayItem.recipes
          : [];
      slots.forEach((slotRaw) => {
        const entry = toRecipeEntry(dayLabel, slotRaw);
        if (entry) collected.push(entry);
      });
    });
  }

  if (Array.isArray(recipes.dishes)) {
    recipes.dishes.forEach((dishRaw, index: number) => {
      const dish = toRecord(dishRaw);
      const pseudoSlot = {
        time: safeString(dish.time),
        label: safeString(dish.mealSection) || "Plato",
        recipe: {
          title: safeString(dish.title),
          recommendedPortion: safeString(dish.recommendedPortion),
          calories: dish.calories,
          protein: dish.protein,
          carbs: dish.carbs,
          fats: dish.fats,
          description: safeString(dish.description),
          image: safeString(dish.image),
        },
      };
      const entry = toRecipeEntry(`Dia ${index + 1}`, pseudoSlot);
      if (entry) collected.push(entry);
    });
  }

  const unique = new Map<string, RecipeEntry>();
  collected.forEach((item) => {
    const key = `${item.day}|${item.time}|${item.section}|${item.title}`.toLowerCase();
    if (!unique.has(key)) unique.set(key, item);
  });

  return Array.from(unique.values()).sort((a, b) => {
    if (a.dayOrder !== b.dayOrder) return a.dayOrder - b.dayOrder;
    if (a.day !== b.day) return a.day.localeCompare(b.day);
    return a.time.localeCompare(b.time);
  });
};

const getCartItems = (cartRaw: unknown): Record<string, unknown>[] => {
  const cart = toRecord(cartRaw);
  return Array.isArray(cart.items)
    ? cart.items.filter((it): it is Record<string, unknown> => Boolean(it && typeof it === "object"))
    : [];
};

const buildResourceChapters = (selectedSections: string[], resourcePagesRaw: unknown): ChapterResource[] => {
  const infoResources = selectedSections
    .filter((id) => Object.keys(INFO_SECTION_CATALOG).includes(id))
    .map((id) => ({
      title: INFO_SECTION_CATALOG[id].title,
      subtitle: INFO_SECTION_CATALOG[id].subtitle,
      content: INFO_SECTION_CATALOG[id].defaultText,
    }));

  const customPages = Array.isArray(resourcePagesRaw)
    ? resourcePagesRaw
        .map((p) => toRecord(p))
        .filter((page) => !/portada|cover|introducci/i.test(safeString(page.title)))
        .map((page) => ({
          title: safeString(page.title) || "Recurso adicional",
          subtitle: "Contenido personalizado",
          content: htmlToText(safeString(page.content)),
        }))
    : [];

  return [...infoResources, ...customPages].filter((r) => safeString(r.content));
};

export const StandardTemplate = ({ data, config }: StandardTemplateProps) => {
  const patientMeta = toRecord(data.patientMeta);
  const cartItems = getCartItems(data.cart);
  const recipeEntries = getRecipesForPdf(data.recipes);
  const deliverable = toRecord(data.deliverable);
  const selectedSections = Array.isArray(config.selectedSections) ? config.selectedSections : [];
  const resources = buildResourceChapters(selectedSections, deliverable.resourcePages);

  const patientName = safeString(patientMeta.fullName) || "Paciente sin asignar";
  const patientFocus =
    safeString(patientMeta.nutritionalFocus) ||
    safeString(patientMeta.fitnessGoals) ||
    "Plan nutricional personalizado";
  const welcomeMessage = htmlToText(safeString(deliverable.welcomeMessage));

  const currentDate = new Date().toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const restrictions = Array.isArray(patientMeta.restrictions)
    ? (patientMeta.restrictions as unknown[]).map((r) => safeString(r)).filter(Boolean)
    : [];

  const recipesByDay = recipeEntries.reduce<Record<string, RecipeEntry[]>>((acc, entry) => {
    if (!acc[entry.day]) acc[entry.day] = [];
    acc[entry.day].push(entry);
    return acc;
  }, {});

  const cartChunks = splitChunks(cartItems, 18);
  const indexItems = [
    "1. Introduccion y mensaje inicial",
    "2. Datos principales del paciente",
    "3. Capitulo I: Tu carrito de compras",
    "4. Capitulo II: Recetas y porciones",
    "5. Capitulo III: Recursos y recomendaciones",
  ];

  return (
    <Document title={`Entregable Nutricional - ${patientName}`} author="NutriSaaS" creator="NutriSaaS">
      <Page size="A4" style={S.coverPage}>
        <View style={S.coverWrap}>
          <View>
            <View style={S.coverPill}>
              <Text style={S.coverPillText}>NutriSaaS | Entregable final</Text>
            </View>
            <Text style={S.coverTitle}>Plan de Alimentacion{"\n"}Personalizado</Text>
            <Text style={S.coverSubtitle}>
              Documento integral con recomendaciones practicas, carrito de compras, recetas y recursos de apoyo.
            </Text>
          </View>
          <View style={S.coverMetaCard}>
            <Text style={S.coverMetaLabel}>Paciente</Text>
            <Text style={S.coverMetaValue}>{patientName}</Text>
            <Text style={S.coverMetaDate}>{currentDate}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={S.contentPage} wrap>
        <View style={S.topHeader}>
          <Text style={S.topHeaderTitle}>Entregable Integral Nutricional</Text>
        </View>

        {welcomeMessage ? (
          <View style={S.chapter} wrap={false}>
            <View style={S.chapterHeader}>
              <Text style={S.chapterOverline}>Introduccion</Text>
              <Text style={S.chapterTitle}>Mensaje inicial del nutricionista</Text>
            </View>
            <View style={S.chapterBody}>
              <Text style={S.paragraph}>{welcomeMessage}</Text>
            </View>
          </View>
        ) : null}

        <View style={S.chapter} wrap={false}>
          <View style={S.chapterHeader}>
            <Text style={S.chapterOverline}>Indice</Text>
            <Text style={S.chapterTitle}>Contenido del entregable</Text>
            <Text style={S.chapterDesc}>Ruta rapida de las secciones incluidas en este documento.</Text>
          </View>
          <View style={S.chapterBody}>
            <View style={S.indexList}>
              {indexItems.map((item) => (
                <Text key={item} style={S.indexItem}>
                  {item}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={S.chapter} wrap={false}>
          <View style={S.chapterHeader}>
            <Text style={S.chapterOverline}>Ficha del paciente</Text>
            <Text style={S.chapterTitle}>Datos principales</Text>
            <Text style={S.chapterDesc}>Contexto clinico y enfoque del plan.</Text>
          </View>
          <View style={S.chapterBody}>
            <Text style={S.paragraph}>Paciente: {patientName}</Text>
            <Text style={S.paragraph}>Enfoque principal: {patientFocus}</Text>
            <Text style={S.paragraph}>
              Peso: {patientMeta.weight ? `${patientMeta.weight} kg` : "No registrado"} | Estatura:{" "}
              {patientMeta.height ? `${patientMeta.height} cm` : "No registrada"}
            </Text>
            {restrictions.length > 0 ? (
              <View style={S.tagRow}>
                {restrictions.map((item, idx) => (
                  <Text key={`${item}-${idx}`} style={S.tag}>
                    {item}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={S.muted}>No se registran restricciones activas.</Text>
            )}
          </View>
        </View>

        <View style={S.chapter}>
          <View style={S.chapterHeader}>
            <Text style={S.chapterOverline}>Capitulo I</Text>
            <Text style={S.chapterTitle}>Tu carrito de compras</Text>
            <Text style={S.chapterDesc}>
              Cantidades referenciales semanales y mensuales para organizar compras con mayor comodidad.
            </Text>
          </View>
          <View style={S.chapterBody}>
            {cartItems.length === 0 ? (
              <Text style={S.muted}>No hay items de carrito cargados.</Text>
            ) : (
              cartChunks.map((chunk, chunkIndex) => (
                <View key={`cart-chunk-${chunkIndex}`} style={S.tableChunk} wrap={false}>
                  <View style={S.tableHeader}>
                    <View style={S.c1}><Text style={S.tableHeadText}>Alimento</Text></View>
                    <View style={S.c2}><Text style={S.tableHeadText}>Semanal</Text></View>
                    <View style={S.c3}><Text style={S.tableHeadText}>Mensual</Text></View>
                    <View style={S.c4}><Text style={S.tableHeadText}>Porcion</Text></View>
                    <View style={S.c5}><Text style={S.tableHeadText}>Unidad</Text></View>
                  </View>
                  {chunk.map((item, rowIndex) => (
                    <View key={`cart-${chunkIndex}-${rowIndex}`} style={S.tableRow} wrap={false}>
                      <View style={S.c1}>
                        <Text style={S.tableCellPrimary}>
                          {safeString(item.producto) || safeString(item.name) || "Alimento"}
                        </Text>
                        <Text style={S.tableCellSecondary}>
                          {safeString(item.grupo) || safeString(item.group) || ""}
                        </Text>
                      </View>
                      <View style={S.c2}>
                        <Text style={S.tableCellSecondary}>
                          {(item.porcionesSemanales as string | number | undefined) ??
                            (item.frecuenciaSemanal as string | number | undefined) ??
                            (item.cantidadSemanal as string | number | undefined) ??
                            "-"}
                        </Text>
                      </View>
                      <View style={S.c3}>
                        <Text style={S.tableCellSecondary}>
                          {(item.porcionesMensuales as string | number | undefined) ??
                            (item.cantidadMes as string | number | undefined) ??
                            "-"}
                        </Text>
                      </View>
                      <View style={S.c4}>
                        <Text style={S.tableCellSecondary}>
                          {(item.porcionGramos as string | number | undefined) ??
                            (item.portionGrams as string | number | undefined) ??
                            "-"}
                        </Text>
                      </View>
                      <View style={S.c5}>
                        <Text style={S.tableCellSecondary}>
                          {safeString(item.unidad) || safeString(item.unit) || "porciones"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        </View>

        <View style={S.chapter}>
          <View style={S.chapterHeader}>
            <Text style={S.chapterOverline}>Capitulo II</Text>
            <Text style={S.chapterTitle}>Recetas y porciones</Text>
            <Text style={S.chapterDesc}>
              Planificacion por dia y bloque horario, considerando porciones y macros de referencia.
            </Text>
          </View>
          <View style={S.chapterBody}>
            {recipeEntries.length === 0 ? (
              <Text style={S.muted}>No hay platos cargados en la planificacion.</Text>
            ) : (
              Object.keys(recipesByDay)
                .sort((a, b) => getDayOrder(a) - getDayOrder(b) || a.localeCompare(b))
                .map((day) => (
                  <View key={`day-${day}`}>
                    <Text style={S.recipeDay}>{day}</Text>
                    {recipesByDay[day].map((entry, idx) => {
                      const macros = `Kcal ${entry.calories ?? "-"} | Prot ${entry.protein ?? "-"}g | HC ${entry.carbs ?? "-"}g | Grasas ${entry.fats ?? "-"}g`;
                      return (
                        <View key={`${day}-${idx}-${entry.title}`} style={S.recipeItem} wrap={false}>
                          <View style={S.recipeLayout}>
                            <View style={S.recipeTextWrap}>
                              <Text style={S.recipeTitle}>{entry.title}</Text>
                              <Text style={S.recipeMeta}>{entry.time} | {entry.section}</Text>
                              <Text style={S.recipeMeta}>Porcion: {entry.portion}</Text>
                              <Text style={S.recipeMeta}>{macros}</Text>
                              {entry.description ? <Text style={S.recipeDesc}>{entry.description}</Text> : null}
                            </View>
                            {entry.image ? (
                              <View style={S.recipeImageWrap}>
                                <Image src={entry.image} style={S.recipeImage} alt="" />
                              </View>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))
            )}
          </View>
        </View>

        <View style={S.chapter}>
          <View style={S.chapterHeader}>
            <Text style={S.chapterOverline}>Capitulo III</Text>
            <Text style={S.chapterTitle}>Recursos y recomendaciones</Text>
            <Text style={S.chapterDesc}>Material educativo complementario para reforzar adherencia y autonomia.</Text>
          </View>
          <View style={S.chapterBody}>
            {resources.length === 0 ? (
              <Text style={S.muted}>No hay recursos agregados en este entregable.</Text>
            ) : (
              resources.map((resource, idx) => (
                <View key={`resource-${idx}`} style={S.resourceCard} wrap={false}>
                  <Text style={S.resourceTitle}>{resource.title}</Text>
                  <Text style={S.resourceSubtitle}>{resource.subtitle}</Text>
                  <Text style={S.resourceText}>{resource.content}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={S.footer} fixed>
          <Text style={S.footerText}>NutriSaaS | Entregable final</Text>
          <Text style={S.footerText}>{currentDate}</Text>
        </View>
      </Page>
    </Document>
  );
};
