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
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CreationsService = class CreationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(nutritionistId, data) {
        const { name, type, content, metadata, tags } = data;
        if (!nutritionistId) {
            throw new Error('No se pudo identificar tu perfil de nutricionista. Asegúrate de tener una cuenta de nutricionista activa.');
        }
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { id: nutritionistId }
        });
        if (!nutritionist) {
            throw new Error('Perfil de nutricionista no encontrado. Intenta cerrar sesión y volver a entrar.');
        }
        if (!name || name.trim() === '') {
            throw new Error('El nombre de la creación es obligatorio');
        }
        return this.prisma.creation.create({
            data: {
                name,
                type,
                content,
                metadata: metadata || {},
                tags: tags || [],
                nutritionist: { connect: { id: nutritionistId } }
            }
        });
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
            throw new common_1.NotFoundException('La creación solicitada no existe o no tienes permiso para verla.');
        }
        return creation;
    }
    async delete(id, nutritionistId) {
        return this.prisma.creation.deleteMany({
            where: { id, nutritionistId }
        });
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreationsService);
//# sourceMappingURL=creations.service.js.map