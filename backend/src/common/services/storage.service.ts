import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Wrapper around Supabase Storage.
 *
 * Uploads used to be written to `process.cwd()/uploads`, which is lost on every
 * deploy on an ephemeral filesystem and was never served back to clients. All
 * binary assets now live in a Supabase bucket instead.
 *
 * The service_role key is used here (server-side only) so the API keeps full
 * control over validation and permissions before anything reaches the bucket.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: SupabaseClient | null = null;
  private bucket = '';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'uploads';

    if (!url || !serviceRoleKey) {
      this.logger.warn(
        'SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas: la subida de archivos quedará deshabilitada.',
      );
      return;
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  isConfigured() {
    return this.client !== null;
  }

  private requireClient(): SupabaseClient {
    if (!this.client) {
      throw new Error(
        'El almacenamiento de archivos no está configurado en el servidor.',
      );
    }
    return this.client;
  }

  async upload(params: {
    path: string;
    body: Buffer;
    contentType: string;
  }): Promise<string> {
    const { data, error } = await this.requireClient()
      .storage.from(this.bucket)
      .upload(params.path, params.body, {
        contentType: params.contentType,
        upsert: false,
      });

    if (error || !data) {
      this.logger.error(`Supabase upload failed: ${error?.message}`);
      throw new Error('No se pudo guardar el archivo.');
    }

    return this.getPublicUrl(data.path);
  }

  getPublicUrl(path: string): string {
    const { data } = this.requireClient()
      .storage.from(this.bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Resolves a stored object path from a URL previously produced by
   * `upload()`. Returns null when the URL does not belong to our bucket, so
   * callers never turn a user-supplied URL into an arbitrary outbound request.
   */
  resolveObjectPath(fileUrl: string): string | null {
    if (!fileUrl) return null;

    let objectPath: string;

    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(fileUrl)) {
      // URL absoluta: sólo se acepta si apunta al bucket público propio. Ojo:
      // `new URL` normaliza los `..`, por eso la pertenencia al bucket se
      // comprueba sobre el pathname ya normalizado y no sobre el original.
      let pathname: string;
      try {
        pathname = decodeURIComponent(new URL(fileUrl).pathname);
      } catch {
        return null;
      }

      const marker = `/object/public/${this.bucket}/`;
      const markerIndex = pathname.indexOf(marker);
      if (markerIndex < 0) return null;

      objectPath = pathname.slice(markerIndex + marker.length);
    } else {
      // Ruta de objeto desnuda, tal como la devuelve `upload()`.
      objectPath = fileUrl.replace(/^\/+/, '');
    }

    if (!objectPath || objectPath.split('/').includes('..')) {
      return null;
    }

    return objectPath;
  }

  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.requireClient()
      .storage.from(this.bucket)
      .download(path);

    if (error || !data) {
      this.logger.error(`Supabase download failed: ${error?.message}`);
      throw new Error('El archivo no se encuentra en el almacenamiento.');
    }

    return Buffer.from(await data.arrayBuffer());
  }
}
