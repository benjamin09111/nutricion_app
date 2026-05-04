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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            fullName: string;
            professionalId: string | null;
            specialty: string | null;
            phone: string | null;
            avatarUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        lastLoginAt: Date | null;
    }) | null>;
    update(id: string, data: {
        status?: AccountStatus;
        plan?: SubscriptionPlan;
        subscriptionEndsAt?: Date;
        role?: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        lastLoginAt: Date | null;
    }>;
    updateMySettings(accountId: string, settingsData: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        fullName: string;
        professionalId: string | null;
        specialty: string | null;
        phone: string | null;
        avatarUrl: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updatePlan(userId: string, plan: SubscriptionPlan, days?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        lastLoginAt: Date | null;
    }>;
    resetUnpaidPlans(): Promise<{
        updatedCount: number;
        message: string;
    }>;
    softDelete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        lastLoginAt: Date | null;
    } | undefined>;
    countNutritionists(): Promise<number>;
}
