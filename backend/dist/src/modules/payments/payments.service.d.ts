import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findRecent(limit?: number): Promise<({
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
    createPayment(data: {
        accountId: string;
        amount: number;
        method: PaymentMethod;
        transactionId?: string;
        idempotencyKey?: string;
        metadata?: any;
    }): Promise<{
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
