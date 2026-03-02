import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        account: {
            email: string;
            nutritionist: {
                fullName: string;
            } | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        idempotencyKey: string | null;
        paidAt: Date | null;
    })[]>;
    findRecent(limit?: number): Promise<({
        account: {
            nutritionist: {
                fullName: string;
            } | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        idempotencyKey: string | null;
        paidAt: Date | null;
    })[]>;
    createPayment(data: {
        accountId: string;
        amount: number;
        method: PaymentMethod;
        transactionId?: string;
        idempotencyKey?: string;
        metadata?: any;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        idempotencyKey: string | null;
        paidAt: Date | null;
    }>;
    getRevenueStats(): Promise<{
        totalLifetime: number | import("@prisma/client/runtime/library").Decimal;
        mrr: number | import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    simulatePayment(data: {
        userId: string;
        planId: string;
        amount?: number;
        method: PaymentMethod;
    }): Promise<{
        payment: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            method: import(".prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            idempotencyKey: string | null;
            paidAt: Date | null;
        };
        subscription: {
            id: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            planId: string;
            startDate: Date;
            endDate: Date | null;
            cancelAtPeriodEnd: boolean;
            canceledAt: Date | null;
        };
    }>;
}
