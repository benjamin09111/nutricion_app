import { MembershipsService } from './memberships.service';

describe('MembershipsService', () => {
  it('returns active and coming soon plans for landing page', async () => {
    const prisma = {
      membershipPlan: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'free',
            name: 'Freemium',
            slug: 'free',
            price: { toString: () => '0' },
            features: [],
            isComingSoon: false,
            isActive: true,
          },
          {
            id: 'plus',
            name: 'Plus',
            slug: 'plus',
            price: { toString: () => '19990' },
            features: [],
            isComingSoon: false,
            isActive: true,
          },
          {
            id: 'pro',
            name: 'Pro',
            slug: 'pro',
            price: { toString: () => '39990' },
            features: [],
            isComingSoon: true,
            isActive: false,
          },
        ]),
      },
    } as any;
    const service = new MembershipsService(prisma);

    const plans = await service.findActive();

    expect(prisma.membershipPlan.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ isActive: true }, { isComingSoon: true }],
      },
      orderBy: { displayOrder: 'asc' },
    });
    expect(plans.map((plan) => plan.slug)).toEqual(['free', 'plus', 'pro']);
  });
});
