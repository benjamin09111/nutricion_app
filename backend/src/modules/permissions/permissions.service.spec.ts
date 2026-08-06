import { PermissionsService } from './permissions.service';

describe('PermissionsService onboarding', () => {
  it('provisions Freemium without completing plan selection', async () => {
    const freePlan = {
      id: 'free-plan-id',
      name: 'Freemium',
      slug: 'free',
      price: 0,
      features: [],
      entitlements: {},
    };
    const newAccount = {
      id: 'account-id',
      role: 'NUTRITIONIST',
      plan: 'FREE',
      membershipSelectedAt: null,
      subscription: null,
      payments: [],
    };
    const provisionedAccount = {
      ...newAccount,
      subscription: {
        accountId: 'account-id',
        planId: freePlan.id,
        status: 'ACTIVE',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        plan: freePlan,
      },
    };
    const accountUpdate = jest.fn().mockResolvedValue(undefined);
    const subscriptionUpsert = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      account: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(newAccount)
          .mockResolvedValueOnce(provisionedAccount),
        findUniqueOrThrow: jest.fn().mockResolvedValue(provisionedAccount),
      },
      membershipPlan: {
        findFirst: jest.fn().mockResolvedValue(freePlan),
      },
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) =>
        callback({
          account: { update: accountUpdate },
          subscription: { upsert: subscriptionUpsert },
        }),
      ),
    };
    const service = new PermissionsService(prisma as never);

    const snapshot = await service.getAccessSnapshot('account-id');

    expect(accountUpdate).toHaveBeenCalledWith({
      where: { id: 'account-id' },
      data: {
        plan: 'FREE',
        subscriptionEndsAt: null,
      },
    });
    expect(subscriptionUpsert).toHaveBeenCalled();
    expect(snapshot?.currentPlanKey).toBe('free');
    expect(snapshot?.requiresPlanSelection).toBe(true);
    expect(snapshot?.entitlements).toBeDefined();
  });
});
