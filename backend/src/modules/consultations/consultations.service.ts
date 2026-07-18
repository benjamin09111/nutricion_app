import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

import { CacheService } from '../../common/services/cache.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PatientsService } from '../patients/patients.service';

type ConsultationMetric = {
  key?: string;
  label: string;
  unit?: string;
  value?: string | number | null;
};

type PatientCustomVariable = {
  key: string;
  label: string;
  unit?: string;
  value?: string | number | null;
};

/** Título especial que identifica consultas de métricas independientes */
export const INDEPENDENT_METRICS_TITLE = 'Registro de Métricas Independiente';

const INTERNAL_VARIABLE_KEYS = new Set(['automaticnutritioncalculations']);

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

const isReservedClinicalMetric = (metric: { label: string; key?: string }) =>
  RESERVED_CLINICAL_METRIC_KEYS.has(
    normalizeMetricKey(metric.label, metric.key),
  );

const consultationSelect = {
  id: true,
  patientId: true,
  nutritionistId: true,
  date: true,
  title: true,
  description: true,
  metrics: true,
  plansDelivered: true,
  updatedAt: true,
  patient: {
    select: {
      fullName: true,
    },
  },
} as const;

@Injectable()
export class ConsultationsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private permissionsService: PermissionsService,
    private patientsService: PatientsService,
  ) {}

  private async assertPatientOwnership(
    nutritionistId: string,
    patientId: string,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, nutritionistId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }
  }

  async create(
    accountId: string,
    nutritionistId: string,
    createConsultationDto: CreateConsultationDto,
  ) {
    const shouldSyncPatientProfile =
      createConsultationDto.title === INDEPENDENT_METRICS_TITLE;

    const consultationsTotal = await this.prisma.consultation.count({
      where: {
        nutritionistId,
        title: { not: INDEPENDENT_METRICS_TITLE },
      },
    });

    await this.permissionsService.ensureWithinLimit(
      accountId,
      'consultations.monthly.limit',
      consultationsTotal,
    );

    await this.assertPatientOwnership(
      nutritionistId,
      createConsultationDto.patientId,
    );

    this.assertMetricsDoNotContainClinicalFields(createConsultationDto.metrics);

    // Crear consulta y sincronizar métricas del paciente de forma atómica
    const consultation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.consultation.create({
        data: {
          patientId: createConsultationDto.patientId,
          title: createConsultationDto.title,
          description: createConsultationDto.description,
          date: new Date(createConsultationDto.date),
          nutritionistId,
          plansDelivered: createConsultationDto.plansDelivered ?? false,
          // metrics es Json en Prisma; el tipado fuerte viene del DTO
          metrics: (createConsultationDto.metrics ?? []) as any,
        },
        select: consultationSelect,
      });

      if (
        createConsultationDto.metrics &&
        createConsultationDto.metrics.length > 0
      ) {
        // Patient sync happens after the transaction to keep the reconciliation logic centralized.
      }

      return created;
    });

    if (shouldSyncPatientProfile) {
      await this.reconcilePatientProfileFromConsultations(
        nutritionistId,
        createConsultationDto.patientId,
      );
    }

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'consultations',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'patients',
    );
    return consultation;
  }

  async findAll(
    nutritionistId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    patientId?: string,
    type?: 'CLINICAL' | 'METRIC' | 'ALL',
    dateFrom?: string,
    dateTo?: string,
  ) {
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(1, limit), 100)
      : 20;
    const skip = (safePage - 1) * safeLimit;

    if (!nutritionistId) {
      return {
        data: [],
        meta: {
          total: 0,
          page: safePage,
          lastPage: 0,
        },
      };
    }

    const where: any = {
      nutritionistId,
    };

    if (type === 'CLINICAL' || !type) {
      where.title = { not: INDEPENDENT_METRICS_TITLE };
    } else if (type === 'METRIC') {
      where.title = INDEPENDENT_METRICS_TITLE;
    }
    // if type === 'ALL', we don't add the title filter

    if (patientId) {
      where.patientId = patientId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.consultation.count({ where }),
      this.prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        select: consultationSelect,
      }),
    ]);

    return {
      data: data.map((item) => ({
        ...item,
        patientName: item.patient.fullName,
      })),
      meta: {
        total,
        page: safePage,
        lastPage: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(nutritionistId: string, id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      select: consultationSelect,
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    if (consultation.nutritionistId !== nutritionistId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta consulta',
      );
    }

    return {
      ...consultation,
      patientName: consultation.patient.fullName,
    };
  }

  async update(
    nutritionistId: string,
    id: string,
    updateConsultationDto: UpdateConsultationDto,
  ) {
    const existing = await this.findOne(nutritionistId, id);
    const shouldSyncPatientProfile =
      existing.title === INDEPENDENT_METRICS_TITLE ||
      updateConsultationDto.title === INDEPENDENT_METRICS_TITLE;

    this.assertMetricsDoNotContainClinicalFields(updateConsultationDto.metrics);

    const data: any = { ...updateConsultationDto };
    delete data.patientId;
    if (updateConsultationDto.date) {
      data.date = new Date(updateConsultationDto.date);
    }

    const consultation = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.consultation.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.date !== undefined && { date: data.date }),
          ...(data.metrics !== undefined && { metrics: data.metrics }),
          ...(data.plansDelivered !== undefined && {
            plansDelivered: data.plansDelivered,
          }),
        },
        select: consultationSelect,
      });

      return updated;
    });

    if (
      shouldSyncPatientProfile &&
      updateConsultationDto.metrics &&
      updateConsultationDto.metrics.length > 0
    ) {
      await this.reconcilePatientProfileFromConsultations(
        nutritionistId,
        existing.patientId,
      );
    }

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'consultations',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'patients',
    );
    return consultation;
  }

  private async reconcilePatientProfileFromConsultations(
    nutritionistId: string,
    patientId: string,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, nutritionistId },
      select: { customVariables: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const consultations = await this.prisma.consultation.findMany({
      where: { patientId, nutritionistId },
      orderBy: [{ date: 'asc' }, { updatedAt: 'asc' }],
      select: { metrics: true },
    });

    const latestScalarValues: Partial<Record<'weight' | 'height', number>> = {};
    const latestVariables = new Map<string, PatientCustomVariable>();

    const currentVariables = Array.isArray(patient.customVariables)
      ? (patient.customVariables as PatientCustomVariable[])
      : [];

    for (const variable of currentVariables) {
      const normalizedKey = normalizeMetricKey(variable.label, variable.key);
      if (INTERNAL_VARIABLE_KEYS.has(normalizedKey)) continue;
      latestVariables.set(normalizedKey, {
        ...variable,
        key: normalizedKey,
      });
    }

    for (const consultation of consultations) {
      const metrics = Array.isArray(consultation.metrics)
        ? (consultation.metrics as ConsultationMetric[])
        : [];

      for (const metric of metrics) {
        if (isReservedClinicalMetric(metric)) {
          continue;
        }

        const normalizedKey = normalizeMetricKey(metric.label, metric.key);
        const rawValue =
          typeof metric.value === 'string'
            ? metric.value.replace(',', '.')
            : metric.value;
        const parsedValue = Number(rawValue);

        if (
          // Only weight and height update the patient profile directly.
          // All other metrics remain historical consultation data.
          (normalizedKey === 'weight' || normalizedKey === 'height') &&
          metric.value !== undefined &&
          metric.value !== null &&
          metric.value !== '' &&
          Number.isFinite(parsedValue)
        ) {
          latestScalarValues[normalizedKey] = parsedValue;
          continue;
        }

        if (!normalizedKey) continue;

        latestVariables.set(normalizedKey, {
          key: normalizedKey,
          label: (metric.label || normalizedKey).trim(),
          unit: (metric.unit || '').trim() || undefined,
          value: metric.value ?? null,
        });
      }
    }

    const updatePayload: Record<string, unknown> = {
      recalculateNutrition: true,
      customVariables: Array.from(latestVariables.values()),
    };

    if (latestScalarValues.weight !== undefined) {
      updatePayload.weight = latestScalarValues.weight;
    }

    if (latestScalarValues.height !== undefined) {
      updatePayload.height = latestScalarValues.height;
    }

    await this.patientsService.update(
      nutritionistId,
      patientId,
      updatePayload as any,
    );
  }

  async remove(nutritionistId: string, id: string) {
    const existing = await this.findOne(nutritionistId, id);

    const deleted = await this.prisma.consultation.delete({
      where: { id },
    });

    if (existing.title === INDEPENDENT_METRICS_TITLE) {
      await this.reconcilePatientProfileFromConsultations(
        nutritionistId,
        deleted.patientId,
      );
    }

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'consultations',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'patients',
    );
    return deleted;
  }

  private assertMetricsDoNotContainClinicalFields(
    metrics?: CreateConsultationDto['metrics'],
  ) {
    if (!Array.isArray(metrics) || metrics.length === 0) return;

    const forbidden = metrics.filter((metric) =>
      isReservedClinicalMetric(metric),
    );
    if (forbidden.length === 0) return;

    const names = Array.from(
      new Set(
        forbidden.map(
          (metric) => metric.label || metric.key || 'campo clínico',
        ),
      ),
    );

    throw new BadRequestException(
      `No se pueden registrar como métricas campos clínicos/anamnesis: ${names.join(', ')}.`,
    );
  }
}
