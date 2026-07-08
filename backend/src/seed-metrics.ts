import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultMetrics = [
    { name: 'Peso', unit: 'kg', key: 'weight', icon: 'Weight', color: '#3b82f6' },
    { name: 'Altura', unit: 'cm', key: 'height', icon: 'Ruler', color: '#6366f1' },
    { name: 'Grasa Corporal', unit: '%', key: 'body_fat', icon: 'Activity', color: '#10b981' },
    { name: 'Masa Muscular', unit: 'kg', key: 'muscle_mass', icon: 'Dumbbell', color: '#f59e0b' },
    { name: 'Grasa Visceral', unit: 'lvl', key: 'visceral_fat', icon: 'Zap', color: '#ef4444' },
    { name: 'Cintura', unit: 'cm', key: 'waist', icon: 'Target', color: '#ec4899' },
    { name: 'Cadera', unit: 'cm', key: 'hip', icon: 'Target', color: '#8b5cf6' },
    { name: 'Circ. Braquial', unit: 'cm', key: 'arm_circumference', icon: 'Ruler', color: '#64748b' },
    { name: 'Circ. Pantorrilla', unit: 'cm', key: 'calf_circumference', icon: 'Ruler', color: '#64748b' },
    { name: 'Altura Rodilla', unit: 'cm', key: 'knee_height', icon: 'Ruler', color: '#64748b' },
    { name: 'Pliegue Tricipital', unit: 'mm', key: 'triceps_skinfold', icon: 'Ruler', color: '#94a3b8' },
    { name: 'Pliegue Bicipital', unit: 'mm', key: 'biceps_skinfold', icon: 'Ruler', color: '#94a3b8' },
    { name: 'Pliegue Subescapular', unit: 'mm', key: 'subscapular_skinfold', icon: 'Ruler', color: '#94a3b8' },
    { name: 'Pliegue Suprailiaco', unit: 'mm', key: 'suprailiac_skinfold', icon: 'Ruler', color: '#94a3b8' },
    { name: 'Presión Sistólica', unit: 'mmHg', key: 'blood_pressure_systolic', icon: 'Heart', color: '#ef4444' },
    { name: 'Presión Diastólica', unit: 'mmHg', key: 'blood_pressure_diastolic', icon: 'Heart', color: '#f87171' },
    { name: 'Frecuencia Cardíaca', unit: 'bpm', key: 'heart_rate', icon: 'Heart', color: '#ef4444' },
    { name: 'Glicemia', unit: 'mg/dL', key: 'glucose', icon: 'Activity', color: '#f59e0b' },
    { name: 'Colesterol Total', unit: 'mg/dL', key: 'total_cholesterol', icon: 'Activity', color: '#f59e0b' },
    { name: 'Colesterol HDL', unit: 'mg/dL', key: 'hdl_cholesterol', icon: 'Activity', color: '#10b981' },
    { name: 'Colesterol LDL', unit: 'mg/dL', key: 'ldl_cholesterol', icon: 'Activity', color: '#ef4444' },
    { name: 'Triglicéridos', unit: 'mg/dL', key: 'triglycerides', icon: 'Activity', color: '#f97316' },
    { name: 'Hemoglobina', unit: 'g/dL', key: 'hemoglobin', icon: 'Activity', color: '#ef4444' },
    { name: 'Ferritina', unit: 'ng/mL', key: 'ferritin', icon: 'Activity', color: '#64748b' },
    { name: 'Vitamina D', unit: 'ng/mL', key: 'vitamin_d', icon: 'Activity', color: '#f59e0b' },
    { name: 'Vitamina B12', unit: 'pg/mL', key: 'vitamin_b12', icon: 'Activity', color: '#f59e0b' },
    { name: 'Índice Cintura/Cadera', unit: '', key: 'waist_hip_ratio', icon: 'Target', color: '#ec4899' },
    { name: 'Agua Corporal', unit: '%', key: 'body_water', icon: 'Activity', color: '#0ea5e9' },
    { name: 'Masa Ósea', unit: 'kg', key: 'bone_mass', icon: 'Activity', color: '#94a3b8' },
  ];

  console.log('Seeding default metrics...');

  for (const m of defaultMetrics) {
    await prisma.metricDefinition.upsert({
      where: { key: m.key },
      update: { name: m.name, unit: m.unit, icon: m.icon, color: m.color },
      create: {
        ...m,
        nutritionistId: null,
      },
    });
  }

  console.log(`${defaultMetrics.length} default metrics seeded successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
