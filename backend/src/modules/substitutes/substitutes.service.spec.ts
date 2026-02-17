import { Test, TestingModule } from '@nestjs/testing';
import { SubstitutesService } from './substitutes.service';

describe('SubstitutesService', () => {
  let service: SubstitutesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubstitutesService],
    }).compile();

    service = module.get<SubstitutesService>(SubstitutesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
