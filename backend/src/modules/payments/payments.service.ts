import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all payments with account details
     * Admin view
     */
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

    /**
     * Get recent transactions for the admin dashboard
     */
    async findRecent(limit: number = 5) {
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

    /**
     * Register a new payment (Source of Truth)
     * This follows the append-only pattern for financial data.
     */
    async createPayment(data: {
        accountId: string;
        amount: number;
        method: PaymentMethod;
        transactionId?: string;
        idempotencyKey?: string;
        metadata?: any;
    }) {
        return this.prisma.payment.create({
            data: {
                accountId: data.accountId,
                amount: data.amount,
                method: data.method,
                transactionId: data.transactionId,
                idempotencyKey: data.idempotencyKey,
                metadata: data.metadata || {},
                status: PaymentStatus.COMPLETED, // Assuming successful for now
                paidAt: new Date(),
            }
        });
    }

    /**
     * Get revenue stats (MRR calculation example)
     */
    async getRevenueStats() {
        const totalRevenue = await this.prisma.payment.aggregate({
            where: { status: PaymentStatus.COMPLETED },
            _sum: { amount: true }
        });

        // Current month revenue
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const mrr = await this.prisma.payment.aggregate({
            where: {
                status: PaymentStatus.COMPLETED,
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
    /**
     * Simulate a manual payment for testing/admin purposes
     */
    async simulatePayment(data: {
        userId: string;
        planId: string;
        amount?: number;
        method: PaymentMethod;
    }) {
        const { userId, planId, method } = data;

        // 1. Verify resources
        const user = await this.prisma.account.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan no encontrado');

        const amount = data.amount || Number(plan.price);

        // 2. Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        if (plan.billingPeriod === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // 3. Execute Transaction
        return this.prisma.$transaction(async (tx) => {
            // A. Create Payment
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

            // B. Update/Create Subscription
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

            // C. Update User Account (Legacy compatibility)
            // We map the plan slug to the enum if possible, or keep PRO as fallback
            let accountPlan: 'FREE' | 'PRO' | 'ENTERPRISE' = 'PRO';
            if (plan.slug.includes('free')) accountPlan = 'FREE';
            if (plan.slug.includes('enterprise')) accountPlan = 'ENTERPRISE';

            await tx.account.update({
                where: { id: userId },
                data: {
                    plan: accountPlan,
                    subscriptionEndsAt: endDate
                }
            });

            // D. Update Metrics (Simple Daily Aggregation)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await tx.dailyMetric.upsert({
                where: { date: today },
                update: {
                    totalRevenue: { increment: amount },
                    newUsers: { increment: 0 }, // Not a new user technically
                    activeSubscriptions: { increment: 1 }
                },
                create: {
                    date: today,
                    totalRevenue: amount,
                    activeSubscriptions: 1,
                    totalUsers: await tx.account.count(), // Approximate
                }
            });

            return { payment, subscription };
        });
    }
}
