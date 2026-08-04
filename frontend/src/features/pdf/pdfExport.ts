"use client";

import type { DietPdfData } from "./DietPdfDocument";
import { membershipService } from "@/features/memberships/services/membership.service";
import { getPdfQuotaKey } from "./pdfQuota";

/**
 * Generates and downloads a Diet PDF on the client side.
 * Uses dynamic import to avoid SSR issues with @react-pdf/renderer.
 */
export async function downloadDietPdf(data: DietPdfData, countQuota = true, quotaKey?: string): Promise<void> {
    const [{ pdf }, { DietPdfDocument }, React] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./DietPdfDocument"),
        import("react"),
    ]);

    const doc = React.createElement(DietPdfDocument, { data }) as any;
    const blob = await pdf(doc).toBlob();
    if (countQuota) {
      await membershipService.consumeQuota("pdf.exports.total.limit", 1, getPdfQuotaKey("diet", data, quotaKey));
    }

    const safeName = data.dietName.replace(/\s+/g, "_").replace(/[^\w-]/g, "") || "dieta_base";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}_NutriNet.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
