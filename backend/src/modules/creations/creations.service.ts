import { createHash } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { CacheService } from '../../common/services/cache.service';

const FINGERPRINT_IGNORED_KEYS = new Set([
  'description',
  'createdAt',
  'updatedAt',
  'savedAt',
  'savedOn',
  'timestamp',
  'fingerprint',
  'creationFingerprint',
  'exportedAt',
  'sourceModule',
]);

const normalizeForFingerprint = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim().replace(/\s+/g, ' ');
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForFingerprint(item));
  }

  if (typeof value === 'object') {
    const normalizedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([key, entryValue]) => {
        if (entryValue === undefined) return false;
        return !FINGERPRINT_IGNORED_KEYS.has(key);
      })
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey, 'es'));

    return Object.fromEntries(
      normalizedEntries.map(([key, entryValue]) => [
        key,
        normalizeForFingerprint(entryValue),
      ]),
    );
  }

  return value;
};

const buildCreationFingerprint = (payload: {
  type: string;
  content: unknown;
  metadata?: unknown;
}) => {
  const normalized = normalizeForFingerprint({
    type: payload.type,
    content: payload.content,
    metadata: payload.metadata || {},
  });

  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
};

@Injectable()
export class CreationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async create(nutritionistId: string, data: any) {
    const { name, type, content, metadata, tags } = data;

    if (!nutritionistId) {
      throw new Error(
        'No se pudo identificar tu perfil de nutricionista. AsegÃºrate de tener una cuenta de nutricionista activa.',
      );
    }

    // Verificar si el nutricionista existe
    const nutritionist = await this.prisma.nutritionist.findUnique({
      where: { id: nutritionistId },
    });

    if (!nutritionist) {
      throw new Error(
        'Perfil de nutricionista no encontrado. Intenta cerrar sesiÃ³n y volver a entrar.',
      );
    }

    // Validar que el nombre no estÃ© vacÃ­o
    if (!name || name.trim() === '') {
      throw new Error('El nombre de la creaciÃ³n es obligatorio');
    }

    const trimmedName = name.trim();
    const creationFingerprint = buildCreationFingerprint({
      type,
      content,
      metadata,
    });
    const nextMetadata = {
      ...(metadata || {}),
      creationFingerprint,
    };

    const existingCreations = await this.prisma.creation.findMany({
      where: {
        nutritionistId,
        type,
      },
      select: {
        id: true,
        name: true,
        type: true,
        content: true,
        metadata: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const duplicateCreation = existingCreations.find(
      (creation) =>
        buildCreationFingerprint({
          type: creation.type,
          content: creation.content,
          metadata: creation.metadata || {},
        }) === creationFingerprint,
    );

    if (duplicateCreation) {
      return {
        ...duplicateCreation,
        wasCreated: false,
      };
    }

    const creation = await this.prisma.creation.create({
      data: {
        name: trimmedName,
        type,
        content,
        metadata: nextMetadata,
        tags: tags || [],
        nutritionist: { connect: { id: nutritionistId } },
      },
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'creations',
    );
    return {
      ...creation,
      wasCreated: true,
    };
  }

  async findAll(nutritionistId: string, type?: string) {
    return this.prisma.creation.findMany({
      where: {
        nutritionistId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, nutritionistId: string) {
    const creation = await this.prisma.creation.findFirst({
      where: { id, nutritionistId },
    });

    if (!creation) {
      throw new NotFoundException(
        'La creaciÃ³n solicitada no existe o no tienes permiso para verla.',
      );
    }

    return creation;
  }

  async delete(id: string, nutritionistId: string) {
    const result = await this.prisma.creation.deleteMany({
      where: { id, nutritionistId },
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'creations',
    );
    return result;
  }

  async getAvailableTags(nutritionistId: string) {
    // Obtenemos todos los tags Ãºnicos usando unnest de PostgreSQL
    const result: any[] = await this.prisma.$queryRaw`
            SELECT DISTINCT unnest(tags) as tag 
            FROM creations 
            WHERE nutritionist_id = ${nutritionistId}
            ORDER BY tag ASC
        `;
    return result.map((r) => r.tag).filter((t) => t);
  }

  async share(id: string, nutritionistId: string, patientId: string) {
    const creation = await this.prisma.creation.findFirst({
      where: { id, nutritionistId },
    });

    if (!creation) {
      throw new NotFoundException(
        'La creación no existe o no tienes permiso para compartirla.',
      );
    }

    const invitation = await this.prisma.patientPortalInvitation.findFirst({
      where: {
        patientId,
        nutritionistId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!invitation) {
      throw new Error(
        'El paciente no tiene una invitación activa al portal. Primero debes invitarlo.',
      );
    }

    const currentIds = invitation.deliverableCreationIds || [];
    const alreadyShared = currentIds.includes(id);
    const nextIds = alreadyShared
      ? currentIds.filter((creationId) => creationId !== id)
      : [...currentIds, id];

    const updatedInvitation = await this.prisma.patientPortalInvitation.update({
      where: { id: invitation.id },
      data: {
        deliverableCreationIds: {
          set: nextIds,
        },
      },
    });

    await this.cacheService.invalidateNutritionistPrefix(
      nutritionistId,
      'patient-portals',
    );
    await this.cacheService.invalidateGlobalPrefix('patient-portals');

    return {
      success: true,
      shared: !alreadyShared,
      message: alreadyShared
        ? 'Creación dejada de compartir con el paciente.'
        : 'Creación compartida correctamente con el paciente.',
      invitationId: updatedInvitation.id,
    };
  }
}
