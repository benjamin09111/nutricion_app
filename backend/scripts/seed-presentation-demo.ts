import { AccountStatus, PrismaClient, SubscriptionPlan, UserRole } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

import * as dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const { loadEnvFile, redactDbUrl } = require('./lib/env');
const { env } = loadEnvFile('.env');

// Usar la base de datos que está usando el backend en ejecución (según flag DATABASE)
const dbUrl = env.DATABASE === 'prod' ? env.DATABASE_URL : (env.DATABASE_URL_DEV || env.DATABASE_URL);

if (!dbUrl) {
  throw new Error('No se encontró URL de base de datos en .env.');
}

console.log(`🔌 Conectando a la base de datos activa: ${redactDbUrl(dbUrl)}`);

process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

const TARGET_EMAIL = 'benjamin.morales3@mail.udp.cl';

async function main() {
  console.log(`🔍 Buscando cuenta para: ${TARGET_EMAIL}...`);

  // 1. Obtener o crear cuenta para el usuario autenticado
  let account = await prisma.account.findFirst({
    where: {
      OR: [
        { email: TARGET_EMAIL },
        { googleEmail: TARGET_EMAIL },
      ],
    },
    include: { nutritionist: true },
  });

  if (!account) {
    console.log(`⚠️ Cuenta no encontrada por búsqueda directa, creando cuenta activa con rol NUTRITIONIST...`);
    account = await prisma.account.create({
      data: {
        email: TARGET_EMAIL,
        googleEmail: TARGET_EMAIL,
        authProvider: 'google',
        role: UserRole.NUTRITIONIST,
        status: AccountStatus.ACTIVE,
        plan: SubscriptionPlan.ESTUDIANTE,
        emailVerifiedAt: new Date(),
      },
      include: { nutritionist: true },
    });
  } else {
    // Asegurar que la cuenta tenga acceso completo para la demo
    account = await prisma.account.update({
      where: { id: account.id },
      data: {
        status: AccountStatus.ACTIVE,
        plan: SubscriptionPlan.ESTUDIANTE,
        emailVerifiedAt: account.emailVerifiedAt || new Date(),
      },
      include: { nutritionist: true },
    });
  }

  // 2. Asegurar perfil de Nutricionista
  let nutritionist = account.nutritionist;
  if (!nutritionist) {
    console.log(`👤 Creando perfil de Nutricionista para la cuenta...`);
    nutritionist = await prisma.nutritionist.create({
      data: {
        accountId: account.id,
        fullName: 'Benjamín Morales',
        specialty: 'Nutrición Clínica y Deportiva',
        phone: '+56 9 7654 3210',
        headline: 'Nutricionista Clínico & Especialista en Recomposición Corporal',
        bio: 'Especialista en nutrición basada en evidencia, manejo de resistencia a la insulina y planificación deportiva personalizada con alimentos chilenos.',
        consultationMode: 'hybrid',
        location: 'Santiago, Chile',
        publicSlug: 'benjamin-morales',
        publicProfileEnabled: true,
      },
    });
  }

  console.log(`✅ Nutricionista ID: ${nutritionist.id} (${nutritionist.fullName})`);

  // 3. Crear / Upsert Paciente Detallado (Camila Paz Silva Contreras)
  const patientRUT = '18.452.931-7';
  let patient = await prisma.patient.findFirst({
    where: {
      nutritionistId: nutritionist.id,
      documentId: patientRUT,
    },
  });

  const patientPayload = {
    nutritionistId: nutritionist.id,
    fullName: 'Camila Paz Silva Contreras',
    email: 'camila.silva@ejemplo.cl',
    phone: '+56 9 8765 4321',
    documentId: patientRUT,
    birthDate: new Date('1996-05-14T00:00:00.000Z'),
    age: 29,
    gender: 'FEMALE',
    height: 165,
    weight: 64.5,
    activityLevel: 'MODERATE',
    primaryCondition: 'Resistencia a la insulina / Dislipidemia leve',
    nutritionalFocus: 'Recomposición corporal y control de resistencia a la insulina',
    fitnessGoals: 'Disminuir % grasa corporal preservando masa muscular (meta: 22% grasa)',
    dietRestrictions: ['Sin lactosa', 'Bajo en FODMAPs'],
    clinicalSummary:
      'Paciente femenina de 29 años, docente universitaria. Consulta por fatiga vespertina, somnolencia postprandial y antecedentes familiares de DM2. Exámenes recientes muestran HOMA-IR de 2.8 y triglicéridos en 165 mg/dL. Excelente adherencia al entrenamiento de fuerza (3x por semana) y disposición a ordenar sus comidas.',
    likes: 'Avena integral, arándanos, palta Hass, pechuga de pollo, filete de salmón, huevos, espinaca, café negro',
    dislikedFoods: ['Cochayuyo', 'Hígado / Pana', 'Bebidas azucaradas', 'Embutidos procesados'],
    tags: ['Resistencia a la Insulina', 'Recomposición Corporal', 'Sin Lactosa', 'Deporte 3x'],
    status: 'Active',
  };

  if (!patient) {
    console.log(`📋 Creando paciente clínico de ejemplo...`);
    patient = await prisma.patient.create({
      data: patientPayload,
    });
  } else {
    patient = await prisma.patient.update({
      where: { id: patient.id },
      data: patientPayload,
    });
  }
  console.log(`✅ Paciente listo: ${patient.fullName} (ID: ${patient.id})`);

  // 4. Crear Consultas con Progresión Antropométrica (Invariante Regla 21)
  const existingConsultations = await prisma.consultation.findMany({
    where: { patientId: patient.id },
  });

  if (existingConsultations.length === 0) {
    console.log(`📈 Insertando historial de consultas y deltas antropométricos cronológicos...`);
    // Consulta 1 (Inicial - Línea base hace 2 meses)
    await prisma.consultation.create({
      data: {
        patientId: patient.id,
        nutritionistId: nutritionist.id,
        date: new Date('2026-08-15T10:00:00.000Z'),
        createdAt: new Date('2026-08-15T10:00:00.000Z'),
        title: 'Consulta Inicial y Evaluación Antropométrica',
        description:
          'Evaluación clínica de ingreso. Anamnesis alimentaria de 24h, toma de pliegues cutáneos e impedanciometría. Prescripción de pauta 1850 kcal normoproteica (1.8 g/kg) con alimentos chilenos.',
        metrics: [
          {
            date: '2026-08-15T10:00:00.000Z',
            weight: 67.8,
            fatMassPercentage: 28.5,
            muscleMassPercentage: 31.2,
            waist: 78,
            hip: 101,
            bmi: 24.9,
            visceralFat: 4,
          },
        ],
        plansDelivered: true,
      },
    });

    // Consulta 2 (Control intermedio hace 1 mes)
    await prisma.consultation.create({
      data: {
        patientId: patient.id,
        nutritionistId: nutritionist.id,
        date: new Date('2026-09-20T10:00:00.000Z'),
        createdAt: new Date('2026-09-20T10:00:00.000Z'),
        title: 'Control N°1 — Reevaluación y Tolerancia Digestiva',
        description:
          'Excelente progreso. Remisión completa de distensión abdominal tras exclusión de lactosa. Pérdida neta de 1.8 kg de tejido adiposo y -3 cm de cintura.',
        metrics: [
          {
            date: '2026-09-20T10:00:00.000Z',
            weight: 66.0,
            fatMassPercentage: 26.8,
            muscleMassPercentage: 32.0,
            waist: 75,
            hip: 99,
            bmi: 24.2,
            visceralFat: 3,
          },
        ],
        plansDelivered: true,
      },
    });

    // Consulta 3 (Control reciente)
    await prisma.consultation.create({
      data: {
        patientId: patient.id,
        nutritionistId: nutritionist.id,
        date: new Date('2026-10-18T10:00:00.000Z'),
        createdAt: new Date('2026-10-18T10:00:00.000Z'),
        title: 'Control N°2 — Consolidación y Ajuste de Macronutrientes',
        description:
          'Perfil lipídico normalizado. Acumula -3.3 kg de grasa total con incremento en masa muscular relativa (+1.9%). Se ajustan porciones de carbohidratos complejos post-entrenamiento.',
        metrics: [
          {
            date: '2026-10-18T10:00:00.000Z',
            weight: 64.5,
            fatMassPercentage: 24.5,
            muscleMassPercentage: 33.1,
            waist: 73,
            hip: 97,
            bmi: 23.7,
            visceralFat: 3,
          },
        ],
        plansDelivered: true,
      },
    });
    console.log(`✅ 3 consultas clínicas con evolución cronológica creadas.`);
  }

  // 5. Módulo 1: Creación para [Dietas] (/dashboard/dietas)
  const dietCreationName = 'Pauta Recomposición 1800 kcal (Chile INTA)';
  let dietCreation = await prisma.creation.findFirst({
    where: {
      nutritionistId: nutritionist.id,
      name: dietCreationName,
    },
  });

  const dietContent = {
    dietName: dietCreationName,
    dietTags: ['Recomposición', 'Sin Lactosa', 'Alta Proteína', 'Chile INTA 2018'],
    groups: {
      Desayuno: [
        { producto: 'Avena tradicional', cantidad: 60, unidad: 'g', calorias: 230, proteinas: 8.5, carbohidratos: 40, lipidos: 4.2, precioPromedio: 280 },
        { producto: 'Huevos de gallina (2 un)', cantidad: 100, unidad: 'g', calorias: 145, proteinas: 12.6, carbohidratos: 0.8, lipidos: 9.8, precioPromedio: 500 },
        { producto: 'Arándanos frescos', cantidad: 80, unidad: 'g', calorias: 45, proteinas: 0.6, carbohidratos: 11.5, lipidos: 0.3, precioPromedio: 450 },
      ],
      Almuerzo: [
        { producto: 'Pechuga de pollo a la plancha', cantidad: 150, unidad: 'g', calorias: 248, proteinas: 46.5, carbohidratos: 0, lipidos: 5.4, precioPromedio: 1250 },
        { producto: 'Arroz integral cocido', cantidad: 150, unidad: 'g', calorias: 168, proteinas: 3.8, carbohidratos: 35.2, lipidos: 1.4, precioPromedio: 320 },
        { producto: 'Espinaca cruda en ensalada', cantidad: 100, unidad: 'g', calorias: 23, proteinas: 2.9, carbohidratos: 3.6, lipidos: 0.4, precioPromedio: 390 },
        { producto: 'Palta Hass en láminas', cantidad: 50, unidad: 'g', calorias: 80, proteinas: 1.0, carbohidratos: 4.3, lipidos: 7.3, precioPromedio: 480 },
        { producto: 'Aceite de oliva extra virgen', cantidad: 5, unidad: 'ml', calorias: 44, proteinas: 0, carbohidratos: 0, lipidos: 5.0, precioPromedio: 110 },
      ],
      'Once / Snack': [
        { producto: 'Yogurt proteína sin lactosa', cantidad: 150, unidad: 'g', calorias: 105, proteinas: 15.0, carbohidratos: 6.2, lipidos: 1.2, precioPromedio: 690 },
        { producto: 'Nueces chilenas picadas', cantidad: 20, unidad: 'g', calorias: 130, proteinas: 3.0, carbohidratos: 2.8, lipidos: 13.0, precioPromedio: 380 },
      ],
      Cena: [
        { producto: 'Filete de salmón chileno', cantidad: 140, unidad: 'g', calorias: 290, proteinas: 30.8, carbohidratos: 0, lipidos: 18.2, precioPromedio: 2400 },
        { producto: 'Quínoa cocida graneada', cantidad: 120, unidad: 'g', calorias: 144, proteinas: 5.3, carbohidratos: 25.6, lipidos: 2.3, precioPromedio: 420 },
        { producto: 'Mix verduras salteadas (zapallito, pimentón)', cantidad: 150, unidad: 'g', calorias: 45, proteinas: 2.5, carbohidratos: 8.0, lipidos: 0.5, precioPromedio: 550 },
      ],
    },
    metadata: {
      totalCalories: 1749,
      totalProteins: 132.5,
      totalCarbs: 168.0,
      totalFats: 69.3,
      estimatedCostDaily: 7820,
    },
  };

  if (!dietCreation) {
    dietCreation = await prisma.creation.create({
      data: {
        nutritionistId: nutritionist.id,
        name: dietCreationName,
        type: 'DIET',
        format: 'NATIVE',
        content: dietContent,
        metadata: {
          patientId: patient.id,
          patientName: patient.fullName,
          source: 'dietas',
          description: 'Plantilla de recomposición normocalórica con cuadraturas INTA 2018.',
        },
        tags: ['recomposicion', 'inta-chile', 'sin-lactosa'],
      },
    });
    console.log(`✅ Creación [Dietas] creada: ${dietCreation.name}`);
  }

  // 6. Módulo 2: Creación para [Entregable Rápido] (/dashboard/rapido)
  const fastDeliverableName = 'Entregable Express — Camila Silva (Recomposición)';
  let fastDeliverable = await prisma.creation.findFirst({
    where: {
      nutritionistId: nutritionist.id,
      name: fastDeliverableName,
    },
  });

  const fastContent = {
    title: 'Pauta Nutricional Express — Recomposición Corporal',
    deliveryDate: new Date().toISOString().slice(0, 10),
    quickHashtags: '#SaludMetabolica #Recomposicion #SinLactosa #NutrinetChile',
    quickDescription: 'Pauta clínica express orientada al control de resistencia a la insulina y recomposición.',
    planObjective: 'Déficit moderado de 300 kcal con 1.9 g de proteína por kg y alta densidad de micronutrientes.',
    showPlanObjectiveInPdf: true,
    planMode: 'single',
    tableMode: 'compact',
    optionCount: 2,
    contentMode: 'both',
    meals: [
      {
        id: 'm1',
        name: 'Desayuno Proteico',
        time: '08:00',
        description: 'Opción A: Porridge de avena (50g) cocida en agua con scoop de proteína sin lactosa + 2 huevos pochados.\nOpción B: 2 rebanadas pan integral con pasta de huevo duro y 1/4 palta Hass.',
      },
      {
        id: 'm2',
        name: 'Almuerzo Equilibrado',
        time: '13:30',
        description: 'Opción A: Pechuga a la plancha (150g) + 3/4 taza de arroz integral + ensalada verde generosa con aceite de oliva (1 cdta).\nOpción B: Filete de reineta o merluza al horno con papas cocidas al vapor (1 unidad regular) + tomate y pepino.',
      },
      {
        id: 'm3',
        name: 'Once / Colación Media Tarde',
        time: '17:30',
        description: 'Opción A: Yogurt batido proteico sin lactosa + 4 mitades de nueces + té verde o café sin azúcar.\nOpción B: 1 manzana verde en gajos con 1 cucharada sopera de mantequilla de maní 100% natural.',
      },
      {
        id: 'm4',
        name: 'Cena Liviana y Reparadora',
        time: '20:30',
        description: 'Opción A: Filete de salmón a la plancha (140g) con 1/2 taza de quínoa y salteado de verduras (champiñones y zapallito).\nOpción B: Tortilla de 3 claras y 1 huevo con espinacas y zanahoria rallada + ensalada mixta.',
      },
    ],
    avoidFoods: [
      'Lácteos enteros o quesos amarillos con alto contenido graso',
      'Bebidas gaseosas, jugos envasados y alcohol',
      'Frituras, embutidos y alimentos ultraprocesados',
      'Azúcares simples y harinas blancas de rápida absorción',
    ],
    includeMeals: true,
    includeAvoidFoods: true,
    includePortionGuide: true,
    portionGuideRows: [
      { category: 'Cereales y Tubérculos', portion: '3 porciones al día (ej: 1/2 taza arroz o quínoa cocida, 40g avena)' },
      { category: 'Proteínas Magras', portion: '4 porciones al día (ej: 150g pechuga pollo, 140g pescado, 2 huevos)' },
      { category: 'Verduras Libres', portion: 'Consumo libre abundante (mínimo 2 platos hondos al día)' },
      { category: 'Aceites y Grasas', portion: '2 porciones al día (ej: 1/4 palta Hass, 1 cdta aceite oliva, 20g nueces)' },
    ],
    resources: [],
    selectedResourceKeys: [],
    includeResources: false,
    supplementNote: 'Creatina monohidratada 5g diarios post-entrenamiento (opcional para fuerza).',
  };

  if (!fastDeliverable) {
    fastDeliverable = await prisma.creation.create({
      data: {
        nutritionistId: nutritionist.id,
        name: fastDeliverableName,
        type: 'FAST_DELIVERABLE',
        format: 'NATIVE',
        content: fastContent,
        metadata: {
          patientId: patient.id,
          patientName: patient.fullName,
          mealCount: 4,
          avoidFoodsCount: 4,
          source: 'rapido',
        },
        tags: ['rapido', 'express', 'recomposicion'],
      },
    });
    console.log(`✅ Creación [Entregable Rápido] creada: ${fastDeliverable.name}`);
  }

  // 7. Módulo 3: Creación para [Recetas] (/dashboard/rapido/recetas)
  const recetarioName = 'Recetario Fitness Chileno — Alta Proteína';
  let recetario = await prisma.creation.findFirst({
    where: {
      nutritionistId: nutritionist.id,
      name: recetarioName,
    },
  });

  const dishesList = [
    {
      id: 'd1',
      title: 'Omelette Campestre con Espinaca y Palta Hass',
      mealSection: 'Desayuno',
      description: 'Desayuno saciador rico en colina, proteínas de alto valor biológico y grasas monoinsaturadas.',
      preparation:
        '1. Batir 2 huevos de gallina enteros con sal y pimienta.\n2. Calentar sartén antiadherente con 1 cdta de aceite de oliva.\n3. Saltear brevemente 1 taza de espinaca lavada.\n4. Verter los huevos, doblar en media luna y servir con 1/4 palta Hass en láminas.',
      ingredients: [
        { id: 'i1', name: 'Huevos de gallina', quantity: '2 unidades' },
        { id: 'i2', name: 'Espinaca fresca', quantity: '50 g' },
        { id: 'i3', name: 'Palta Hass', quantity: '50 g' },
        { id: 'i4', name: 'Aceite de oliva extra virgen', quantity: '5 ml' },
      ],
      calories: 310,
      proteins: 16.5,
      carbs: 6.8,
      fats: 24.2,
    },
    {
      id: 'd2',
      title: 'Bowl de Salmón Chileno con Quínoa y Verduras Salteadas',
      mealSection: 'Almuerzo',
      description: 'Almuerzo completo con ácidos grasos Omega-3 (EPA/DHA) y carbohidratos complejos de bajo índice glicémico.',
      preparation:
        '1. Sellar 150g de filete de salmón en sartén bien caliente durante 3-4 minutos por lado.\n2. En un bowl armar una base con 3/4 taza de quínoa cocida.\n3. Saltear champiñones y zapallito italiano en cubos con gotas de aceite.\n4. Montar el salmón sobre la quínoa y terminar con unas gotas de limón sutil.',
      ingredients: [
        { id: 'i5', name: 'Filete de salmón', quantity: '150 g' },
        { id: 'i6', name: 'Quínoa cocida', quantity: '120 g' },
        { id: 'i7', name: 'Champiñones frescos', quantity: '80 g' },
        { id: 'i8', name: 'Zapallito italiano', quantity: '100 g' },
      ],
      calories: 485,
      proteins: 36.5,
      carbs: 31.0,
      fats: 21.0,
    },
    {
      id: 'd3',
      title: 'Pancakes Proteicos de Avena y Plátano',
      mealSection: 'Once',
      description: 'Preparación dulce sin azúcar añadido, ideal previa o posterior a sesión de entrenamiento.',
      preparation:
        '1. Licuar 50g de avena tradicional, 1 plátano maduro pequeño, 1 huevo y 30ml de agua o bebida vegetal.\n2. Calentar sartén antiadherente a fuego medio.\n3. Verter la mezcla en discos pequeños y voltear cuando aparezcan burbujas.\n4. Servir con canela en polvo y arándanos frescos.',
      ingredients: [
        { id: 'i9', name: 'Avena tradicional', quantity: '50 g' },
        { id: 'i10', name: 'Plátano maduro', quantity: '1 unidad chica (80 g)' },
        { id: 'i11', name: 'Huevo de gallina', quantity: '1 unidad' },
        { id: 'i12', name: 'Canela en polvo', quantity: 'A gusto' },
      ],
      calories: 320,
      proteins: 13.0,
      carbs: 52.0,
      fats: 7.5,
    },
  ];

  const recetarioContent = {
    title: recetarioName,
    dietName: 'Pauta Fitness Chile INTA',
    quickDescription: 'Recetas rápidas de alta proteína preparadas con ingredientes del mercado chileno.',
    planObjective: 'Mantener saciedad, adherencia y practicidad para el paciente.',
    dishes: dishesList,
  };

  if (!recetario) {
    recetario = await prisma.creation.create({
      data: {
        nutritionistId: nutritionist.id,
        name: recetarioName,
        type: 'RECETARIO',
        format: 'NATIVE',
        content: recetarioContent,
        metadata: {
          patientId: patient.id,
          patientName: patient.fullName,
          dishCount: 3,
          source: 'rapido',
        },
        tags: ['rapido', 'recetario', 'alta-proteina'],
      },
    });
    console.log(`✅ Creación [Recetas] creada: ${recetario.name}`);
  }

  // Insertar también en la biblioteca de recetas individuales del nutricionista
  for (const dish of dishesList) {
    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        nutritionistId: nutritionist.id,
        name: dish.title,
      },
    });

    if (!existingRecipe) {
      await prisma.recipe.create({
        data: {
          nutritionistId: nutritionist.id,
          name: dish.title,
          description: dish.description,
          preparation: dish.preparation,
          calories: dish.calories,
          proteins: dish.proteins,
          carbs: dish.carbs,
          lipids: dish.fats,
          portions: 1,
          portionSize: 250,
          isPublic: false,
          metadata: {
            mealSection: dish.mealSection,
            ingredients: dish.ingredients,
          },
        },
      });
    }
  }
  console.log(`✅ Platos individuales sincronizados en la Biblioteca de Recetas.`);

  // 8. Módulo 4: Creación y Proyecto para [Entregables personalizados] (/dashboard/dieta)
  const deliverableName = 'Entregable Personalizado — Camila Silva (Pauta Integral)';
  let deliverableCreation = await prisma.creation.findFirst({
    where: {
      nutritionistId: nutritionist.id,
      name: deliverableName,
    },
  });

  if (!deliverableCreation) {
    deliverableCreation = await prisma.creation.create({
      data: {
        nutritionistId: nutritionist.id,
        name: deliverableName,
        type: 'DELIVERABLE',
        format: 'NATIVE',
        content: {
          patientName: patient.fullName,
          patientRUT: patient.documentId,
          patientAge: patient.age,
          patientWeight: patient.weight,
          patientHeight: patient.height,
          patientBMI: 23.7,
          targetCalories: 1800,
          proteinGrams: 125,
          carbGrams: 175,
          fatGrams: 65,
          clinicalSummary: patient.clinicalSummary,
          waterLiters: 2.3,
          stepsCount: 8500,
          meals: [
            { section: 'Desayuno (08:00)', name: 'Omelette Campestre con Avena y Berries', details: '2 huevos + 50g avena + 1/4 palta Hass' },
            { section: 'Almuerzo (13:30)', name: 'Pechuga a la Plancha con Quínoa y Ensalada Mixta', details: '150g pechuga + 3/4 taza quínoa + hojas verdes' },
            { section: 'Once (17:30)', name: 'Yogurt Proteico sin Lactosa con Nueces', details: '1 pote yogurt protein + 20g nueces' },
            { section: 'Cena (20:30)', name: 'Salmón Chileno con Verduras Asadas', details: '140g salmón + zapallito + champiñones' },
          ],
          recommendations: [
            'Beber al menos 2.3 litros de agua fresca durante el día, distribuidos fuera de las comidas.',
            'Priorizar masticación lenta y evitar pantallas durante el almuerzo y la cena.',
            'Mantener el entrenamiento de fuerza al menos 3 días por semana en días no consecutivos.',
          ],
        },
        metadata: {
          patientId: patient.id,
          patientName: patient.fullName,
          source: 'dieta',
        },
        tags: ['personalizado', 'pauta-integral', 'recomposicion'],
      },
    });
    console.log(`✅ Creación [Entregables personalizados] creada: ${deliverableCreation.name}`);
  }

  // Proyecto clínico activo vinculando al paciente y sus creaciones
  const projectName = 'Plan Nutricional Integral — Camila Silva';
  let project = await prisma.project.findFirst({
    where: {
      nutritionistId: nutritionist.id,
      patientId: patient.id,
    },
  });

  const projectId = '7f8c9b1a-2e3d-4c5b-6a7b-8c9d0e1f2a3b';
  await prisma.$executeRawUnsafe(
    `INSERT INTO "projects" (
      "id", "nutritionist_id", "patient_id", "name", "description", "mode", "status",
      "active_diet_creation_id", "active_recipe_creation_id", "active_deliverable_creation_id",
      "metadata", "createdAt", "updatedAt", "created_at", "updated_at"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW(), NOW(), NOW(), NOW()
    ) ON CONFLICT ("id") DO NOTHING`,
    projectId,
    nutritionist.id,
    patient.id,
    projectName,
    'Plan clínico de recomposición y manejo de resistencia a la insulina.',
    'CLINICAL',
    'ACTIVE',
    dietCreation?.id || null,
    recetario?.id || null,
    deliverableCreation?.id || null,
    JSON.stringify({
      currentWeight: 64.5,
      targetWeight: 62.0,
      tdee: 1850,
      bmi: 23.7,
    }),
  );
  console.log(`✅ Proyecto clínico vinculado creado: ${projectName}`);

  console.log(`\n🎉 ¡DATOS DE EJEMPLO INYECTADOS EXITOSAMENTE! 🎉`);
  console.log(`--------------------------------------------------`);
  console.log(`👤 Nutricionista: ${nutritionist.fullName} (${account.email})`);
  console.log(`📋 Paciente: ${patient.fullName} (${patient.documentId})`);
  console.log(`📈 3 Consultas con gráficos y evolución antropométrica`);
  console.log(`🥗 Módulo Dietas: ${dietCreation.name}`);
  console.log(`⚡ Módulo Rápido: ${fastDeliverable.name}`);
  console.log(`🍳 Módulo Recetas: ${recetario.name}`);
  console.log(`📑 Módulo Entregables / Proyecto: ${projectName}`);
  console.log(`--------------------------------------------------`);
}

main()
  .catch((err) => {
    console.error('❌ Error al inyectar datos:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
