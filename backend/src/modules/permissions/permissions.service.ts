import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Source of Truth for Feature Verification (Scalable Pattern)
   * Instead of if/else by role, WE CHECK BY FEATURE PROPERTY.
   */
  async checkFeatureAccess(
    accountId: string,
    featureKey: string,
  ): Promise<boolean> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!account) return false;

    // 1. ADMINT RULE: Admins get EVERYTHING
    if (['ADMIN_MASTER', 'ADMIN_GENERAL', 'ADMIN'].includes(account.role))
      return true;

    // 2. SUBSCRIPTION RULE: Active plan features
    const features = account.subscription?.plan?.features as Record<
      string,
      any
    >;
    if (features && features[featureKey] === true) return true;

    // 3. FALLBACK: Could use the high-level 'plan' enum from Account for basic legacy tiering
    // (Optional: Implement if legacy support is needed)

    return false;
  }

  /**
   * Get numeric limits for a specific feature (e.g., max patients)
   */
  async getFeatureLimit(accountId: string, limitKey: string): Promise<number> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        subscription: { include: { plan: true } },
      },
    });

    if (!account) return 0;
    if (['ADMIN_MASTER', 'ADMIN_GENERAL', 'ADMIN'].includes(account.role))
      return Infinity;

    const features = account.subscription?.plan?.features as Record<
      string,
      any
    >;
    return features && typeof features[limitKey] === 'number'
      ? features[limitKey]
      : 0;
  }

  /**
   * Utility to throw Exception if access is denied
   */
  async ensureAccess(accountId: string, featureKey: string) {
    const hasAccess = await this.checkFeatureAccess(accountId, featureKey);
    if (!hasAccess) {
      throw new ForbiddenException(
        `Su plan actual no incluye la función: ${featureKey}`,
      );
    }
  }
}
