import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Request, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('uploads')
@UseGuards(AuthGuard)
export class UploadsController {
    @Post('image')
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
                if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                    return callback(new Error('Only image files are allowed!'), false);
                }
                callback(null, true);
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    uploadFile(@UploadedFile() file: any) {
        // Generate the public URL
        // In production, this should be the absolute URL or a cloud storage URL
        const baseUrl = process.env.API_URL || 'http://localhost:3001';
        return {
            url: `${baseUrl}/uploads/${file.filename}`,
            filename: file.filename,
        };
    }
}
