import { Test, TestingModule } from '@nestjs/testing';
import { FoodsService } from './foods.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';

describe('FoodsService', () => {
  let service: FoodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodsService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: CacheService,
          useValue: {
            invalidateNutritionistPrefix: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FoodsService>(FoodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
