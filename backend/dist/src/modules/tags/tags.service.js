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
exports.TagsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_service_1 = require("../../common/services/cache.service");
let TagsService = class TagsService {
    prisma;
    cacheService;
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async findAll(limit) {
        return this.prisma.tag.findMany({
            orderBy: { name: 'asc' },
            ...(limit ? { take: limit } : {}),
            select: {
                id: true,
                name: true,
                nutritionistId: true
            }
        });
    }
    async findOrCreate(name, nutritionistId) {
        const normalizedName = name.trim();
        if (!normalizedName)
            return null;
        const existingTag = await this.prisma.tag.findFirst({
            where: {
                name: { equals: normalizedName, mode: 'insensitive' }
            }
        });
        if (existingTag) {
            return existingTag;
        }
        const tag = await this.prisma.tag.create({
            data: {
                name: normalizedName,
                nutritionistId: nutritionistId
            },
        });
        await this.cacheService.invalidateGlobalPrefix('tags');
        return tag;
    }
    async search(query) {
        return this.prisma.tag.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            orderBy: { name: 'asc' },
            take: 20,
            select: {
                id: true,
                name: true,
                nutritionistId: true
            }
        });
    }
    async remove(id, nutritionistId, role) {
        const tag = await this.prisma.tag.findUnique({ where: { id } });
        if (!tag) {
            throw new Error('La restricción que intentas eliminar no existe o ya fue borrada.');
        }
        const isAdmin = role && role.startsWith('ADMIN');
        if (!isAdmin && tag.nutritionistId && tag.nutritionistId !== nutritionistId) {
            throw new Error('No tienes permisos para eliminar esta restricción');
        }
        if (!isAdmin && !tag.nutritionistId) {
            throw new Error('Las restricciones globales del sistema no pueden ser eliminadas');
        }
        const deleted = await this.prisma.tag.delete({
            where: { id },
        });
        await this.cacheService.invalidateGlobalPrefix('tags');
        return deleted;
    }
};
exports.TagsService = TagsService;
exports.TagsService = TagsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], TagsService);
//# sourceMappingURL=tags.service.js.map