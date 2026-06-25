import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateExamDto } from './dto/create-exam.dto';

import { CacheService } from '../../common/services/cache.service';
import { PermissionsService } from '../permissions/permissions.service';

const AUTOMATIC_NUTRITION_KEY = 'automaticNutritionCalculations';

type NutritionCalculationInput = {
  birthDate?: string | Date | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  activityLevel?: string | null;
  nutritionalFocus?: string | null;
  fitnessGoals?: string | null;
};

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private permissionsService: PermissionsService,
  ) {}

  async create(
    accountId: string,
    nutritionistId: string,
    createPatientDto: CreatePatientDto,
  ) {
    const { recalculateNutrition, age, ...patientData } =
      createPatientDto as any;
    const activePatients = await this.prisma.patient.count({
      where: { nutritionistId, status: 'Active' },
    });

    await this.permissionsService.ensureWithinLimit(
      accountId,
      'patients.active.limit',
      activePatients,
    );

    const customVariables = this.withAutomaticNutritionCalculations(
      patientData.customVariables,
      patientData,
      recalculateNutrition !== false,
    );

    const patient = await this.prisma.patient.create({
      data: {
        ...patientData,
        customVariables,
        nutritionistId,
      },
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'patients',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'dashboard',
    );
    return patient;
  }

  async findAll(
    nutritionistId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string,
    documentId?: string,
    tags?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    if (!nutritionistId) {
      return {
        data: [],
        meta: {
          total: 0,
          filteredTotal: 0,
          activeCount: 0,
          inactiveCount: 0,
          page,
          lastPage: 0,
        },
      };
    }

    const where: any = {
      nutritionistId,
    };

    if (status && status !== 'Todos') {
      where.status = status === 'Activos' ? 'Active' : 'Inactive';
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { documentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (documentId) {
      where.documentId = { contains: documentId, mode: 'insensitive' };
    }

    const parsedTags = tags
      ?.split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (parsedTags && parsedTags.length > 0) {
      where.tags = { hasSome: parsedTags };
    }

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [filteredTotal, statusCounts, data] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.groupBy({
        by: ['status'],
        where: { nutritionistId },
        _count: { status: true },
      }),
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const total = statusCounts.reduce(
      (sum, item) => sum + item._count.status,
      0,
    );
    const activeCount =
      statusCounts.find((item) => item.status === 'Active')?._count.status ?? 0;
    const inactiveCount =
      statusCounts.find((item) => item.status === 'Inactive')?._count.status ??
      0;

    return {
      data,
      meta: {
        total,
        filteredTotal,
        activeCount,
        inactiveCount,
        page,
        lastPage: Math.ceil(filteredTotal / limit),
      },
    };
  }

  async findOne(nutritionistId: string, id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        consultations: {
          orderBy: { date: 'asc' },
        },
        exams: {
          orderBy: { date: 'desc' },
        },
        projects: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            mode: true,
            status: true,
            updatedAt: true,
            activeDietCreation: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            activeRecipeCreation: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            activeDeliverableCreation: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // IDOR PROTECTION: Ensure the patient belongs to the requesting nutritionist
    if (patient.nutritionistId !== nutritionistId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este paciente',
      );
    }

    return patient;
  }

  async update(
    nutritionistId: string,
    id: string,
    updatePatientDto: UpdatePatientDto,
  ) {
    // Lightweight ownership check — does NOT load consultations, exams, or projects
    await this.assertOwnership(nutritionistId, id);

    const current = await this.prisma.patient.findUnique({ where: { id } });
    const { recalculateNutrition, age, ...patientData } =
      updatePatientDto as any;
    const mergedForCalculation = { ...(current || {}), ...patientData };
    const customVariables = this.withAutomaticNutritionCalculations(
      patientData.customVariables ?? current?.customVariables,
      mergedForCalculation,
      recalculateNutrition === true,
    );

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...patientData,
        customVariables,
      },
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'patients',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'dashboard',
    );
    return patient;
  }

  async recalculateAutomaticNutrition(nutritionistId: string, id: string) {
    await this.assertOwnership(nutritionistId, id);
    const current = await this.prisma.patient.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Paciente no encontrado');

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        customVariables: this.withAutomaticNutritionCalculations(
          current.customVariables,
          current,
          true,
        ),
      },
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'patients',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'dashboard',
    );
    return patient;
  }

  async remove(nutritionistId: string, id: string) {
    // Lightweight ownership check
    await this.assertOwnership(nutritionistId, id);

    const [, deleted] = await this.prisma.$transaction([
      this.prisma.consultation.deleteMany({
        where: { patientId: id, nutritionistId },
      }),
      this.prisma.patient.delete({
        where: { id },
      }),
    ]);

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'patients',
    );
    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'dashboard',
    );
    return deleted;
  }

  async addExam(nutritionistId: string, patientId: string, dto: CreateExamDto) {
    // Lightweight ownership check
    await this.assertOwnership(nutritionistId, patientId);

    const exam = await this.prisma.patientExam.create({
      data: {
        ...dto,
        patientId,
        date: new Date(dto.date),
        results: dto.results as any, // Prisma Json compatibility
      },
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'patients',
    );
    return exam;
  }

  /**
   * Lightweight ownership validation. Only loads the nutritionistId field.
   * Use instead of findOne() when the full patient object is not needed.
   */
  private async assertOwnership(
    nutritionistId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { nutritionistId: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (patient.nutritionistId !== nutritionistId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este paciente',
      );
    }
  }

  private withAutomaticNutritionCalculations(
    customVariables: unknown,
    patient: NutritionCalculationInput,
    shouldRecalculate: boolean,
  ) {
    if (!shouldRecalculate) {
      return (Array.isArray(customVariables) ? customVariables : []) as any;
    }

    const variables = Array.isArray(customVariables)
      ? customVariables.filter(
          (item: any) => item?.key !== AUTOMATIC_NUTRITION_KEY,
        )
      : [];

    const calculations = this.buildAutomaticNutritionCalculations(patient);
    if (!calculations) return variables as any;

    return [
      ...variables,
      {
        key: AUTOMATIC_NUTRITION_KEY,
        label: 'Cálculos nutricionales automáticos',
        unit: 'json',
        value: calculations,
      },
    ] as any;
  }

  private buildAutomaticNutritionCalculations(
    patient: NutritionCalculationInput,
  ) {
    const weight = this.toPositiveNumber(patient.weight);
    const height = this.toPositiveNumber(patient.height);
    const age = this.calculateAge(patient.birthDate);
    if (!weight || !height || age === null) return null;

    const gender = this.normalizeGender(patient.gender);
    const activity = this.normalizeActivityLevel(patient.activityLevel);
    const bmi = this.round(weight / Math.pow(height / 100, 2), 1);
    const classification = this.classifyBmi(bmi);
    const tmb = this.calculateMifflinStJeor(gender, weight, height, age);
    const activityFactor = this.getActivityFactor(activity);
    const get = Math.round(tmb * activityFactor);
    const macros = this.calculateMacros(get);
    const portionProfile = this.resolvePortionProfile({
      calories: get,
      bmi,
      activityLevel: activity,
      nutritionalFocus: patient.nutritionalFocus,
    });
    const category = this.resolvePatientNutritionCategory({
      bmi,
      classification,
      activityLevel: activity,
      nutritionalFocus: patient.nutritionalFocus,
      fitnessGoals: patient.fitnessGoals,
    });
    const dailyTargets = this.buildSuggestedDailyTargets({
      get,
      macros,
      category,
      proteinGramsPerKg: this.resolveProteinGramsPerKg(category, weight),
    });

    return {
      version: '2026-05-29-v1',
      calculatedAt: new Date().toISOString(),
      source: 'OMS IMC + Mifflin-St Jeor + factores de actividad estándar',
      status: 'SUGGESTED_REVIEW_REQUIRED',
      note: 'Valores orientativos para apoyo clínico. Deben ser revisados y ajustados por el nutricionista tratante.',
      inputs: { weight, height, age, gender, activityLevel: activity },
      bmi: { value: bmi, classification },
      idealWeight: this.getIdealWeightRange(height),
      energy: {
        tmb: Math.round(tmb),
        get,
        activityFactor,
        formula: 'Mifflin-St Jeor',
      },
      macros,
      category,
      dailyTargets,
      portionProfile,
    };
  }

  private calculateAge(birthDate?: string | Date | null) {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  }

  private calculateMifflinStJeor(
    gender: 'Masculino' | 'Femenino',
    weight: number,
    height: number,
    age: number,
  ) {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'Masculino' ? base + 5 : base - 161;
  }

  private calculateMacros(calories: number) {
    const carbsPercent = 55;
    const proteinPercent = 20;
    const fatsPercent = 25;
    return {
      calories,
      carbs: Math.round((calories * (carbsPercent / 100)) / 4),
      protein: Math.round((calories * (proteinPercent / 100)) / 4),
      fats: Math.round((calories * (fatsPercent / 100)) / 9),
      carbsPercent,
      proteinPercent,
      fatsPercent,
    };
  }

  private classifyBmi(bmi: number) {
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidad I';
    if (bmi < 40) return 'Obesidad II';
    return 'Obesidad III';
  }

  private getIdealWeightRange(height: number) {
    const heightM = height / 100;
    return {
      min: this.round(18.5 * heightM * heightM, 1),
      max: this.round(24.9 * heightM * heightM, 1),
    };
  }

  private resolvePortionProfile(input: {
    calories: number;
    bmi: number;
    activityLevel: string;
    nutritionalFocus?: string | null;
  }) {
    const focus = String(input.nutritionalFocus || '').toLowerCase();
    const isWeightLoss =
      focus.includes('bajar') ||
      focus.includes('perdida') ||
      focus.includes('pérdida');
    const isWeightGain = focus.includes('subir') || focus.includes('ganancia');
    const active = ['activo', 'muy_activo'].includes(input.activityLevel);

    if (isWeightLoss || input.bmi >= 30) {
      return {
        id: 'controlled_energy',
        label: 'Porciones controladas en energía',
        category: 'CONTROLLED',
        rationale:
          'IMC/objetivo sugieren priorizar densidad energética moderada, fibra y control de carbohidratos concentrados.',
      };
    }

    if (isWeightGain || input.calories >= 2600 || active) {
      return {
        id: 'high_energy_active',
        label: 'Porciones aumentadas para mayor gasto',
        category: 'HIGH_ENERGY',
        rationale:
          'Mayor gasto energético u objetivo de ganancia: aumentar porciones principalmente desde alimentos de buena calidad nutricional.',
      };
    }

    if (input.calories < 1700 || input.bmi < 18.5) {
      return {
        id: 'supervised_adjustment',
        label: 'Ajuste supervisado',
        category: 'SUPERVISED',
        rationale:
          'Requiere revisión clínica cuidadosa antes de limitar o aumentar porciones automáticamente.',
      };
    }

    return {
      id: 'standard_balanced',
      label: 'Porciones balanceadas estándar',
      category: 'STANDARD',
      rationale:
        'Perfil energético y antropométrico compatible con distribución balanceada inicial.',
    };
  }

  private normalizeGender(value?: string | null): 'Masculino' | 'Femenino' {
    return value === 'Masculino' ? 'Masculino' : 'Femenino';
  }

  private normalizeActivityLevel(value?: string | null) {
    const normalized = String(value || '').toLowerCase();
    return [
      'sedentario',
      'ligero',
      'moderado',
      'activo',
      'muy_activo',
    ].includes(normalized)
      ? normalized
      : 'sedentario';
  }

  private getActivityFactor(activityLevel: string) {
    const factors: Record<string, number> = {
      sedentario: 1.2,
      ligero: 1.375,
      moderado: 1.55,
      activo: 1.725,
      muy_activo: 1.9,
    };
    return factors[activityLevel] || 1.2;
  }

  private toPositiveNumber(value: unknown) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  private resolvePatientNutritionCategory(input: {
    bmi: number;
    classification: string;
    activityLevel: string;
    nutritionalFocus?: string | null;
    fitnessGoals?: string | null;
  }) {
    const focus = String(input.nutritionalFocus || '').toLowerCase();
    const fitness = String(input.fitnessGoals || '').toLowerCase();
    const isWeightLoss = focus.includes('bajar') || focus.includes('perdida');
    const isWeightGain = focus.includes('subir') || focus.includes('ganancia');
    const isMuscle =
      fitness.includes('muscular') ||
      fitness.includes('ganancia') ||
      focus.includes('muscular');
    const isPerformance =
      fitness.includes('rendimiento') || fitness.includes('deportivo');
    const isRehab =
      fitness.includes('rehabilitación') ||
      fitness.includes('rehabilitacion') ||
      fitness.includes('movilidad');
    const isMetabolic =
      focus.includes('metabólico') ||
      focus.includes('metabolico') ||
      focus.includes('patología') ||
      focus.includes('patologia');
    const isActive = ['activo', 'muy_activo'].includes(input.activityLevel);
    const isBajoPeso = input.bmi < 18.5 || input.classification === 'Bajo peso';
    const isObeso = input.bmi >= 30;

    if (isBajoPeso) {
      return {
        id: 'clinical_review_required',
        label: 'Requiere revisión clínica previa',
        strategy:
          'Derivar a evaluación profesional antes de asignar objetivos automáticos.',
      };
    }

    if (isMetabolic) {
      return {
        id: 'metabolic_care',
        label: 'Cuidado metabólico',
        strategy:
          'Objetivos orientados a estabilidad glucémica, perfil lipídico y control de comorbilidades.',
      };
    }

    if (isObeso && isWeightLoss) {
      return {
        id: 'weight_loss_controlled',
        label: 'Baja de peso controlada',
        strategy:
          'Déficit calórico moderado (~20 %), proteína suficiente para preservar masa magra y control de carbohidratos concentrados.',
      };
    }

    if (isWeightLoss) {
      return {
        id: 'weight_loss_moderate',
        label: 'Baja de peso moderada',
        strategy:
          'Déficit calórico leve (~10-15 %), priorizando proteína y fibra para saciedad.',
      };
    }

    if (isMuscle) {
      return {
        id: 'muscle_gain',
        label: 'Ganancia muscular',
        strategy:
          'Superávit calórico leve (~10 %), proteína alta y distribución en 4-5 comidas.',
      };
    }

    if (isPerformance || (isActive && !isWeightLoss && !isWeightGain)) {
      return {
        id: 'high_energy_active',
        label: 'Alta demanda energética',
        strategy:
          'Aporte energético suficiente, carbohidratos para rendimiento y proteína para recuperación.',
      };
    }

    if (isWeightGain) {
      return {
        id: 'weight_gain_supervised',
        label: 'Aumento de peso supervisado',
        strategy:
          'Superávit calórico progresivo, alimentos densos en nutrientes y monitoreo frecuente.',
      };
    }

    if (isRehab) {
      return {
        id: 'rehabilitation',
        label: 'Rehabilitación / movilidad',
        strategy:
          'Enfoque en antiinflamatorios naturales, proteína para reparación tisular y energía suficiente para terapia.',
      };
    }

    return {
      id: 'standard_maintenance',
      label: 'Mantenimiento estándar',
      strategy:
        'Distribución balanceada según AMDR, ajustable según evolución clínica.',
    };
  }

  private resolveProteinGramsPerKg(
    category: { id: string; label: string; strategy: string },
    weightKg: number,
  ) {
    const map: Record<string, number> = {
      clinical_review_required: 1.0,
      metabolic_care: 1.2,
      weight_loss_controlled: 1.6,
      weight_loss_moderate: 1.4,
      muscle_gain: 2.0,
      high_energy_active: 1.6,
      weight_gain_supervised: 1.4,
      rehabilitation: 1.5,
    };
    const gPerKg = map[category.id] || 1.2;
    return this.round(gPerKg, 1);
  }

  private buildSuggestedDailyTargets(input: {
    get: number;
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      carbsPercent: number;
      proteinPercent: number;
      fatsPercent: number;
    };
    category: { id: string; label: string; strategy: string };
    proteinGramsPerKg: number;
  }) {
    const proteinGrams = Math.round(input.proteinGramsPerKg * 70); // fallback, adjusted below
    const adjustedCalories = this.resolveTargetCalories(
      input.get,
      input.category,
    );
    const adjustedProtein = Math.round(
      (adjustedCalories * (input.macros.proteinPercent / 100)) / 4,
    );
    const adjustedCarbs = Math.round(
      (adjustedCalories * (input.macros.carbsPercent / 100)) / 4,
    );
    const adjustedFats = Math.round(
      (adjustedCalories * (input.macros.fatsPercent / 100)) / 9,
    );

    return {
      calories: adjustedCalories,
      protein: adjustedProtein,
      carbs: adjustedCarbs,
      fats: adjustedFats,
      proteinPercent: input.macros.proteinPercent,
      carbsPercent: input.macros.carbsPercent,
      fatsPercent: input.macros.fatsPercent,
      formula: input.category.strategy,
    };
  }

  private resolveTargetCalories(get: number, category: { id: string }) {
    if (category.id === 'weight_loss_controlled') return Math.round(get * 0.8);
    if (category.id === 'weight_loss_moderate') return Math.round(get * 0.88);
    if (category.id === 'muscle_gain') return Math.round(get * 1.1);
    if (category.id === 'weight_gain_supervised') return Math.round(get * 1.12);
    return get;
  }

  private round(value: number, decimals: number) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
