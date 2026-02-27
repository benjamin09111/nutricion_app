import { PrismaService } from '../../prisma/prisma.service';
import { AccountStatus, SubscriptionPlan, UserRole } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(role?: any, search?: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        createdAt: Date;
        lastLogin: Date;
        fullName: string;
        patientCount: number;
    }[]>;
    findOne(id: string): Promise<({
        nutritionist: {
            fullName: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            professionalId: string | null;
            specialty: string | null;
            avatarUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
    } & {
        email: string;
        status: import(".prisma/client").$Enums.AccountStatus;
        id: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
    }) | null>;
    update(id: string, data: {
        status?: AccountStatus;
        plan?: SubscriptionPlan;
        subscriptionEndsAt?: Date;
        role?: UserRole;
    }): Promise<{
        email: string;
        status: import(".prisma/client").$Enums.AccountStatus;
        id: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
    }>;
    updatePlan(userId: string, plan: SubscriptionPlan, days?: number): Promise<{
        email: string;
        status: import(".prisma/client").$Enums.AccountStatus;
        id: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
    }>;
    resetUnpaidPlans(): Promise<{
        updatedCount: number;
        message: string;
    }>;
    countNutritionists(): Promise<number>;
}
