import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    findAll(): Promise<({
        account: {
            nutritionist: {
                fullName: string;
            } | null;
            email: string;
        };
    } & {
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        method: import(".prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        idempotencyKey: string | null;
        paidAt: Date | null;
    })[]>;
    findRecent(limit: string): Promise<({
        account: {
            nutritionist: {
                fullName: string;
            } | null;
        };
    } & {
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        currency: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        method: import(".prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        idempotencyKey: string | null;
        paidAt: Date | null;
    })[]>;
    getStats(): Promise<{
        totalLifetime: number | import("@prisma/client/runtime/library").Decimal;
        mrr: number | import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    simulate(body: {
        userId: string;
        planId: string;
        amount?: number;
        method: string;
    }, req: any): Promise<{
        payment: {
            amount: import("@prisma/client/runtime/library").Decimal;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            method: import(".prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            idempotencyKey: string | null;
            paidAt: Date | null;
        };
        subscription: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            planId: string;
            startDate: Date;
            endDate: Date | null;
            cancelAtPeriodEnd: boolean;
            canceledAt: Date | null;
        };
    }>;
}
