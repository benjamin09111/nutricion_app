import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';
import { verifyFileSignature } from '../../common/utils/magic-bytes.util';

@Controller('uploads')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class UploadsController {
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
  uploadFile(@UploadedFile() file: any, @Request() req: any) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No se recibió ningún archivo');
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

    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, secureFilename);
    writeFileSync(filePath, file.buffer);

    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = process.env.API_URL
      ? null
      : Array.isArray(forwardedProto)
        ? forwardedProto[0]
        : forwardedProto || req.protocol || 'http';
    const host = req.get?.('host') || req.headers.host;
    const baseUrl = process.env.API_URL || `${protocol}://${host}`;
    const url = `${baseUrl}/uploads/${secureFilename}`;

    return {
      url,
      filename: secureFilename,
    };
  }
}
