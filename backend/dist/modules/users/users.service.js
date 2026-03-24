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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(role, search) {
        const where = {};
        if (role) {
            if (Array.isArray(role)) {
                where.role = { in: role };
            }
            else if (role === 'ALL_ADMINS') {
                where.role = { in: ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'] };
            }
            else {
                where.role = role;
            }
        }
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { nutritionist: { fullName: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const accounts = await this.prisma.account.findMany({
            where,
            include: {
                nutritionist: {
                    include: {
                        _count: {
                            select: { patients: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return accounts.map(acc => ({
            id: acc.id,
            email: acc.email,
            role: acc.role,
            status: acc.status,
            plan: acc.plan,
            subscriptionEndsAt: acc.subscriptionEndsAt,
            createdAt: acc.createdAt,
            lastLogin: acc.updatedAt,
            fullName: acc.nutritionist?.fullName || (acc.role === 'ADMIN_MASTER' ? 'Admin Master' :
                acc.role === 'ADMIN_GENERAL' ? 'Admin General' :
                    acc.role === 'ADMIN' ? 'Admin General' :
                        acc.email.split('@')[0]),
            patientCount: acc.nutritionist?._count?.patients || 0
        }));
    }
    async findOne(id) {
        return this.prisma.account.findUnique({
            where: { id },
            include: { nutritionist: true }
        });
    }
    async update(id, data) {
        return this.prisma.account.update({
            where: { id },
            data: {
                status: data.status,
                plan: data.plan,
                subscriptionEndsAt: data.subscriptionEndsAt,
                role: data.role,
            },
        });
    }
    async updatePlan(userId, plan, days) {
        const updateData = { plan };
        if (days && days > 0) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);
            updateData.subscriptionEndsAt = endDate;
        }
        return this.prisma.account.update({
            where: { id: userId },
            data: updateData
        });
    }
    async resetUnpaidPlans() {
        const now = new Date();
        const result = await this.prisma.account.updateMany({
            where: {
                role: 'NUTRITIONIST',
                plan: { not: 'FREE' },
                OR: [
                    { subscriptionEndsAt: null },
                    { subscriptionEndsAt: { lt: now } }
                ]
            },
            data: {
                plan: 'FREE',
                subscriptionEndsAt: null
            }
        });
        return {
            updatedCount: result.count,
            message: `${result.count} usuarios fueron cambiados a plan FREE`
        };
    }
    async countNutritionists() {
        return this.prisma.account.count({
            where: { role: 'NUTRITIONIST' }
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map