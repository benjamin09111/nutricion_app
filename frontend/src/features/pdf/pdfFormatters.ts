export function splitIntoColumns<T>(items: T[], columns = 2): T[][] {
  if (columns <= 1 || items.length <= 1) {
    return [items, []];
  }

  const midpoint = Math.ceil(items.length / columns);
  return [items.slice(0, midpoint), items.slice(midpoint)];
}

export function formatNutritionBasisLabel(unit?: string): string {
  const normalized = unit?.trim().toLowerCase();

  if (!normalized) return "100 g";
  if (normalized.includes("ml") || normalized.includes("l")) return "100 ml";

  return "100 g";
}

export function formatIngredientQuantityLabel(
  quantity?: string,
  amount?: number | string,
  unit?: string,
): string {
  const trimmedQuantity = quantity?.trim();
  const trimmedUnit = unit?.trim();

  if (trimmedQuantity) {
    if (!trimmedUnit) return trimmedQuantity;

    const normalizedQuantity = trimmedQuantity.toLowerCase();
    const normalizedUnit = trimmedUnit.toLowerCase();

    if (normalizedQuantity.includes(normalizedUnit)) {
      return trimmedQuantity;
    }

    return `${trimmedQuantity} ${trimmedUnit}`;
  }

  if (amount !== undefined && amount !== null && `${amount}`.trim().length > 0) {
    return trimmedUnit ? `${amount} ${trimmedUnit}` : `${amount}`;
  }

  return trimmedUnit || "";
}
