import React from "react";
import { Document, Image, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import exchangePortionGuide from "@/content/exchange-portions.json";

interface StandardTemplateProps {
  data: Record<string, unknown>;
  config: {
    includeLogo: boolean;
    selectedSections: string[];
    brandSettings?: {
      primaryColorHex?: string;
      brandBackgroundUrl?: string;
      professionalInstagram?: string;
      professionalPhone?: string;
      professionalEmail?: string;
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

type WeeklyRecipeRow = {
  day: string;
  time: string;
  section: string;
  title: string;
  portion: string;
};

type ExchangePortionRow = {
  category: string;
  portion: string;
  notes?: string;
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

const EXCHANGE_PORTION_GUIDE = Array.isArray(exchangePortionGuide)
  ? (exchangePortionGuide as ExchangePortionRow[])
  : [];

const S = StyleSheet.create({
  coverPage: {
    padding: 0,
    backgroundColor: "#0b1220",
    fontFamily: "Helvetica",
    position: "relative",
  },
  coverWrap: {
    flex: 1,
    paddingHorizontal: 56,
    paddingVertical: 48,
    position: "relative",
  },
  coverGradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    backgroundColor: "#18314a",
    opacity: 0.35,
  },
  coverGradientMiddle: {
    position: "absolute",
    top: 280,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: "#102338",
    opacity: 0.32,
  },
  coverGradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 360,
    backgroundColor: "#070f1c",
    opacity: 0.45,
  },
  coverGlowLeft: {
    position: "absolute",
    top: -140,
    left: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "#2f5a86",
    opacity: 0.18,
  },
  coverGlowRight: {
    position: "absolute",
    bottom: -170,
    right: -130,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "#12263c",
    opacity: 0.25,
  },
  coverContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  coverBrandTop: {
    color: "#dbeafe",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    textTransform: "lowercase",
  },
  coverCenter: {
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  coverTitle: {
    fontSize: 42,
    lineHeight: 1.12,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    maxWidth: 470,
  },
  coverSubtitle: {
    marginTop: 14,
    fontSize: 12.5,
    lineHeight: 1.55,
    color: "#d1d5db",
    textAlign: "center",
    maxWidth: 455,
  },
  coverBottom: {
    borderTopWidth: 1,
    borderTopColor: "#1f3044",
    paddingTop: 14,
  },
  coverBottomText: {
    color: "#e2e8f0",
    fontSize: 10.5,
    lineHeight: 1.55,
  },
  coverBottomLabel: {
    color: "#93c5fd",
    fontSize: 9.2,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  coverContactList: {
    marginTop: 4,
  },
  coverContactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  coverContactIconWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#111c2c",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },
  coverContactText: {
    color: "#e2e8f0",
    fontSize: 10.2,
    lineHeight: 1.5,
  },

  contentPage: {
    paddingTop: 28,
    paddingBottom: 50,
    paddingHorizontal: 30,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 11.2,
    lineHeight: 1.65,
  },
  chapterPage: {
    paddingTop: 26,
    paddingBottom: 50,
    paddingHorizontal: 30,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 11.2,
    lineHeight: 1.65,
  },
  chapterHero: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  chapterHeroOverline: {
    fontSize: 10.2,
    color: "#d1fae5",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chapterHeroTitle: {
    marginTop: 3,
    fontSize: 24,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.22,
  },
  chapterHeroDesc: {
    marginTop: 5,
    fontSize: 11.4,
    color: "#e2e8f0",
    lineHeight: 1.55,
  },
  chapterPageBody: {
    paddingTop: 2,
  },
  topHeader: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 6,
  },
  topHeaderTitle: {
    fontSize: 17,
    color: "#065f46",
    fontFamily: "Helvetica-Bold",
  },
  introGreeting: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 18,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.35,
  },
  introDescription: {
    fontSize: 11.6,
    color: "#1f2937",
    lineHeight: 1.72,
  },
  patientSectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 16.5,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  patientRow: {
    marginBottom: 4,
    fontSize: 10.6,
    color: "#1f2937",
    lineHeight: 1.7,
  },
  patientRowLabel: {
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  chapter: {
    marginBottom: 12,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  chapterHeader: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  chapterOverline: {
    fontSize: 10,
    color: "#047857",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  chapterTitle: {
    marginTop: 2,
    color: "#065f46",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  chapterDesc: {
    marginTop: 2,
    color: "#475569",
    fontSize: 10.5,
    lineHeight: 1.6,
  },
  chapterBody: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  indexList: {
    marginTop: 2,
  },
  indexItem: {
    fontSize: 10.6,
    color: "#1f2937",
    lineHeight: 1.75,
    marginBottom: 4,
  },
  paragraph: {
    color: "#1f2937",
    fontSize: 11.2,
    lineHeight: 1.72,
  },
  muted: {
    color: "#6b7280",
    fontSize: 10.4,
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
    fontSize: 9.2,
    color: "#374151",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  tableCellPrimary: {
    fontSize: 10.8,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.35,
  },
  tableCellSecondary: {
    marginTop: 2,
    fontSize: 9.8,
    color: "#374151",
    lineHeight: 1.35,
  },
  c1: { width: "40%" },
  c2: { width: "30%" },
  c3: { width: "30%" },

  exchangeTable: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 8,
    overflow: "hidden",
  },
  exchangeHeader: {
    flexDirection: "row",
    backgroundColor: "#ecfeff",
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  exchangeRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  exchangeHeadText: {
    fontSize: 9.2,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  exchangeCell: {
    fontSize: 10.1,
    color: "#1f2937",
    lineHeight: 1.35,
  },
  exchangeNote: {
    fontSize: 8.6,
    color: "#475569",
    lineHeight: 1.3,
  },
  e1: { width: "28%" },
  e2: { width: "50%" },
  e3: { width: "22%" },

  recipeDay: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 12.8,
    color: "#1d4ed8",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  recipeCard: {
    width: "84%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#f8fbff",
  },
  recipeCardImage: {
    width: "100%",
    height: 180,
    objectFit: "cover",
  },
  recipeCardBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recipeTitle: {
    fontSize: 12.6,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  recipeMeta: {
    marginTop: 4,
    fontSize: 10.4,
    color: "#334155",
  },
  recipeCookTitle: {
    marginTop: 8,
    fontSize: 11.2,
    color: "#1d4ed8",
    fontFamily: "Helvetica-Bold",
  },
  recipeDesc: {
    marginTop: 4,
    fontSize: 10.4,
    color: "#334155",
    lineHeight: 1.62,
  },
  resourceFlowBlock: {
    marginBottom: 12,
  },
  resourceFlowTitle: {
    fontSize: 14.4,
    color: "#7c3aed",
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.35,
  },
  resourceFlowText: {
    marginTop: 5,
    fontSize: 11.1,
    color: "#334155",
    lineHeight: 1.74,
  },
  recipeInfoGrid: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 10,
    overflow: "hidden",
  },
  recipeInfoHeader: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  recipeInfoHeaderText: {
    fontSize: 10.4,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
    textTransform: "uppercase",
  },
  recipeInfoBody: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  recipeInfoText: {
    fontSize: 10.6,
    color: "#334155",
    lineHeight: 1.65,
    marginBottom: 3,
  },
  weeklyTable: {
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  weeklyHeader: {
    flexDirection: "row",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
  },
  weeklyHeadText: {
    fontSize: 9.4,
    color: "#1e3a8a",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  weeklyRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e7ff",
  },
  weeklyCell: {
    fontSize: 9.9,
    color: "#1f2937",
    lineHeight: 1.45,
  },
  w1: { width: "18%" },
  w2: { width: "14%" },
  w3: { width: "18%" },
  w4: { width: "30%" },
  w5: { width: "20%" },
  repetitionTable: {
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
  },
  repetitionHeader: {
    flexDirection: "row",
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#c7d2fe",
  },
  repetitionRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  r1: { width: "42%" },
  r2: { width: "18%" },
  r3: { width: "40%" },
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

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatGramsValue = (grams: number): string => {
  if (!Number.isFinite(grams) || grams <= 0) return "0g";
  const rounded = Math.round(grams * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}g`;
};

const getPortionLabel = (item: Record<string, unknown>): string => {
  const exchange = toRecord(item.exchange);
  const raw =
    safeString(exchange.label) ||
    safeString(item.unidad) ||
    safeString(item.unit) ||
    "porcion";
  return raw.toLowerCase();
};

const buildQuantityText = (item: Record<string, unknown>, frequencyMultiplier = 1): string => {
  const portionGrams =
    toNumber(item.porcionGramos) ||
    toNumber(item.portionGrams);
  const weeklyFrequency =
    toNumber(item.frecuenciaSemanal) ||
    toNumber(item.porcionesSemanales) ||
    toNumber(item.cantidadSemanal);

  const effectiveFrequency = Math.max(0, weeklyFrequency * frequencyMultiplier);
  const totalGrams = portionGrams * effectiveFrequency;
  const portionLabel = getPortionLabel(item);
  const roundedPortions = Math.round(effectiveFrequency * 10) / 10;
  const portionsText = Number.isInteger(roundedPortions)
    ? roundedPortions.toFixed(0)
    : roundedPortions.toFixed(1);

  return `${formatGramsValue(totalGrams)} (${portionsText} ${portionLabel})`;
};

const DEFAULT_RECIPE_IMAGE = null;

const normalizeRecipeImageSrc = (value?: string): string | undefined => {
  const raw = safeString(value);
  if (!raw) return undefined;

  const lower = raw.toLowerCase();
  if (lower.startsWith("data:image/")) return raw;
  if (lower.startsWith("blob:") || lower.startsWith("file:")) return undefined;

  // If it's a URL, we allow it. React PDF will handle the fetching.
  // We remove the strict extension check because many dynamic URLs (Supabase, S3) 
  // don't end in .jpg/.png but are still valid images.
  if (lower.startsWith("http://") || lower.startsWith("https://")) return raw;

  return undefined;
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

  const imageSrc =
    normalizeRecipeImageSrc(safeString(recipe.image)) ||
    normalizeRecipeImageSrc(safeString(recipe.imageUrl)) ||
    normalizeRecipeImageSrc(safeString(slot.image)) ||
    normalizeRecipeImageSrc(safeString(slot.imageUrl)) ||
    undefined;

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
    image: imageSrc,
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

const getConfiguredRecipeDays = (recipesRaw: unknown, entries: RecipeEntry[]): string[] => {
  const recipes = toRecord(recipesRaw);
  const weekSlots = recipes.weekSlots;
  if (weekSlots && typeof weekSlots === "object") {
    return Object.keys(weekSlots)
      .filter((day) => Array.isArray((weekSlots as Record<string, unknown>)[day]))
      .sort((a, b) => getDayOrder(a) - getDayOrder(b) || a.localeCompare(b));
  }

  if (Array.isArray(recipes.days)) {
    return recipes.days
      .map((dayRaw) => {
        const day = toRecord(dayRaw);
        return safeString(day.day) || safeString(day.label);
      })
      .filter(Boolean)
      .sort((a, b) => getDayOrder(a) - getDayOrder(b) || a.localeCompare(b));
  }

  return Array.from(new Set(entries.map((entry) => entry.day)))
    .filter(Boolean)
    .sort((a, b) => getDayOrder(a) - getDayOrder(b) || a.localeCompare(b));
};

const buildWeeklyRecipeRows = (entries: RecipeEntry[]): WeeklyRecipeRow[] =>
  entries.map((entry) => ({
    day: entry.day,
    time: entry.time,
    section: entry.section,
    title: entry.title,
    portion: entry.portion,
  }));

const buildRecipeRepetitionRows = (entries: RecipeEntry[]) => {
  const grouped = new Map<string, { title: string; count: number; days: Set<string>; portions: Set<string> }>();
  entries.forEach((entry) => {
    const key = entry.title.toLowerCase().trim();
    const current = grouped.get(key) || {
      title: entry.title,
      count: 0,
      days: new Set<string>(),
      portions: new Set<string>(),
    };
    current.count += 1;
    current.days.add(entry.day);
    if (safeString(entry.portion)) current.portions.add(entry.portion);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((row) => ({
      title: row.title,
      repetitions: row.count,
      days: Array.from(row.days).sort((a, b) => getDayOrder(a) - getDayOrder(b) || a.localeCompare(b)).join(", "),
      portionGuide: Array.from(row.portions).join(" / ") || "No definida",
    }))
    .sort((a, b) => b.repetitions - a.repetitions || a.title.localeCompare(b.title));
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

const formatPatientKey = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const toPatientRows = (
  value: unknown,
  parentLabel = "",
): { label: string; value: string }[] => {
  if (value === null || value === undefined) {
    if (!parentLabel) return [];
    return [{ label: parentLabel, value: "No registrado" }];
  }

  if (Array.isArray(value)) {
    if (!parentLabel) return [];
    if (value.length === 0) return [{ label: parentLabel, value: "[]" }];
    const hasComplex = value.some(
      (item) => item && typeof item === "object",
    );
    if (!hasComplex) {
      return [{ label: parentLabel, value: value.map((item) => String(item)).join(", ") }];
    }
    return value.flatMap((item, index) =>
      toPatientRows(item, `${parentLabel} ${index + 1}`),
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return parentLabel ? [{ label: parentLabel, value: "{}" }] : [];
    }
    return entries.flatMap(([key, nestedValue]) => {
      const label = parentLabel
        ? `${parentLabel} > ${formatPatientKey(key)}`
        : formatPatientKey(key);
      return toPatientRows(nestedValue, label);
    });
  }

  if (!parentLabel) return [];
  const rendered = String(value).trim();
  return [{ label: parentLabel, value: rendered || "No registrado" }];
};

type ContactIconKind = "calendar" | "mail" | "whatsapp" | "instagram";

const CoverIcon = ({ kind }: { kind: ContactIconKind }) => {
  if (kind === "calendar") {
    return (
      <Svg width={10} height={10} viewBox="0 0 24 24">
        <Path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="#93c5fd" strokeWidth={2} fill="none" />
      </Svg>
    );
  }
  if (kind === "mail") {
    return (
      <Svg width={10} height={10} viewBox="0 0 24 24">
        <Path d="M3 6h18v12H3zM3 7l9 7 9-7" stroke="#93c5fd" strokeWidth={2} fill="none" />
      </Svg>
    );
  }
  if (kind === "whatsapp") {
    return (
      <Svg width={10} height={10} viewBox="0 0 24 24">
        <Path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" stroke="#93c5fd" strokeWidth={2} fill="none" />
        <Path d="M9 9.5c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 2c.1.2 0 .4-.1.6l-.4.6c.4.7 1 1.3 1.7 1.7l.6-.4c.2-.1.4-.2.6-.1l2 .8c.3.1.4.3.4.5v.5c0 .3-.1.5-.5.7-.5.2-1 .3-1.5.2-2.7-.7-4.8-2.8-5.5-5.5-.1-.5 0-1 .2-1.5Z" fill="#93c5fd" />
      </Svg>
    );
  }
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24">
      <Path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z" stroke="#93c5fd" strokeWidth={2} fill="none" />
      <Path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" stroke="#93c5fd" strokeWidth={2} fill="none" />
      <Path d="M17.5 7.5h.01" stroke="#93c5fd" strokeWidth={2.2} fill="none" />
    </Svg>
  );
};

export const StandardTemplate = ({ data, config }: StandardTemplateProps) => {
  const patientMeta = toRecord(data.patientMeta);
  const cartItems = getCartItems(data.cart);
  const recipesRaw = toRecord(data.recipes);
  const recipeEntries = getRecipesForPdf(recipesRaw);
  const deliverable = toRecord(data.deliverable);
  const brandSettings = toRecord(config.brandSettings);
  const selectedSections = Array.isArray(config.selectedSections) ? config.selectedSections : [];
  const resources = buildResourceChapters(selectedSections, deliverable.resourcePages);
  const showExchangePortions = selectedSections.includes("exchangePortions");

  const patientName = safeString(patientMeta.fullName) || "Paciente sin asignar";
  const welcomeMessage = htmlToText(safeString(deliverable.welcomeMessage));
  const professionalInstagram = safeString(brandSettings.professionalInstagram);
  const professionalPhone = safeString(brandSettings.professionalPhone);
  const professionalEmail = safeString(brandSettings.professionalEmail);
  const contactLines: { kind: ContactIconKind; text: string }[] = [];
  if (professionalEmail) contactLines.push({ kind: "mail", text: professionalEmail });
  if (professionalPhone) contactLines.push({ kind: "whatsapp", text: professionalPhone });
  if (professionalInstagram) contactLines.push({ kind: "instagram", text: professionalInstagram });

  const currentDate = new Date().toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const restrictions = Array.isArray(patientMeta.restrictions)
    ? (patientMeta.restrictions as unknown[]).map((r) => safeString(r)).filter(Boolean)
    : [];
  const patientRows = toPatientRows(patientMeta).filter(
    (row) => row.label.toLowerCase() !== "updated at",
  );
  const greeting = patientName && patientName !== "Paciente sin asignar"
    ? `Bienvenido/a ${patientName},`
    : "Bienvenido/a,";

  const recipesByDay = recipeEntries.reduce<Record<string, RecipeEntry[]>>((acc, entry) => {
    if (!acc[entry.day]) acc[entry.day] = [];
    acc[entry.day].push(entry);
    return acc;
  }, {});

  const cartChunks = splitChunks(cartItems, 16);
  const configuredRecipeDays = getConfiguredRecipeDays(recipesRaw, recipeEntries);
  const weeklyRecipeRows = buildWeeklyRecipeRows(recipeEntries);
  const repetitionRows = buildRecipeRepetitionRows(recipeEntries);
  const plannerView = safeString(recipesRaw.plannerView) || "weekly";
  const cycleDayCount =
    typeof recipesRaw.cycleDayCount === "number" ? recipesRaw.cycleDayCount : configuredRecipeDays.length;
  const mealCount = typeof recipesRaw.mealCount === "number" ? recipesRaw.mealCount : undefined;
  const allowMealRepetition = Boolean(
    toRecord(recipesRaw.patientAdvisories).allowMealRepetition,
  );
  return (
    <Document title={`Entregable Nutricional - ${patientName}`} author="NutriNet" creator="NutriNet">
      <Page size="A4" style={S.coverPage}>
        <View style={S.coverWrap}>
          <View style={S.coverGradientTop} />
          <View style={S.coverGradientMiddle} />
          <View style={S.coverGradientBottom} />
          <View style={S.coverGlowLeft} />
          <View style={S.coverGlowRight} />

          <View style={S.coverContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={S.coverBrandTop}>NutriNet</Text>
              {Boolean(config.includeLogo && brandSettings.brandBackgroundUrl) && (
                <Image
                  src={brandSettings.brandBackgroundUrl as string}
                  style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain' }}
                />
              )}
            </View>

            <View style={S.coverCenter}>
              <Text style={S.coverTitle}>Plan Nutricional{"\n"}Personalizado</Text>
              <Text style={S.coverSubtitle}>
                Documento integral con recomendaciones practicas, carrito de compras, recetas y recursos de apoyo
              </Text>
            </View>

            <View style={S.coverBottom}>
              <Text style={S.coverBottomLabel}>Fecha</Text>
              <View style={S.coverContactRow}>
                <View style={S.coverContactIconWrap}>
                  <CoverIcon kind="calendar" />
                </View>
                <Text style={S.coverContactText}>{currentDate}</Text>
              </View>
              <Text style={[S.coverBottomLabel, { marginTop: 8 }]}>Contactos del nutri</Text>
              <View style={S.coverContactList}>
                {contactLines.length > 0 ? (
                  contactLines.map((item) => (
                    <View key={`${item.kind}-${item.text}`} style={S.coverContactRow}>
                      <View style={S.coverContactIconWrap}>
                        <CoverIcon kind={item.kind} />
                      </View>
                      <Text style={S.coverContactText}>{item.text}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={S.coverBottomText}>Sin contactos del nutricionista registrados.</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Page>

      <Page size="A4" style={S.contentPage} wrap>
        <View style={S.topHeader}>
          <Text style={S.topHeaderTitle}>Entregable Integral Nutricional</Text>
        </View>

        <Text style={S.introGreeting}>{greeting}</Text>
        <Text style={S.introDescription}>
          {welcomeMessage || "Aqui puedes agregar una descripcion personalizada para tu paciente."}
        </Text>

        <Text style={S.patientSectionTitle}>Informacion del paciente</Text>
        {patientRows.length > 0 ? (
          patientRows.map((row, index) => (
            <Text key={`${row.label}-${index}`} style={S.patientRow}>
              <Text style={S.patientRowLabel}>{row.label}: </Text>
              {truncate(row.value, 900)}
            </Text>
          ))
        ) : (
          <Text style={S.muted}>No hay informacion de paciente disponible.</Text>
        )}

        {restrictions.length > 0 ? (
          <View style={S.tagRow}>
            {restrictions.map((item, idx) => (
              <Text key={`${item}-${idx}`} style={S.tag}>
                {item}
              </Text>
            ))}
          </View>
        ) : null}

      </Page>

      <Page size="A4" style={S.chapterPage} wrap>
        <View style={[S.chapterHero, { backgroundColor: "#0f766e" }]}>
          <Text style={S.chapterHeroOverline}>Capitulo I</Text>
          <Text style={S.chapterHeroTitle}>Tu carrito de compras</Text>
          <Text style={S.chapterHeroDesc}>
            Cantidades referenciales semanales y mensuales para organizar compras con mayor comodidad.
          </Text>
        </View>
        <View style={S.chapterPageBody}>
          {cartItems.length === 0 ? (
            <Text style={S.muted}>No hay items de carrito cargados.</Text>
          ) : (
            cartChunks.map((chunk, chunkIndex) => (
              <View key={`cart-chunk-${chunkIndex}`} style={S.tableChunk} wrap={false}>
                <View style={S.tableHeader}>
                  <View style={S.c1}><Text style={S.tableHeadText}>Alimento</Text></View>
                  <View style={S.c2}><Text style={S.tableHeadText}>Cantidad semanal</Text></View>
                  <View style={S.c3}><Text style={S.tableHeadText}>Cantidad mensual</Text></View>
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
                        {buildQuantityText(item, 1)}
                      </Text>
                    </View>
                    <View style={S.c3}>
                      <Text style={S.tableCellSecondary}>
                        {buildQuantityText(item, 4)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </Page>

      <Page size="A4" style={S.chapterPage} wrap>
        <View style={[S.chapterHero, { backgroundColor: "#1d4ed8" }]}>
          <Text style={S.chapterHeroOverline}>Capitulo II</Text>
          <Text style={S.chapterHeroTitle}>Recetas y porciones</Text>
          <Text style={S.chapterHeroDesc}>
            Planificacion por dia y bloque horario, considerando porciones y macros de referencia.
          </Text>
        </View>
        <View style={S.chapterPageBody}>
          {recipeEntries.length === 0 ? (
            <Text style={S.muted}>No hay platos cargados en la planificacion.</Text>
          ) : (
            <>
              <View style={S.recipeInfoGrid} wrap={false}>
                <View style={S.recipeInfoHeader}>
                  <Text style={S.recipeInfoHeaderText}>Resumen de planificacion</Text>
                </View>
                <View style={S.recipeInfoBody}>
                  <Text style={S.recipeInfoText}>Dias configurados: {configuredRecipeDays.join(", ") || "No definidos"}</Text>
                  <Text style={S.recipeInfoText}>Vista del plan: {plannerView === "daily" ? "Diaria" : "Semanal"}</Text>
                  <Text style={S.recipeInfoText}>Cantidad de dias del ciclo: {cycleDayCount || "-"}</Text>
                  <Text style={S.recipeInfoText}>Comidas por dia objetivo: {mealCount || "-"}</Text>
                  <Text style={S.recipeInfoText}>
                    Repeticion de comidas: {allowMealRepetition ? "Permitida (segun configuracion)" : "No permitida"}
                  </Text>
                  <Text style={S.recipeInfoText}>Total de platos en plan: {recipeEntries.length}</Text>
                </View>
              </View>

              <View style={S.weeklyTable}>
                <View style={S.weeklyHeader}>
                  <View style={S.w1}><Text style={S.weeklyHeadText}>Dia</Text></View>
                  <View style={S.w2}><Text style={S.weeklyHeadText}>Hora</Text></View>
                  <View style={S.w3}><Text style={S.weeklyHeadText}>Seccion</Text></View>
                  <View style={S.w4}><Text style={S.weeklyHeadText}>Plato</Text></View>
                  <View style={S.w5}><Text style={S.weeklyHeadText}>Porcion</Text></View>
                </View>
                {weeklyRecipeRows.map((row, index) => (
                  <View key={`weekly-${index}`} style={S.weeklyRow} wrap={false}>
                    <View style={S.w1}><Text style={S.weeklyCell}>{row.day}</Text></View>
                    <View style={S.w2}><Text style={S.weeklyCell}>{row.time}</Text></View>
                    <View style={S.w3}><Text style={S.weeklyCell}>{row.section}</Text></View>
                    <View style={S.w4}><Text style={S.weeklyCell}>{row.title}</Text></View>
                    <View style={S.w5}><Text style={S.weeklyCell}>{row.portion}</Text></View>
                  </View>
                ))}
              </View>

              <View style={S.repetitionTable}>
                <View style={S.repetitionHeader}>
                  <View style={S.r1}><Text style={S.weeklyHeadText}>Plato</Text></View>
                  <View style={S.r2}><Text style={S.weeklyHeadText}>Repite</Text></View>
                  <View style={S.r3}><Text style={S.weeklyHeadText}>Dias y porciones</Text></View>
                </View>
                {repetitionRows.map((row, idx) => (
                  <View key={`repeat-${idx}`} style={S.repetitionRow} wrap={false}>
                    <View style={S.r1}><Text style={S.weeklyCell}>{row.title}</Text></View>
                    <View style={S.r2}><Text style={S.weeklyCell}>{row.repetitions}x</Text></View>
                    <View style={S.r3}>
                      <Text style={S.weeklyCell}>{row.days}</Text>
                      <Text style={S.weeklyCell}>Porciones: {row.portionGuide}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {Object.keys(recipesByDay)
                .sort((a, b) => getDayOrder(a) - getDayOrder(b) || a.localeCompare(b))
                .map((day) => (
                  <View key={`day-${day}`}>
                    <Text style={S.recipeDay}>{day}</Text>
                    {recipesByDay[day].map((entry, idx) => {
                      const macros = `Kcal ${entry.calories ?? "-"} | Prot ${entry.protein ?? "-"}g | HC ${entry.carbs ?? "-"}g | Grasas ${entry.fats ?? "-"}g`;
                      return (
                        <View key={`${day}-${idx}-${entry.title}`} style={S.recipeCard} wrap={false}>
                          {entry.image ? (
                            <Image src={entry.image} style={S.recipeCardImage} />
                          ) : (
                            <View style={[S.recipeCardImage, { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }]}>
                              <Svg width={40} height={40} viewBox="0 0 24 24">
                                <Path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="#94a3b8" strokeWidth={1} fill="none" />
                              </Svg>
                            </View>
                          )}
                          <View style={S.recipeCardBody}>
                            <Text style={S.recipeTitle}>{entry.title}</Text>
                            <Text style={S.recipeMeta}>{entry.time} | {entry.section}</Text>
                            <Text style={S.recipeMeta}>Porcion sugerida: {entry.portion}</Text>
                            <Text style={S.recipeMeta}>{macros}</Text>
                            <Text style={S.recipeCookTitle}>¿Como cocinar?</Text>
                            <Text style={S.recipeDesc}>
                              {entry.description || "Preparacion sugerida: cocina con tecnica simple, porcion moderada y condimentos al gusto."}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
            </>
          )}
        </View>
      </Page>

      {showExchangePortions && (
        <Page size="A4" style={S.chapterPage} wrap>
          <View style={[S.chapterHero, { backgroundColor: "#059669" }]}>
            <Text style={S.chapterHeroOverline}>Capitulo III</Text>
            <Text style={S.chapterHeroTitle}>Porciones de intercambio</Text>
            <Text style={S.chapterHeroDesc}>
              Tabla oficial para validar equivalencias, ajustar porciones y revisar intercambios del plan.
            </Text>
          </View>
          <View style={S.chapterPageBody}>
            <View style={S.tableChunk}>
              <View style={S.tableHeader}>
                <View style={S.e1}><Text style={S.tableHeadText}>Categoria</Text></View>
                <View style={S.e2}><Text style={S.tableHeadText}>Porcion oficial</Text></View>
                <View style={S.e3}><Text style={S.tableHeadText}>Notas</Text></View>
              </View>
              {EXCHANGE_PORTION_GUIDE.length > 0 ? (
                EXCHANGE_PORTION_GUIDE.map((row, index) => (
                  <View key={`exchange-${index}`} style={S.exchangeRow} wrap={false}>
                    <View style={S.e1}><Text style={S.exchangeCell}>{row.category}</Text></View>
                    <View style={S.e2}><Text style={S.exchangeCell}>{row.portion}</Text></View>
                    <View style={S.e3}><Text style={S.exchangeNote}>{row.notes || "Verificar referencia oficial"}</Text></View>
                  </View>
                ))
              ) : (
                <View style={S.tableRow}>
                  <View style={S.c1}><Text style={S.tableCellPrimary}>Sin datos</Text></View>
                  <View style={S.c2}><Text style={S.tableCellSecondary}>Agrega el JSON oficial de porciones.</Text></View>
                  <View style={S.c3}><Text style={S.tableCellSecondary}>Pendiente</Text></View>
                </View>
              )}
            </View>
          </View>
        </Page>
      )}

      <Page size="A4" style={S.chapterPage} wrap>
        <View style={[S.chapterHero, { backgroundColor: "#7c3aed" }]}>
          <Text style={S.chapterHeroOverline}>{showExchangePortions ? "Capitulo IV" : "Capitulo III"}</Text>
          <Text style={S.chapterHeroTitle}>Recursos y recomendaciones</Text>
          <Text style={S.chapterHeroDesc}>
            Material educativo complementario para reforzar adherencia y autonomia.
          </Text>
        </View>
        <View style={S.chapterPageBody}>
          {resources.length === 0 ? (
            <Text style={S.muted}>No hay recursos agregados en este entregable.</Text>
          ) : (
            resources.map((resource, idx) => (
              <View key={`resource-${idx}`} style={S.resourceFlowBlock} wrap={false}>
                <Text style={S.resourceFlowTitle}>{resource.title}</Text>
                <Text style={S.resourceFlowText}>{resource.content}</Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
};
