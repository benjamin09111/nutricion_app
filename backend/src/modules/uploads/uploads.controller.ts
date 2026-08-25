import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';
import { verifyFileSignature } from '../../common/utils/magic-bytes.util';
import { StorageService } from '../../common/services/storage.service';

@Controller('uploads')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req: any, file: any, callback: any) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
        ];
        const hasValidExt = Boolean(
          file.originalname?.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i),
        );
        if (!allowedMimeTypes.includes(file.mimetype) || !hasValidExt) {
          return callback(
            new BadRequestException(
              'Solo se permiten imágenes (JPG, PNG, WEBP, GIF) y documentos PDF',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    if (!this.storageService.isConfigured()) {
      throw new ServiceUnavailableException(
        'El almacenamiento de archivos no está configurado en el servidor.',
      );
    }

    // Strict Magic Bytes Verification (Binary Header Check)
    const signatureCheck = verifyFileSignature(file.buffer);
    if (!signatureCheck.valid) {
      throw new BadRequestException(
        'El archivo subido ha sido rechazado: el contenido binario no coincide con un formato de imagen o PDF válido',
      );
    }

    // Secure UUID filename to prevent path traversal or unguessable enumerations
    const fileExtension = extname(file.originalname).toLowerCase() || '.bin';
    const secureFilename = `${randomUUID()}${fileExtension}`;

    const url = await this.storageService.upload({
      path: secureFilename,
      body: file.buffer,
      contentType: signatureCheck.detectedType || file.mimetype,
    });

    return {
      url,
      filename: secureFilename,
    };
  }
}
