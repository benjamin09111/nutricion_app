"use client";

import type { DietPdfData } from "./DietPdfDocument";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = React.createElement(DietPdfDocument, { data }) as any;
    const blob = await pdf(doc).toBlob();

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
