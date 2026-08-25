import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

/**
 * `resolveObjectPath` es un límite de seguridad: convierte una URL entregada por
 * el cliente en una ruta dentro de nuestro bucket, en lugar de dejar que esa URL
 * se use tal cual para una petición saliente.
 */
describe('StorageService.resolveObjectPath', () => {
  const buildService = (bucket = 'uploads') => {
    const config = {
      get: (key: string) =>
        ({
          SUPABASE_URL: 'https://project.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
          SUPABASE_STORAGE_BUCKET: bucket,
        })[key],
    } as unknown as ConfigService;

    const service = new StorageService(config);
    service.onModuleInit();
    return service;
  };

  it('extrae la ruta del objeto de una URL pública del bucket', () => {
    const service = buildService();

    expect(
      service.resolveObjectPath(
        'https://project.supabase.co/storage/v1/object/public/uploads/abc-123.pdf',
      ),
    ).toBe('abc-123.pdf');
  });

  it('acepta una ruta de objeto desnuda', () => {
    expect(buildService().resolveObjectPath('abc-123.pdf')).toBe('abc-123.pdf');
  });

  it('rechaza rutas con traversal', () => {
    const service = buildService();

    expect(
      service.resolveObjectPath(
        'https://project.supabase.co/storage/v1/object/public/uploads/../../secret',
      ),
    ).toBeNull();
    expect(service.resolveObjectPath('../../etc/passwd')).toBeNull();
  });

  it('rechaza valores vacíos', () => {
    const service = buildService();

    expect(service.resolveObjectPath('')).toBeNull();
    expect(service.resolveObjectPath('https://evil.example/')).toBeNull();
  });

  it('rechaza una URL que apunta a otro bucket', () => {
    const service = buildService('recursos');

    expect(
      service.resolveObjectPath(
        'https://project.supabase.co/storage/v1/object/public/otro/abc.pdf',
      ),
    ).toBeNull();
  });

  it('reporta que no está configurado si faltan las credenciales', () => {
    const config = {
      get: () => undefined,
    } as unknown as ConfigService;

    const service = new StorageService(config);
    service.onModuleInit();

    expect(service.isConfigured()).toBe(false);
  });
});
