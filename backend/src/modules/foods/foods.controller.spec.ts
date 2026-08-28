import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { PermissionsService } from '../permissions/permissions.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('FoodsController', () => {
  let controller: FoodsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodsController],
      providers: [
        { provide: FoodsService, useValue: {} },
        { provide: CACHE_MANAGER, useValue: {} },
        { provide: Reflector, useValue: { get: jest.fn() } },
        { provide: PermissionsService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<FoodsController>(FoodsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
