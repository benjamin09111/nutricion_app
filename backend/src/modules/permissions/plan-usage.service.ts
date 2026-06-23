import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from './permissions.service';

const toPeriodKey = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

@Injectable()
export class PlanUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async getUsage(
    accountId: string,
    featureKey: string,
    periodKey = toPeriodKey(),
  ) {
    try {
      const counter = await this.prisma.planUsageCounter.findUnique({
        where: {
          accountId_featureKey_periodKey: {
            accountId,
            featureKey,
            periodKey,
          },
        },
      });

      return counter?.usageCount ?? 0;
    } catch (error: any) {
      if (error?.code === 'P2021') {
        return 0;
      }

      throw error;
    }
  }

  async consumeMonthlyQuota(
    accountId: string,
    featureKey: string,
    amount = 1,
    periodKey = toPeriodKey(),
  ) {
    const limit = await this.permissionsService.getFeatureLimit(
      accountId,
      featureKey,
    );
    if (limit === Infinity) {
      return { usageCount: null, limit };
    }

    if (limit <= 0) {
      throw new ForbiddenException(
        `Su plan actual no incluye la cuota: ${featureKey}`,
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const counter = await tx.planUsageCounter.upsert({
          where: {
            accountId_featureKey_periodKey: {
              accountId,
              featureKey,
              periodKey,
            },
          },
          update: {
            usageCount: { increment: amount },
          },
          create: {
            accountId,
            featureKey,
            periodKey,
            usageCount: amount,
          },
        });

        if (counter.usageCount > limit) {
          throw new ForbiddenException(
            `Su plan actual alcanzó el límite de ${featureKey}`,
          );
        }

        return { usageCount: counter.usageCount, limit };
      });
    } catch (error: any) {
      if (error?.code === 'P2021') {
        return { usageCount: null, limit };
      }

      throw error;
    }
  }
}
