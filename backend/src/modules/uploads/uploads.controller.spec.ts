import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from './uploads.controller';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PermissionsService } from '../permissions/permissions.service';
import { StorageService } from '../../common/services/storage.service';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

describe('UploadsController', () => {
  let controller: UploadsController;
  let storage: { isConfigured: jest.Mock; upload: jest.Mock };

  // %PDF- header followed by padding, so verifyFileSignature accepts it.
  const pdfBuffer = Buffer.concat([
    Buffer.from('%PDF-1.7'),
    Buffer.alloc(16, 0x20),
  ]);

  beforeEach(async () => {
    storage = {
      isConfigured: jest.fn().mockReturnValue(true),
      upload: jest.fn().mockResolvedValue('https://cdn.test/object/file.pdf'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        { provide: Reflector, useValue: { get: jest.fn() } },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PermissionsService, useValue: {} },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('sube el archivo al storage y devuelve su URL pública', async () => {
    const result = await controller.uploadFile({
      buffer: pdfBuffer,
      originalname: 'guia.pdf',
      mimetype: 'application/pdf',
    });

    expect(result.url).toBe('https://cdn.test/object/file.pdf');
    expect(result.filename).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    // El nombre original nunca se usa como ruta de destino.
    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: 'application/pdf',
        path: expect.not.stringContaining('guia'),
      }),
    );
  });

  it('rechaza contenido que no coincide con la extensión declarada', async () => {
    await expect(
      controller.uploadFile({
        buffer: Buffer.alloc(32, 0x41),
        originalname: 'malicioso.pdf',
        mimetype: 'application/pdf',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('falla de forma explícita si el storage no está configurado', async () => {
    storage.isConfigured.mockReturnValue(false);

    await expect(
      controller.uploadFile({
        buffer: pdfBuffer,
        originalname: 'guia.pdf',
        mimetype: 'application/pdf',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
