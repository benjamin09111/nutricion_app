import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountStatus, SubscriptionPlan } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.account.findMany({
            include: {
                nutritionist: {
                    select: {
                        fullName: true,
                        phone: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.account.findUnique({
            where: { id },
            include: { nutritionist: true }
        });
    }

    async update(id: string, data: { status?: AccountStatus; plan?: SubscriptionPlan; subscriptionEndsAt?: Date }) {
        return this.prisma.account.update({
            where: { id },
            data: {
                status: data.status,
                plan: data.plan,
                subscriptionEndsAt: data.subscriptionEndsAt,
            },
        });
    }
}
