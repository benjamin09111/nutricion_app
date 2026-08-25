import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RatingsService', () => {
  let service: RatingsService;

  const mockRatingsStore: any[] = [];

  const mockPrismaService = {
    account: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        return Promise.resolve({ id: where.id, createdAt: threeDaysAgo });
      }),
    },
    appRating: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          mockRatingsStore.find((r) => r.accountId === where.accountId) || null,
        );
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const newRating = {
          id: `rating-${mockRatingsStore.length + 1}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockRatingsStore.push(newRating);
        return Promise.resolve(newRating);
      }),
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve([...mockRatingsStore]);
      }),
    },
  };

  beforeEach(async () => {
    mockRatingsStore.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns hasRated false when account has no rating', async () => {
    const status = await service.getStatus('acc-1');
    expect(status.hasRated).toBe(false);
    expect(status.eligibleForAutoPrompt).toBe(true);
    expect(status.rating).toBeNull();
  });

  it('creates a rating and updates status', async () => {
    const created = await service.createRating('acc-1', { stars: 5, comment: 'Excelente plataforma' });
    expect(created.success).toBe(true);
    expect(created.rating.stars).toBe(5);

    const status = await service.getStatus('acc-1');
    expect(status.hasRated).toBe(true);
  });

  it('prevents duplicate rating for the same account', async () => {
    await service.createRating('acc-1', { stars: 4 });
    await expect(service.createRating('acc-1', { stars: 5 })).rejects.toThrow(BadRequestException);
  });

  it('calculates average and distribution correctly', async () => {
    await service.createRating('acc-1', { stars: 5 });
    await service.createRating('acc-2', { stars: 4 });
    await service.createRating('acc-3', { stars: 5 });

    const stats = await service.getStats();
    expect(stats.totalCount).toBe(3);
    expect(stats.averageStars).toBe(4.7);
    expect(stats.distribution[5]).toBe(2);
    expect(stats.distribution[4]).toBe(1);
    expect(stats.distribution[1]).toBe(0);
  });
});
