import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<({
        nutritionist: {
            fullName: string;
            phone: string | null;
        } | null;
    } & {
        id: string;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    update(id: string, body: any): Promise<{
        id: string;
        email: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.AccountStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
