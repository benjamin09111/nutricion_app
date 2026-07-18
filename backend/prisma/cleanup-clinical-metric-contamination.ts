import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESERVED_CLINICAL_METRIC_KEYS = new Set([
  'rejectedfoods',
  'alimentos_rechazados',
  'motivoconsulta',
  'motivo_de_consulta',
  'diagnosticonutricional',
  'diagnostico_nutricional',
  'pesohabitual',
  'peso_habitual',
  'evaluationdate',
  'fecha_evaluacion',
  'automaticnutritioncalculations',
  'calculos_nutricionales_automaticos',
]);

type MetricLike = {
  key?: string;
  label?: string;
  unit?: string;
  value?: string | number | null;
};

const normalizeMetricKey = (label: string = '', key?: string) => {
  const rawKey = (key || '').trim().toLowerCase();
  if (rawKey) {
    return rawKey
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
};

const isReservedClinicalMetric = (metric: MetricLike) =>
  RESERVED_CLINICAL_METRIC_KEYS.has(
    normalizeMetricKey(metric.label || '', metric.key),
  );

async function main() {
  console.log('Starting clinical metric cleanup...');

  const consultations = await prisma.consultation.findMany({
    select: { id: true, patientId: true, title: true, metrics: true },
  });

  let inspected = 0;
  let updated = 0;
  let removedEntries = 0;

  for (const consultation of consultations) {
    inspected += 1;
    const metrics = Array.isArray(consultation.metrics)
      ? (consultation.metrics as MetricLike[])
      : [];
    const filtered = metrics.filter((metric) => !isReservedClinicalMetric(metric));

    if (filtered.length === metrics.length) continue;

    removedEntries += metrics.length - filtered.length;
    updated += 1;

    await prisma.consultation.update({
      where: { id: consultation.id },
      data: { metrics: filtered as any },
    });
  }

  console.log(
    `Done. Inspected ${inspected} consultations, updated ${updated}, removed ${removedEntries} reserved clinical metric entries.`,
  );
}

main()
  .catch((error) => {
    console.error('Clinical metric cleanup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
