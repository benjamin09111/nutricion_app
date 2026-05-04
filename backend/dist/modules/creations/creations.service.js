"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreationsService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_service_1 = require("../../common/services/cache.service");
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
const normalizeForFingerprint = (value) => {
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
        const normalizedEntries = Object.entries(value)
            .filter(([key, entryValue]) => {
            if (entryValue === undefined)
                return false;
            return !FINGERPRINT_IGNORED_KEYS.has(key);
        })
            .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey, 'es'));
        return Object.fromEntries(normalizedEntries.map(([key, entryValue]) => [
            key,
            normalizeForFingerprint(entryValue),
        ]));
    }
    return value;
};
const buildCreationFingerprint = (payload) => {
    const normalized = normalizeForFingerprint({
        type: payload.type,
        content: payload.content,
        metadata: payload.metadata || {},
    });
    return (0, crypto_1.createHash)('sha256').update(JSON.stringify(normalized)).digest('hex');
};
let CreationsService = class CreationsService {
    prisma;
    cacheService;
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async create(nutritionistId, data) {
        const { name, type, content, metadata, tags } = data;
        if (!nutritionistId) {
            throw new Error('No se pudo identificar tu perfil de nutricionista. AsegÃºrate de tener una cuenta de nutricionista activa.');
        }
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { id: nutritionistId }
        });
        if (!nutritionist) {
            throw new Error('Perfil de nutricionista no encontrado. Intenta cerrar sesiÃ³n y volver a entrar.');
        }
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
                type
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
        const duplicateCreation = existingCreations.find((creation) => buildCreationFingerprint({
            type: creation.type,
            content: creation.content,
            metadata: creation.metadata || {},
        }) === creationFingerprint);
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
                nutritionist: { connect: { id: nutritionistId } }
            }
        });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'creations');
        return {
            ...creation,
            wasCreated: true,
        };
    }
    async findAll(nutritionistId, type) {
        return this.prisma.creation.findMany({
            where: {
                nutritionistId,
                ...(type ? { type } : {})
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(id, nutritionistId) {
        const creation = await this.prisma.creation.findFirst({
            where: { id, nutritionistId }
        });
        if (!creation) {
            throw new common_1.NotFoundException('La creaciÃ³n solicitada no existe o no tienes permiso para verla.');
        }
        return creation;
    }
    async delete(id, nutritionistId) {
        const result = await this.prisma.creation.deleteMany({
            where: { id, nutritionistId }
        });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'creations');
        return result;
    }
    async getAvailableTags(nutritionistId) {
        const result = await this.prisma.$queryRaw `
            SELECT DISTINCT unnest(tags) as tag 
            FROM creations 
            WHERE nutritionist_id = ${nutritionistId}
            ORDER BY tag ASC
        `;
        return result.map(r => r.tag).filter(t => t);
    }
};
exports.CreationsService = CreationsService;
exports.CreationsService = CreationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], CreationsService);
//# sourceMappingURL=creations.service.js.map