import { MembershipsService } from './memberships.service';

describe('MembershipsService', () => {
  it('returns Freemium and Plus while excluding inactive legacy Pro', async () => {
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
          },
          {
            id: 'plus',
            name: 'Plus',
            slug: 'plus',
            price: { toString: () => '19990' },
            features: [],
            isComingSoon: false,
          },
        ]),
      },
    } as any;
    const service = new MembershipsService(prisma);

    const plans = await service.findActive();

    expect(prisma.membershipPlan.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        NOT: [
          { slug: { mode: 'insensitive', equals: 'pro' } },
          { name: { mode: 'insensitive', equals: 'pro' } },
          { price: 39990 },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });
    expect(plans.map((plan) => plan.slug)).toEqual(['free', 'plus']);
  });
});
