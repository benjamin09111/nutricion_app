import { Test, TestingModule } from '@nestjs/testing';
import { DiscountCodesService } from './discount-codes.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountCodeType } from '@prisma/client';

describe('DiscountCodesService', () => {
  let service: DiscountCodesService;
  let prisma: {
    discountCode: {
      findUnique: jest.Mock;
      createMany: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      discountCode: {
        findUnique: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountCodesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DiscountCodesService>(DiscountCodesService);
  });

  it('should generate PROMO_30 codes with 30% discount', async () => {
    await service.generateCodes(
      'PROMO_30' as DiscountCodeType,
      1,
      'admin-id-1',
    );

    expect(prisma.discountCode.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: 'PROMO_30',
          discountPercent: 30,
          createdByAdminId: 'admin-id-1',
        }),
      ],
    });
  });

  it('should generate PROMO_15 codes with 15% discount', async () => {
    await service.generateCodes(
      'PROMO_15' as DiscountCodeType,
      1,
      'admin-id-1',
    );

    expect(prisma.discountCode.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: 'PROMO_15',
          discountPercent: 15,
          createdByAdminId: 'admin-id-1',
        }),
      ],
    });
  });

  it('should generate NUTRI codes with 50% discount', async () => {
    await service.generateCodes(
      DiscountCodeType.NUTRI,
      1,
      'admin-id-1',
    );

    expect(prisma.discountCode.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: DiscountCodeType.NUTRI,
          discountPercent: 50,
        }),
      ],
    });
  });

  it('should generate BETA codes with 90% discount', async () => {
    await service.generateCodes(
      DiscountCodeType.BETA,
      1,
      'admin-id-1',
    );

    expect(prisma.discountCode.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: DiscountCodeType.BETA,
          discountPercent: 90,
        }),
      ],
    });
  });
});
