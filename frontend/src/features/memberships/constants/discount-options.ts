export type DiscountCodeTypeValue = "NUTRI" | "BETA" | "PROMO_30" | "PROMO_15";

export interface DiscountOption {
  value: DiscountCodeTypeValue;
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
  {
    value: "PROMO_30",
    label: "PROMO_30 (30% descuento)",
    shortLabel: "PROMO_30 (30%)",
    discountPercentage: 30,
  },
  {
    value: "PROMO_15",
    label: "PROMO_15 (15% descuento)",
    shortLabel: "PROMO_15 (15%)",
    discountPercentage: 15,
  },
];
