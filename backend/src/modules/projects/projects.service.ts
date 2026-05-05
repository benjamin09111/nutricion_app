import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  private readonly projectInclude = {
    patient: {
      select: {
        id: true,
        fullName: true,
        email: true,
        weight: true,
        height: true,
        dietRestrictions: true,
      },
    },
    activeDietCreation: {
      select: { id: true, name: true, type: true, updatedAt: true },
    },
    activeRecipeCreation: {
      select: { id: true, name: true, type: true, updatedAt: true },
    },
    activeCartCreation: {
      select: { id: true, name: true, type: true, updatedAt: true },
    },
    activeDeliverableCreation: {
      select: { id: true, name: true, type: true, updatedAt: true },
    },
  } as const;

  private async validatePatientOwnership(
    nutritionistId: string,
    patientId?: string,
  ) {
    if (!patientId) return;

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, nutritionistId: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (patient.nutritionistId !== nutritionistId) {
      throw new ForbiddenException(
        'No tienes permiso para usar este paciente en el proyecto',
      );
    }
  }

  private async validateCreationOwnership(
    nutritionistId: string,
    creationId: string | undefined,
    expectedType: string,
  ) {
    if (!creationId) return;

    const creation = await this.prisma.creation.findUnique({
      where: { id: creationId },
      select: { id: true, nutritionistId: true, type: true },
    });

    if (!creation) {
      throw new NotFoundException('La creación vinculada no existe');
    }

    if (creation.nutritionistId !== nutritionistId) {
      throw new ForbiddenException(
        'No tienes permiso para usar esta creación en el proyecto',
      );
    }

    if (creation.type !== expectedType) {
      throw new ForbiddenException(
        `La creación ${creationId} no corresponde al módulo ${expectedType}`,
      );
    }
  }

  private async validateOwnerships(
    nutritionistId: string,
    dto: CreateProjectDto | UpdateProjectDto,
  ) {
    await this.validatePatientOwnership(nutritionistId, dto.patientId);
    await this.validateCreationOwnership(
      nutritionistId,
      dto.activeDietCreationId,
      'DIET',
    );
    await this.validateCreationOwnership(
      nutritionistId,
      dto.activeRecipeCreationId,
      'RECIPE',
    );
    await this.validateCreationOwnership(
      nutritionistId,
      dto.activeCartCreationId,
      'SHOPPING_LIST',
    );
    await this.validateCreationOwnership(
      nutritionistId,
      dto.activeDeliverableCreationId,
      'DELIVERABLE',
    );
  }

  async create(nutritionistId: string, dto: CreateProjectDto) {
    await this.validateOwnerships(nutritionistId, dto);

    const data: Prisma.ProjectUncheckedCreateInput = {
      nutritionistId,
      name: dto.name,
      description: dto.description,
      patientId: dto.patientId,
      mode: dto.mode ?? 'CLINICAL',
      status: dto.status ?? 'DRAFT',
      activeDietCreationId: dto.activeDietCreationId,
      activeRecipeCreationId: dto.activeRecipeCreationId,
      activeCartCreationId: dto.activeCartCreationId,
      activeDeliverableCreationId: dto.activeDeliverableCreationId,
      metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
    };

    const project = await this.prisma.project.create({
      data,
      include: this.projectInclude,
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'projects',
    );
    return project;
  }

  async findAll(nutritionistId: string, search?: string, status?: string) {
    const where: Record<string, unknown> = { nutritionistId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.project.findMany({
      where,
      include: this.projectInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(nutritionistId: string, id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: this.projectInclude,
    });

    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    if (project.nutritionistId !== nutritionistId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este proyecto',
      );
    }

    return project;
  }

  async update(nutritionistId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(nutritionistId, id);
    await this.validateOwnerships(nutritionistId, dto);

    const data: Prisma.ProjectUncheckedUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.patientId !== undefined ? { patientId: dto.patientId } : {}),
      ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.activeDietCreationId !== undefined
        ? { activeDietCreationId: dto.activeDietCreationId }
        : {}),
      ...(dto.activeRecipeCreationId !== undefined
        ? { activeRecipeCreationId: dto.activeRecipeCreationId }
        : {}),
      ...(dto.activeCartCreationId !== undefined
        ? { activeCartCreationId: dto.activeCartCreationId }
        : {}),
      ...(dto.activeDeliverableCreationId !== undefined
        ? {
            activeDeliverableCreationId: dto.activeDeliverableCreationId,
          }
        : {}),
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as Prisma.InputJsonValue }
        : {}),
    };

    const project = await this.prisma.project.update({
      where: { id },
      data,
      include: this.projectInclude,
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'projects',
    );
    return project;
  }
}
