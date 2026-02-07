import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountStatus, SubscriptionPlan, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    /**
     * RULE: The backend must handle all heavy logic, filtering, and calculations.
     * The frontend should only receive prepared data and display it immediately.
     */
    async findAll(role?: any, search?: string) {
        const where: any = {};

        if (role) {
            if (Array.isArray(role)) {
                where.role = { in: role };
            } else if (role === 'ALL_ADMINS') {
                where.role = { in: ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'] };
            } else {
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

        // Backend optimizes the data structure before sending to frontend
        return accounts.map(acc => ({
            id: acc.id,
            email: acc.email,
            role: acc.role,
            status: acc.status,
            plan: acc.plan,
            subscriptionEndsAt: acc.subscriptionEndsAt,
            createdAt: acc.createdAt,
            lastLogin: acc.updatedAt,
            fullName: acc.nutritionist?.fullName || (
                (acc.role as any) === 'ADMIN_MASTER' ? 'Admin Master' :
                    (acc.role as any) === 'ADMIN_GENERAL' ? 'Admin General' :
                        acc.role === 'ADMIN' ? 'Admin General' :
                            acc.email.split('@')[0]
            ),
            patientCount: acc.nutritionist?._count?.patients || 0
        }));
    }

    async findOne(id: string) {
        return this.prisma.account.findUnique({
            where: { id },
            include: { nutritionist: true }
        });
    }

    async update(id: string, data: { status?: AccountStatus; plan?: SubscriptionPlan; subscriptionEndsAt?: Date; role?: UserRole }) {
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

    /**
     * Update user's subscription plan
     */
    async updatePlan(userId: string, plan: SubscriptionPlan, days?: number) {
        const updateData: any = { plan };

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

    /**
     * Reset all unpaid users to FREE plan
     * Criteria: subscriptionEndsAt is in the past or null, and plan is not FREE
     */
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
    /**
     * Count total number of nutritionists
     */
    async countNutritionists() {
        return this.prisma.account.count({
            where: { role: 'NUTRITIONIST' }
        });
    }
}

