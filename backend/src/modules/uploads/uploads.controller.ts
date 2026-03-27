import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Request, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('uploads')
@UseGuards(AuthGuard)
export class UploadsController {
    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req: any, file: any, callback: any) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req: any, file: any, callback: any) => {
                if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/)) {
                    return callback(new Error('Only image and PDF files are allowed!'), false);
                }
                callback(null, true);
            },
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB for PDFs
            },
        }),
    )
    uploadFile(@UploadedFile() file: any) {
        const baseUrl = process.env.API_URL || 'http://localhost:3001';
        return {
            url: `${baseUrl}/uploads/${file.filename}`,
            filename: file.filename,
        };
    }
}
