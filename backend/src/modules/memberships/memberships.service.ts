import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MembershipsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all membership plans (active and inactive)
     * For admin panel management
     */
    async findAll() {
        const plans = await this.prisma.membershipPlan.findMany({
            orderBy: { displayOrder: 'asc' }
        });
        return plans.map(plan => ({
            ...plan,
            price: Number(plan.price)
        }));
    }

    /**
     * Get only active plans
     * For landing page display
     */
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

    /**
     * Get a single plan by ID
     */
    async findOne(id: string) {
        const plan = await this.prisma.membershipPlan.findUnique({
            where: { id }
        });
        if (!plan) return null;
        return {
            ...plan,
            price: Number(plan.price)
        };
    }

    /**
     * Create a new membership plan
     */
    async create(data: {
        name: string;
        slug: string;
        description?: string;
        price: number;
        currency?: string;
        billingPeriod?: string;
        features: string[];
        maxPatients?: number;
        maxStorage?: number;
        isPopular?: boolean;
        isActive?: boolean;
        displayOrder?: number;
    }) {
        return this.prisma.membershipPlan.create({
            data: {
                ...data,
                features: data.features || []
            }
        });
    }

    /**
     * Update an existing membership plan
     */
    async update(id: string, data: {
        name?: string;
        slug?: string;
        description?: string;
        price?: number;
        currency?: string;
        billingPeriod?: string;
        features?: string[];
        maxPatients?: number;
        maxStorage?: number;
        isPopular?: boolean;
        isActive?: boolean;
        displayOrder?: number;
    }) {
        return this.prisma.membershipPlan.update({
            where: { id },
            data
        });
    }

    /**
     * Delete a membership plan
     */
    async remove(id: string) {
        return this.prisma.membershipPlan.delete({
            where: { id }
        });
    }

    /**
     * Toggle plan active status
     */
    async toggleActive(id: string) {
        const plan = await this.findOne(id);
        if (!plan) throw new Error('Plan not found');

        return this.prisma.membershipPlan.update({
            where: { id },
            data: { isActive: !plan.isActive }
        });
    }
}
