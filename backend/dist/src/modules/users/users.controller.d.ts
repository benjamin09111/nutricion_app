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
    update(id: string, body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
    }>;
    updatePlan(id: string, body: {
        plan: string;
        days?: number;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
    }>;
    resetUnpaidPlans(req: any): Promise<{
        updatedCount: number;
        message: string;
    }>;
}
