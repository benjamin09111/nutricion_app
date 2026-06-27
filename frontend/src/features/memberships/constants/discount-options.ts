export interface DiscountOption {
  value: "NUTRI" | "BETA";
  label: string;
  shortLabel: string;
  discountPercentage: number;
}

export const DISCOUNT_OPTIONS: DiscountOption[] = [
  {
    value: "NUTRI",
    label: "NUTRI (50% descuento)",
    shortLabel: "NUTRI (50%)",
    discountPercentage: 50,
  },
  {
    value: "BETA",
    label: "BETA (90% descuento)",
    shortLabel: "BETA (90%)",
    discountPercentage: 90,
  },
];
