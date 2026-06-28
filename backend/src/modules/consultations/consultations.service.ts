import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

import { CacheService } from '../../common/services/cache.service';
import { PermissionsService } from '../permissions/permissions.service';

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

const consultationSelect = {
  id: true,
  patientId: true,
  nutritionistId: true,
  date: true,
  title: true,
  description: true,
  metrics: true,
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
    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const consultationsThisMonth = await this.prisma.consultation.count({
      where: {
        nutritionistId,
        date: { gte: startOfMonth },
      },
    });

    await this.permissionsService.ensureWithinLimit(
      accountId,
      'consultations.monthly.limit',
      consultationsThisMonth,
    );

    await this.assertPatientOwnership(
      nutritionistId,
      createConsultationDto.patientId,
    );

    const consultation = await this.prisma.consultation.create({
      data: {
        ...createConsultationDto,
        nutritionistId,
        date: new Date(createConsultationDto.date),
      },
      select: consultationSelect,
    });

    // Sync patient data if metrics are present
    if (createConsultationDto.metrics) {
      await this.syncPatientData(
        nutritionistId,
        createConsultationDto.patientId,
        createConsultationDto.metrics,
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
  ) {
    const skip = (page - 1) * limit;

    if (!nutritionistId) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          lastPage: 0,
        },
      };
    }

    const where: any = {
      nutritionistId,
    };

    if (type === 'CLINICAL' || !type) {
      where.title = { not: 'Registro de Métricas Independiente' };
    } else if (type === 'METRIC') {
      where.title = 'Registro de Métricas Independiente';
    }
    // if type === 'ALL', we don't add the title filter

    if (patientId) {
      where.patientId = patientId;
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
        page,
        lastPage: Math.ceil(total / limit),
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
    const targetPatientId = updateConsultationDto.patientId ?? existing.patientId;

    await this.assertPatientOwnership(nutritionistId, targetPatientId);

    const data: any = { ...updateConsultationDto };
    if (updateConsultationDto.date) {
      data.date = new Date(updateConsultationDto.date);
    }

    const consultation = await this.prisma.consultation.update({
      where: { id },
      data,
      select: consultationSelect,
    });

    // Sync patient data if metrics are present
    if (updateConsultationDto.metrics) {
      await this.syncPatientData(
        nutritionistId,
        targetPatientId,
        updateConsultationDto.metrics,
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

  private async syncPatientData(
    nutritionistId: string,
    patientId: string,
    metrics: ConsultationMetric[],
  ) {
    const updates: {
      weight?: number;
      height?: number;
      customVariables?: PatientCustomVariable[];
    } = {};
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, nutritionistId },
      select: {
        customVariables: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const customVariables = Array.isArray(patient?.customVariables)
      ? [...(patient.customVariables as PatientCustomVariable[])]
      : [];
    let shouldUpdateCustomVariables = false;

    for (const metric of metrics) {
      const normalizedKey = normalizeMetricKey(metric.label, metric.key);
      const rawValue =
        typeof metric.value === 'string'
          ? metric.value.replace(',', '.')
          : metric.value;
      const val = parseFloat(String(rawValue));

      if (
        normalizedKey === 'weight' &&
        metric.value !== undefined &&
        metric.value !== null &&
        metric.value !== ''
      ) {
        if (!isNaN(val)) updates.weight = val;
      }

      if (
        normalizedKey === 'height' &&
        metric.value !== undefined &&
        metric.value !== null &&
        metric.value !== ''
      ) {
        if (!isNaN(val)) updates.height = val;
      }

      if (
        normalizedKey &&
        normalizedKey !== 'weight' &&
        normalizedKey !== 'height'
      ) {
        const metricEntry = {
          key: normalizedKey,
          label: (metric.label || normalizedKey).trim(),
          unit: (metric.unit || '').trim(),
        };

        const existingIndex = customVariables.findIndex(
          (cv) => normalizeMetricKey(cv.label, cv.key) === normalizedKey,
        );

        if (existingIndex >= 0) {
          customVariables[existingIndex] = {
            ...customVariables[existingIndex],
            ...metricEntry,
          };
        } else {
          customVariables.push(metricEntry);
        }

        shouldUpdateCustomVariables = true;
      }
    }

    if (shouldUpdateCustomVariables) {
      updates.customVariables = customVariables;
    }

    if (Object.keys(updates).length > 0) {
      await this.prisma.patient.update({
        where: { id: patientId },
        data: updates,
      });
    }
  }

  async remove(nutritionistId: string, id: string) {
    await this.findOne(nutritionistId, id);

    const deleted = await this.prisma.consultation.delete({
      where: { id },
    });

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
}
