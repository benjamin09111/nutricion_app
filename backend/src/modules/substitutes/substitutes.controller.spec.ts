import { Test, TestingModule } from '@nestjs/testing';
import { SubstitutesController } from './substitutes.controller';

describe('SubstitutesController', () => {
  let controller: SubstitutesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubstitutesController],
    }).compile();

    controller = module.get<SubstitutesController>(SubstitutesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
