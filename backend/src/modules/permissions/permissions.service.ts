import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EntitlementMap,
  isStaffRole,
  normalizeEntitlementMap,
  SPECIAL_FEATURES,
} from './permissions.constants';
import {
  getMembershipPlanEntitlementsFromPlan,
  getMembershipPlanKey,
  normalizeMembershipPlanKey,
} from '../memberships/plan-entitlements';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE', 'TRIALING']);

const isSubscriptionSelectable = (account: {
  role: string;
  subscription: { status: string; endDate: Date | null } | null;
}) => {
  if (isStaffRole(account.role)) {
    return true;
  }

  const subscription = account.subscription;
  if (!subscription || !subscription.endDate) {
    return false;
  }

  const endDate = new Date(subscription.endDate);
  return (
    endDate.getTime() > Date.now() &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
  );
};

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  private async getAccountAccess(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!account) {
      return null;
    }

    const currentPlan = account.subscription?.plan
      ? {
          id: account.subscription.plan.id,
          name: account.subscription.plan.name,
          slug: account.subscription.plan.slug,
          key: getMembershipPlanKey(account.subscription.plan),
          price: Number(account.subscription.plan.price),
          features: account.subscription.plan.features,
          entitlements: normalizeEntitlementMap(
            (account.subscription.plan as any).entitlements ||
              getMembershipPlanEntitlementsFromPlan(account.subscription.plan),
          ),
        }
      : null;

    const requiresPlanSelection = !isSubscriptionSelectable({
      role: account.role,
      subscription: account.subscription
        ? {
            status: account.subscription.status,
            endDate: account.subscription.endDate,
          }
        : null,
    });

    return {
      account,
      role: account.role,
      currentPlan,
      requiresPlanSelection,
      entitlements: this.buildEntitlements(account, currentPlan),
    };
  }

  private buildEntitlements(
    account: any,
    currentPlan: {
      slug: string;
      key?: string;
      entitlements: EntitlementMap;
    } | null,
  ): EntitlementMap {
    if (isStaffRole(account.role)) {
      return { [SPECIAL_FEATURES.MEMBERSHIP_SELECTED]: true };
    }

    if (!currentPlan || !isSubscriptionSelectable(account)) {
      return {};
    }

    return {
      [SPECIAL_FEATURES.MEMBERSHIP_SELECTED]: true,
      ...currentPlan.entitlements,
    };
  }

  async getAccessSnapshot(accountId: string) {
    const snapshot = await this.getAccountAccess(accountId);

    if (!snapshot) {
      return null;
    }

    const { account, currentPlan, requiresPlanSelection, entitlements } =
      snapshot;

    return {
      accountPlan: account.plan,
      role: account.role,
      currentPlanKey: currentPlan ? currentPlan.key || null : null,
      requiresPlanSelection,
      currentPlan,
      entitlements,
      subscription: account.subscription
        ? {
            status: account.subscription.status,
            startDate: account.subscription.startDate,
            endDate: account.subscription.endDate,
            cancelAtPeriodEnd: account.subscription.cancelAtPeriodEnd,
            canceledAt: account.subscription.canceledAt,
            planId: account.subscription.planId,
            planName: account.subscription.plan?.name || null,
            planSlug: account.subscription.plan?.slug || null,
            planKey: account.subscription.plan
              ? normalizeMembershipPlanKey(
                  account.subscription.plan.slug ||
                    account.subscription.plan.name ||
                    '',
                )
              : null,
            planPrice: account.subscription.plan
              ? Number(account.subscription.plan.price)
              : null,
          }
        : null,
    };
  }

  /**
   * Source of Truth for Feature Verification.
   * Admins always pass. Otherwise, require an active/selected plan and then
   * check the plan's entitlement map.
   */
  async checkFeatureAccess(
    accountId: string,
    featureKey: string,
  ): Promise<boolean> {
    const snapshot = await this.getAccountAccess(accountId);

    if (!snapshot) return false;

    const { account, entitlements } = snapshot;

    if (isStaffRole(account.role)) {
      return true;
    }

    if (featureKey === SPECIAL_FEATURES.MEMBERSHIP_SELECTED) {
      return snapshot.requiresPlanSelection === false;
    }

    return entitlements[featureKey] === true;
  }

  async getFeatureLimit(accountId: string, limitKey: string): Promise<number> {
    const snapshot = await this.getAccountAccess(accountId);

    if (!snapshot) return 0;
    if (isStaffRole(snapshot.role)) return Infinity;

    const value = snapshot.entitlements[limitKey];
    if (typeof value !== 'number') return 0;
    return value < 0 ? Infinity : value;
  }

  async ensureWithinLimit(
    accountId: string,
    limitKey: string,
    currentUsage: number,
  ) {
    const limit = await this.getFeatureLimit(accountId, limitKey);

    if (limit === Infinity) {
      return;
    }

    if (currentUsage >= limit) {
      throw new ForbiddenException(
        `Su plan actual alcanzó el límite de ${limitKey}`,
      );
    }
  }

  async ensureAccess(accountId: string, featureKey: string) {
    const hasAccess = await this.checkFeatureAccess(accountId, featureKey);
    if (!hasAccess) {
      throw new ForbiddenException(
        `Su plan actual no incluye la función: ${featureKey}`,
      );
    }
  }
}
