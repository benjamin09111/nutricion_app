import * as dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const { loadEnvFile, redactDbUrl } = require('./lib/env');
const { env } = loadEnvFile('.env');
const { PrismaClient } = require('@prisma/client');

const dbUrl = env.DATABASE === 'prod' ? env.DATABASE_URL : (env.DATABASE_URL_DEV || env.DATABASE_URL);
if (!dbUrl) {
  throw new Error('No se encontró URL de base de datos en .env.');
}

console.log(`🔌 Conectando a la base de datos: ${redactDbUrl(dbUrl)}`);

process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

const PATIENT_RUT = '18.452.931-7';

async function main() {
  console.log(`🔍 Buscando paciente con RUT: ${PATIENT_RUT}...`);

  const patient = await prisma.patient.findFirst({
    where: { documentId: PATIENT_RUT },
    include: { clinicalRecord: true },
  });

  if (!patient) {
    throw new Error(`Paciente con RUT ${PATIENT_RUT} no encontrado.`);
  }

  console.log(`👤 Actualizando expediente completo para: ${patient.fullName}...`);

  // 1. Actualizar campos del modelo Patient para cálculo de GET, actividad y alertas
  const customVariables = [
    {
      key: 'motivoConsulta',
      label: 'Motivo de consulta',
      value: 'Recomposición corporal, aumento de niveles de energía y manejo nutricional preventivo de resistencia a la insulina',
    },
    {
      key: 'diagnosticoNutricional',
      label: 'Diagnóstico nutricional',
      value: 'Paciente femenina de 30 años con estado nutricional normopeso (IMC 23.7 kg/m²), perímetro de cintura en límite de riesgo cardiometabólico y resistencia a la insulina compensada (HOMA-IR 2.8). Indicación de pauta normocalórica/déficit leve normoproteica (1.9 g/kg) con alimentos de bajo índice glicémico y exclusión de lactosa.',
    },
    {
      key: 'pesoHabitual',
      label: 'Peso habitual',
      value: '67',
      unit: 'kg',
    },
    {
      key: 'rejectedFoods',
      label: 'Alimentos rechazados',
      value: 'Cochayuyo, Hígado / Pana, Bebidas azucaradas, Embutidos procesados',
    },
  ];

  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      gender: 'Femenino', // Requerido en español para calculateGET y calculateBMI
      activityLevel: 'moderado', // Requerido para ACTIVITY_LEVEL_OPTIONS ("moderado" -> "Moderado")
      nutritionalFocus: 'Mejorar composición corporal', // Requerido para NUTRITIONAL_FOCUS_OPTIONS
      fitnessGoals: 'Pérdida de grasa', // Requerido para FITNESS_GOALS_OPTIONS
      primaryCondition: 'Resistencia a la insulina',
      customVariables: customVariables,
      clinicalSummary:
        'Paciente de 30 años, docente universitaria. Consulta por fatiga vespertina y antecedentes de DM2. Exámenes recientes muestran HOMA-IR de 2.8. Excelente adherencia al entrenamiento de fuerza (3x semana) y alta motivación.',
    },
  });

  console.log(`✅ Modelo Patient actualizado con género 'Femenino', actividad 'moderado' y customVariables.`);

  // 2. Crear o actualizar ClinicalRecord completo
  const clinicalRecordPayload = {
    vitalHistory: {
      occupation: 'Docente Universitaria',
      workSchedule: 'Jornada diurna completa (08:30 a 17:30 hrs)',
      medications: 'Ninguno actualmente',
      supplementsOrDrugs: 'Creatina monohidratada 5g/día, Vitamina D3 2000 UI',
      diagnosedPathologies: 'Resistencia a la insulina compensada, antecedentes familiares de Diabetes Mellitus tipo 2',
      familyHistory: 'Madre con DM2, padre con hipertensión arterial controlada',
      sleepQuality: 'Buena (7 a 8 horas continuas)',
      perceivedStress: 'Moderado por responsabilidades laborales y académicas',
      weeklyExercise: '3 a 4 veces por semana (entrenamiento de sobrecarga y caminatas)',
      motivoConsulta: 'Recomposición corporal, aumento de niveles de energía y manejo nutricional preventivo de resistencia a la insulina',
      manualCaloriesAdjustment: '0',
      pesoObjetivoProf: '62.0',
    },
    gynecoObstetric: {
      isPregnant: false,
      pregnancyWeeks: '',
      pregestationalWeight: '',
      pregnancyType: '',
    },
    nutritionalAnamnesis: {
      eatingPreferences: 'Preferencia por carbohidratos complejos (avena, quínoa, arroz integral), frutos rojos y carnes magras.',
      rejectedFoods: 'Cochayuyo, Hígado / Pana, Bebidas azucaradas, Embutidos procesados',
      clinicalObservations: 'Excelente disposición al cambio de hábitos y buena tolerancia gástrica tras excluir lactosa.',
      gestationalSymptoms: [],
      gestationalSupplementation: [],
      diagnosticoNutricional: 'Paciente femenina de 30 años con estado nutricional normopeso (IMC 23.7 kg/m²), perímetro de cintura en límite de riesgo cardiometabólico y resistencia a la insulina compensada (HOMA-IR 2.8). Indicación de pauta normocalórica/déficit leve normoproteica (1.9 g/kg) con alimentos de bajo índice glicémico y exclusión de lactosa.',
    },
    anthropometry: {
      skinfolds: {
        tricipital: '14.5',
        bicipital: '8.0',
        subescapular: '13.0',
        suprailiac: '12.5',
      },
      circumferences: {
        kneeHeight: '51',
        calfCircumference: '35',
        armCircumference: '27',
        waistCircumference: '73',
        hipCircumference: '97',
      },
      pesoHabitual: '67',
    },
    dataSources: {
      vitalHistory: 'nutritionist',
      nutritionalAnamnesis: 'nutritionist',
      anthropometry: 'calculated',
    },
  };

  await prisma.clinicalRecord.upsert({
    where: { patientId: patient.id },
    create: {
      patientId: patient.id,
      ...clinicalRecordPayload,
    },
    update: clinicalRecordPayload,
  });

  console.log(`✅ Ficha Clínica (ClinicalRecord) actualizada con anamnesis, antecedentes y antropometría completa.`);
  console.log(`🎉 ¡TODO LISTO! Actualiza la pestaña en tu navegador para ver la ficha 100% completa.`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
