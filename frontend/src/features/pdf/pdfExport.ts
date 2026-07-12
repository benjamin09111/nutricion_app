"use client";

import type { DietPdfData } from "./DietPdfDocument";
import { membershipService } from "@/features/memberships/services/membership.service";

/**
 * Generates and downloads a Diet PDF on the client side.
 * Uses dynamic import to avoid SSR issues with @react-pdf/renderer.
 */
export async function downloadDietPdf(data: DietPdfData): Promise<void> {
    const [{ pdf }, { DietPdfDocument }, React] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./DietPdfDocument"),
        import("react"),
    ]);

    const doc = React.createElement(DietPdfDocument, { data }) as any;
    const blob = await pdf(doc).toBlob();
    await membershipService.consumeQuota("pdf.monthly.limit");

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
