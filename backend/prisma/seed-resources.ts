import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultResources = [
    {
        title: "Mito: El huevo sube el colesterol",
        category: "mitos",
        content: "### ¿Realidad o Ficción?\n\nDurante años se creyó que el consumo de huevo debía limitarse por su aporte de colesterol. Sin embargo, estudios recientes demuestran que el consumo de **hasta 1 huevo al día** no tiene impacto significativo en el riesgo cardiovascular en personas sanas.\n\n**Beneficios:**\n- Proteína de alto valor biológico.\n- Contiene colina (salud cerebral).\n- Vitaminas A, D, E y complejo B.",
        isPublic: true,
        tags: ["Salud Cardiovascular", "Proteína"]
    },
    {
        title: "Checklist de Hábitos Saludables",
        category: "habitos",
        content: "### Pequeñas acciones, grandes cambios\n\n1. **Hidratación:** ¿Tomaste al menos 2 litros de agua hoy?\n2. **Movimiento:** ¿Realizaste al menos 30 minutos de actividad?\n3. **Descanso:** ¿Dormiste 7-8 horas?\n4. **Mindfulness:** ¿Comiste sin distracciones (TV/Celular)?\n5. **Verduras:** ¿Incluiste colores variados en tu plato?",
        isPublic: true,
        tags: ["Hábitos", "Bienestar"]
    },
    {
        title: "Hambre Física vs Hambre Emocional",
        category: "emocional",
        content: "### Aprende a escucharte\n\n**Hambre Física:**\n- Aparece gradualmente.\n- Se siente en el estómago.\n- Espera pacientemente.\n- Se satisface con cualquier alimento saludable.\n\n**Hambre Emocional:**\n- Aparece de repente.\n- Es un deseo por un alimento específico (dulce/frito).\n- Es urgente.\n- Genera culpa al terminar.",
        isPublic: true,
        tags: ["Psiconutrición", "Ansiedad"]
    },
    {
        title: "Guía Rápida: Lectura de Etiquetas",
        category: "consejos",
        content: "### No te dejes engañar\n\n1. **Lista de ingredientes:** Van de mayor a menor cantidad. Si el azúcar es el primero, ¡cuidado!\n2. **Sellos de advertencia:** Prefiere alimentos con menos sellos.\n3. **Tamaño de porción:** Revisa si la información es por 100g o por la porción que vas a consumir.\n4. **Azúcares añadidos:** Busca nombres como jarabe de maíz, maltodextrina o dextrosa.",
        isPublic: true,
        tags: ["Educación Alimentaria"]
    },
    {
        title: "Importancia del Entrenamiento de Fuerza",
        category: "ejercicios",
        content: "### Más que solo estética\n\nEl músculo es un órgano metabólicamente activo. Entrenar fuerza ayuda a:\n- Mejorar la sensibilidad a la insulina.\n- Aumentar la tasa metabólica basal (quemas más calorías en reposo).\n- Prevenir la sarcopenia (pérdida de músculo) con la edad.\n- Fortalecer los huesos.",
        isPublic: true,
        tags: ["Deporte", "Metabolismo"]
    }
];

async function seed() {
    console.log('🌱 Seeding default resources...');
    for (const res of defaultResources) {
        await prisma.resource.create({
            data: res
        });
    }
    console.log('✅ Default resources seeded.');
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
