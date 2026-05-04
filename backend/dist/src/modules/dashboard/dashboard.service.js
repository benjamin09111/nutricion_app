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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNutritionistStats(nutritionistId) {
        const [totalPatients, totalRecipes, recentPatients, ingredientsCount] = await Promise.all([
            this.prisma.patient.count({
                where: { nutritionistId }
            }),
            this.prisma.recipe.count({
                where: { nutritionistId }
            }),
            this.prisma.patient.findMany({
                where: { nutritionistId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    fullName: true,
                    updatedAt: true,
                    email: true
                }
            }),
            this.prisma.ingredient.count({
                where: { nutritionistId }
            })
        ]);
        const stats = [
            {
                name: 'Pacientes Activos',
                stat: totalPatients.toString(),
                icon: 'Users',
                change: '+0%',
                changeType: 'neutral'
            },
            {
                name: 'Recetas Creadas',
                stat: totalRecipes.toString(),
                icon: 'FileText',
                change: '+0%',
                changeType: 'neutral'
            },
            {
                name: 'Ingredientes Propios',
                stat: ingredientsCount.toString(),
                icon: 'Activity',
                change: '+0%',
                changeType: 'neutral'
            },
        ];
        return {
            stats,
            recentPatients
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map