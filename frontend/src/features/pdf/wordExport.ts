import type { DietPdfData, DietFood } from "./DietPdfDocument";

/**
 * Generates and downloads a Diet Word (.docx) document on the client side.
 * Uses dynamic import to avoid SSR issues.
 */
export async function downloadDietDocx(data: DietPdfData): Promise<void> {
    const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        Table,
        TableRow,
        TableCell,
        HeadingLevel,
        AlignmentType,
        WidthType,
        BorderStyle,
        ShadingType,
    } = await import("docx");

    const dateStr = new Date().toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    // Group foods by category
    const grouped = data.foods.reduce(
        (acc, food) => {
            const g = food.grupo || "Varios";
            if (!acc[g]) acc[g] = [];
            acc[g].push(food);
            return acc;
        },
        {} as Record<string, DietFood[]>,
    );

    // -- Helper: create a styled table for a food group --
    const createFoodTable = (foods: DietFood[]) => {
        const headerRow = new TableRow({
            tableHeader: true,
            children: ["Alimento", "Unidad", "Calorías", "Proteínas", "Carbos", "Grasas"].map(
                (text) =>
                    new TableCell({
                        shading: { type: ShadingType.SOLID, color: "10b981" },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text,
                                        bold: true,
                                        color: "FFFFFF",
                                        size: 18,
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                        ],
                    }),
            ),
        });

        const dataRows = foods.map((food, idx) =>
            new TableRow({
                children: [
                    new TableCell({
                        shading: idx % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: "F8FAFC" },
                        children: [new Paragraph({ children: [new TextRun({ text: food.producto, bold: true, size: 18 })] })],
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: food.unidad ?? "—", size: 18 })] })],
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: food.calorias ? `${Math.round(food.calorias)}` : "—", size: 18 })] })],
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: food.proteinas ? `${food.proteinas.toFixed(1)}g` : "—", size: 18 })] })],
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: food.carbohidratos ? `${food.carbohidratos.toFixed(1)}g` : "—", size: 18 })] })],
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: food.lipidos ? `${food.lipidos.toFixed(1)}g` : "—", size: 18 })] })],
                    }),
                ],
            }),
        );

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            },
            rows: [headerRow, ...dataRows],
        });
    };

    // -- Build document sections --
    const children: any[] = [
        // Title
        new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: data.dietName || "Plan Alimentario", bold: true, size: 52, color: "059669" })],
        }),
        new Paragraph({
            children: [new TextRun({ text: "Plan Nutricional · Dieta Base", color: "64748B", size: 22, italics: true })],
        }),
        new Paragraph({ text: "" }),

        // Metadata row
        new Paragraph({
            children: [
                new TextRun({ text: "Fecha: ", bold: true, size: 20 }),
                new TextRun({ text: dateStr, size: 20 }),
                ...(data.patientName
                    ? [
                        new TextRun({ text: "     Paciente: ", bold: true, size: 20 }),
                        new TextRun({ text: data.patientName, size: 20 }),
                    ]
                    : []),
                new TextRun({ text: "     Total alimentos: ", bold: true, size: 20 }),
                new TextRun({ text: `${data.foods.length}`, size: 20 }),
            ],
        }),
        new Paragraph({ text: "" }),

        // Tags
        ...(data.dietTags && data.dietTags.length > 0
            ? [
                new Paragraph({
                    children: [
                        new TextRun({ text: "Etiquetas: ", bold: true, size: 20 }),
                        new TextRun({ text: data.dietTags.join(", "), size: 20, color: "059669" }),
                    ],
                }),
            ]
            : []),

        // Restrictions
        ...(data.activeConstraints && data.activeConstraints.length > 0
            ? [
                new Paragraph({
                    children: [
                        new TextRun({ text: "Restricciones clínicas: ", bold: true, size: 20 }),
                        new TextRun({ text: data.activeConstraints.join(", "), size: 20, color: "E11D48" }),
                    ],
                }),
            ]
            : []),

        new Paragraph({ text: "" }),
        new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" } },
            children: [],
        }),
        new Paragraph({ text: "" }),
    ];

    // Add food tables per group
    for (const [groupName, foods] of Object.entries(grouped)) {
        children.push(
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [new TextRun({ text: groupName, bold: true, size: 28, color: "0F172A" })],
                spacing: { before: 300 },
            }),
            new Paragraph({
                children: [new TextRun({ text: `${foods.length} alimentos`, size: 18, color: "64748B" })],
                spacing: { after: 120 },
            }),
            createFoodTable(foods),
            new Paragraph({ text: "" }),
        );
    }

    // Footer note
    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: "* Valores nutricionales por 100g de alimento. ", size: 16, italics: true, color: "94A3B8" }),
                new TextRun({ text: "Generado por NutriNet.", size: 16, bold: true, color: "10B981" }),
            ],
            spacing: { before: 400 },
        }),
    );

    const doc = new Document({
        creator: "NutriNet",
        title: data.dietName || "Dieta Base",
        description: "Plan Alimentario generado por NutriNet",
        sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = data.dietName.replace(/\s+/g, "_").replace(/[^\w-]/g, "") || "dieta_base";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}_NutriNet.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
