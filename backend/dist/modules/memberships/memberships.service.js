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
exports.MembershipsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let MembershipsService = class MembershipsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const plans = await this.prisma.membershipPlan.findMany({
            orderBy: { displayOrder: 'asc' }
        });
        return plans.map(plan => ({
            ...plan,
            price: Number(plan.price)
        }));
    }
    async findActive() {
        const plans = await this.prisma.membershipPlan.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        });
        return plans.map(plan => ({
            ...plan,
            price: Number(plan.price)
        }));
    }
    async findOne(id) {
        const plan = await this.prisma.membershipPlan.findUnique({
            where: { id }
        });
        if (!plan)
            return null;
        return {
            ...plan,
            price: Number(plan.price)
        };
    }
    async create(data) {
        return this.prisma.membershipPlan.create({
            data: {
                ...data,
                features: data.features || []
            }
        });
    }
    async update(id, data) {
        return this.prisma.membershipPlan.update({
            where: { id },
            data
        });
    }
    async remove(id) {
        return this.prisma.membershipPlan.delete({
            where: { id }
        });
    }
    async toggleActive(id) {
        const plan = await this.findOne(id);
        if (!plan)
            throw new Error('Plan not found');
        return this.prisma.membershipPlan.update({
            where: { id },
            data: { isActive: !plan.isActive }
        });
    }
};
exports.MembershipsService = MembershipsService;
exports.MembershipsService = MembershipsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembershipsService);
//# sourceMappingURL=memberships.service.js.map