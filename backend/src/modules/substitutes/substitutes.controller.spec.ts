import { Test, TestingModule } from '@nestjs/testing';
import { SubstitutesController } from './substitutes.controller';
import { SubstitutesService } from './substitutes.service';
import { PermissionsService } from '../permissions/permissions.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('SubstitutesController', () => {
  let controller: SubstitutesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubstitutesController],
      providers: [
        { provide: SubstitutesService, useValue: {} },
        { provide: PermissionsService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SubstitutesController>(SubstitutesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
