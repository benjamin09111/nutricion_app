import type { FastMealPlanItem } from "./FastDeliverablePdfDocument";

export type FastDeliverableTableMode = "simple" | "options";

type StoredMeal = {
  id?: string;
  section?: string;
  time?: string;
  mealText?: string;
  portion?: string;
  optionTexts?: unknown;
  weeklyMealTexts?: Record<string, string>;
};

const WEEK_DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

export function getFastDeliverableTableMode(value: unknown): FastDeliverableTableMode {
  return value === "options" ? "options" : "simple";
}

export function normalizeFastDeliverableMeals(
  value: unknown,
  tableMode: FastDeliverableTableMode,
  planMode: unknown,
): FastMealPlanItem[] {
  if (!Array.isArray(value)) return [];

  const meals = value as StoredMeal[];
  if (tableMode === "options") {
    return meals.map((meal, index) => ({
      id: meal.id || `meal-${index}`,
      section: meal.section || "",
      time: "",
      mealText: "",
      optionTexts: Array.isArray(meal.optionTexts)
        ? meal.optionTexts.slice(0, 3).map((option) => typeof option === "string" ? option : "")
        : [],
    }));
  }

  if (planMode === "weekly") {
    return meals.flatMap((meal, mealIndex) =>
      WEEK_DAYS.map((day, dayIndex) => ({
        id: `${meal.id || mealIndex}-${dayIndex}`,
        section: `${day} - ${meal.section || "Sin categoría"}`,
        time: meal.time || "",
        mealText: meal.weeklyMealTexts?.[day] || "",
        portion: meal.portion || "",
      })),
    );
  }

  return meals.map((meal, index) => ({
    id: meal.id || `meal-${index}`,
    section: meal.section || "",
    time: meal.time || "",
    mealText: meal.mealText || "",
    portion: meal.portion || "",
  }));
}
