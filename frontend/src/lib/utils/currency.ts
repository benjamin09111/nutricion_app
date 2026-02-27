/**
 * Utility to format currency in CLP with custom rounding rules.
 * @param value Number to format
 * @returns Formatted string e.g. $13.990
 */
export const formatCLP = (value: number): string => {
  // Round to nearest integer as CLP doesn't use decimals
  const rounded = Math.round(value);
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(rounded);
};
