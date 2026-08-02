import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { PermissionsService } from '../permissions/permissions.service';
import { Reflector } from '@nestjs/core';

describe('TagsController', () => {
  let controller: TagsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        {
          provide: TagsService,
          useValue: {
            findAll: jest.fn(),
            findOrCreate: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            ensureAccess: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<TagsController>(TagsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
