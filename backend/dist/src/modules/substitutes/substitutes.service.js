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
exports.SubstitutesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SubstitutesService = class SubstitutesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByNutritionist(nutritionistId) {
        if (!nutritionistId) {
            throw new Error('Nutritionist ID is required');
        }
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { id: nutritionistId },
        });
        if (!nutritionist) {
            throw new common_1.NotFoundException('Nutritionist not found');
        }
        return this.prisma.substitute.findFirst({
            where: { nutritionistId },
        });
    }
    async upsert(nutritionistId, content) {
        if (!nutritionistId) {
            throw new Error('Nutritionist ID is required');
        }
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { id: nutritionistId },
        });
        if (!nutritionist) {
            throw new common_1.NotFoundException('Nutritionist not found');
        }
        const existing = await this.prisma.substitute.findFirst({
            where: { nutritionistId },
        });
        if (existing) {
            return this.prisma.substitute.update({
                where: { id: existing.id },
                data: { content },
            });
        }
        return this.prisma.substitute.create({
            data: {
                nutritionistId,
                content,
            },
        });
    }
};
exports.SubstitutesService = SubstitutesService;
exports.SubstitutesService = SubstitutesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubstitutesService);
//# sourceMappingURL=substitutes.service.js.map