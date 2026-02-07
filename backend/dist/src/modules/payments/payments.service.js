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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PaymentsService = class PaymentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.payment.findMany({
            include: {
                account: {
                    select: {
                        email: true,
                        nutritionist: {
                            select: {
                                fullName: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findRecent(limit = 5) {
        return this.prisma.payment.findMany({
            take: limit,
            include: {
                account: {
                    select: {
                        nutritionist: {
                            select: {
                                fullName: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createPayment(data) {
        return this.prisma.payment.create({
            data: {
                accountId: data.accountId,
                amount: data.amount,
                method: data.method,
                transactionId: data.transactionId,
                idempotencyKey: data.idempotencyKey,
                metadata: data.metadata || {},
                status: client_1.PaymentStatus.COMPLETED,
                paidAt: new Date(),
            }
        });
    }
    async getRevenueStats() {
        const totalRevenue = await this.prisma.payment.aggregate({
            where: { status: client_1.PaymentStatus.COMPLETED },
            _sum: { amount: true }
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const mrr = await this.prisma.payment.aggregate({
            where: {
                status: client_1.PaymentStatus.COMPLETED,
                paidAt: { gte: startOfMonth }
            },
            _sum: { amount: true }
        });
        return {
            totalLifetime: totalRevenue._sum.amount || 0,
            mrr: mrr._sum.amount || 0,
            currency: 'CLP'
        };
    }
    async simulatePayment(data) {
        const { userId, planId, method } = data;
        const user = await this.prisma.account.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan no encontrado');
        const amount = data.amount || Number(plan.price);
        const startDate = new Date();
        const endDate = new Date();
        if (plan.billingPeriod === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        return this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    accountId: userId,
                    amount: amount,
                    currency: plan.currency,
                    status: 'COMPLETED',
                    method: method,
                    paidAt: startDate,
                    metadata: {
                        isSimulation: true,
                        adminTriggered: true
                    }
                }
            });
            const subscription = await tx.subscription.upsert({
                where: { accountId: userId },
                update: {
                    planId: planId,
                    status: 'ACTIVE',
                    startDate: startDate,
                    endDate: endDate,
                    updatedAt: startDate
                },
                create: {
                    accountId: userId,
                    planId: planId,
                    status: 'ACTIVE',
                    startDate: startDate,
                    endDate: endDate
                }
            });
            let accountPlan = 'PRO';
            if (plan.slug.includes('free'))
                accountPlan = 'FREE';
            if (plan.slug.includes('enterprise'))
                accountPlan = 'ENTERPRISE';
            await tx.account.update({
                where: { id: userId },
                data: {
                    plan: accountPlan,
                    subscriptionEndsAt: endDate
                }
            });
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await tx.dailyMetric.upsert({
                where: { date: today },
                update: {
                    totalRevenue: { increment: amount },
                    newUsers: { increment: 0 },
                    activeSubscriptions: { increment: 1 }
                },
                create: {
                    date: today,
                    totalRevenue: amount,
                    activeSubscriptions: 1,
                    totalUsers: await tx.account.count(),
                }
            });
            return { payment, subscription };
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map