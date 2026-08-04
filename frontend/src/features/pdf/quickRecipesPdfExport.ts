"use client";

import type { QuickRecipesPdfData } from "./QuickRecipesPdfDocument";
import { membershipService } from "@/features/memberships/services/membership.service";
import { getPdfQuotaKey } from "./pdfQuota";

/**
 * Generates and triggers a download of the Quick Recipes PDF.
 * Uses dynamic imports to avoid SSR issues with @react-pdf/renderer.
 */
export async function downloadQuickRecipesPdf(
  data: QuickRecipesPdfData,
  countQuota = true,
  quotaKey?: string,
): Promise<void> {
  const [{ pdf }, { QuickRecipesPdfDocument }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./QuickRecipesPdfDocument"),
    import("react"),
  ]);

  const doc = React.createElement(QuickRecipesPdfDocument, { data });
  const blob = await pdf(doc as any).toBlob();
  if (countQuota) {
    await membershipService.consumeQuota("pdf.exports.total.limit", 1, getPdfQuotaKey("quick-recipes", data, quotaKey));
  }

  const safeName =
    (data.title || "recetas_rapidas")
      .replace(/\s+/g, "_")
      .replace(/[^\w-]/g, "") || "recetas_rapidas";

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}_NutriNet.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
