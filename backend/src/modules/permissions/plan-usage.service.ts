import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from './permissions.service';

const LIFETIME_PERIOD_KEY = 'lifetime';
const PDF_EXPORT_FEATURE_KEY = 'pdf.exports.total.limit';
const DEDUPE_SEPARATOR = '::dedupe::';

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
    periodKey = LIFETIME_PERIOD_KEY,
  ) {
    try {
      const counters = await this.prisma.planUsageCounter.findMany({
        where: featureKey === PDF_EXPORT_FEATURE_KEY
          ? { accountId, periodKey, featureKey: { startsWith: featureKey } }
          : { accountId, periodKey, featureKey },
        select: { usageCount: true },
      });

      return counters.reduce((total, counter) => total + counter.usageCount, 0);
    } catch (error: any) {
      if (error?.code === 'P2021') {
        throw new InternalServerErrorException(
          'El sistema de cuotas no está disponible. Intenta nuevamente más tarde.',
        );
      }

      throw error;
    }
  }

  async consumeQuota(
    accountId: string,
    featureKey: string,
    amount = 1,
    periodKey = LIFETIME_PERIOD_KEY,
    dedupeKey?: string,
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
        if (dedupeKey?.trim()) {
          const keyedFeatureKey = `${featureKey}${DEDUPE_SEPARATOR}${dedupeKey.trim()}`;
          const inserted = await tx.planUsageCounter.createMany({
            data: { accountId, featureKey: keyedFeatureKey, periodKey, usageCount: amount },
            skipDuplicates: true,
          });
          const counters = await tx.planUsageCounter.findMany({
            where: featureKey === PDF_EXPORT_FEATURE_KEY
              ? { accountId, periodKey, featureKey: { startsWith: featureKey } }
              : { accountId, periodKey, featureKey },
            select: { usageCount: true },
          });
          const usageCount = counters.reduce(
            (total, counter) => total + counter.usageCount,
            0,
          );

          if (usageCount > limit) {
            throw new ForbiddenException(
              `Su plan actual alcanzó el límite de ${featureKey}`,
            );
          }

          return { usageCount, limit, deduplicated: inserted.count === 0 };
        }

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
        throw new InternalServerErrorException(
          'El sistema de cuotas no está disponible. Intenta nuevamente más tarde.',
        );
      }

      throw error;
    }
  }

  async ensureQuotaAvailable(
    accountId: string,
    featureKey: string,
    periodKey = LIFETIME_PERIOD_KEY,
  ) {
    const limit = await this.permissionsService.getFeatureLimit(accountId, featureKey);
    if (limit === Infinity) return;
    if (limit <= 0) {
      throw new ForbiddenException(`Su plan actual no incluye la cuota: ${featureKey}`);
    }
    const usage = await this.getUsage(accountId, featureKey, periodKey);
    if (usage >= limit) {
      throw new ForbiddenException(`Su plan actual alcanzó el límite de ${featureKey}`);
    }
  }

  async refundQuota(
    accountId: string,
    featureKey: string,
    amount = 1,
    periodKey = LIFETIME_PERIOD_KEY,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const counter = await tx.planUsageCounter.findUnique({
        where: {
          accountId_featureKey_periodKey: { accountId, featureKey, periodKey },
        },
      });
      if (!counter) return;

      const nextUsage = Math.max(0, counter.usageCount - amount);
      if (nextUsage === 0) {
        await tx.planUsageCounter.delete({ where: { id: counter.id } });
      } else {
        await tx.planUsageCounter.update({
          where: { id: counter.id },
          data: { usageCount: nextUsage },
        });
      }
    });
  }

  async consumeMonthlyQuota(
    accountId: string,
    featureKey: string,
    amount = 1,
    periodKey = toPeriodKey(),
    dedupeKey?: string,
  ) {
    return this.consumeQuota(accountId, featureKey, amount, periodKey, dedupeKey);
  }
}
