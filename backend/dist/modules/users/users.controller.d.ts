import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    countNutritionists(): Promise<{
        count: number;
    }>;
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
    updateMySettings(req: any, body: any): Promise<{
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
    update(id: string, body: any, req: any): Promise<{
        id: string;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        createdAt: Date;
        updatedAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        lastLoginAt: Date | null;
    }>;
    updatePlan(id: string, body: {
        plan: string;
        days?: number;
    }, req: any): Promise<{
        id: string;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        createdAt: Date;
        updatedAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        lastLoginAt: Date | null;
    }>;
    resetUnpaidPlans(req: any): Promise<{
        updatedCount: number;
        message: string;
    }>;
    softDelete(id: string, req: any): Promise<{
        id: string;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        createdAt: Date;
        updatedAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        lastLoginAt: Date | null;
    } | undefined>;
}
