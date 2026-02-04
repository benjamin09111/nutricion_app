import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async createNutritionist(email: string) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new BadRequestException('Usuario ya existe con este correo');
        }

        // Generate secure random password
        // 8 bytes = 16 hex chars
        const password = crypto.randomBytes(8).toString('hex');

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        try {
            await this.prisma.user.create({
                data: {
                    email,
                    name: 'Nutricionista', // Default name
                    password: hashedPassword,
                    role: 'NUTRITIONIST',
                },
            });

            // MOCK EMAIL SERVICE
            // According to user request: "luego podremos enviarle correo a ese mismo correo"
            // We log it here so the developer can actually see it in this dev environment.
            console.log('=====================================================');
            console.log(`[EMAIL SERVICE MOCK] Credentials for ${email}`);
            console.log(`Password: ${password}`);
            console.log('=====================================================');

            return {
                success: true,
                message: 'Cuenta creada. Las credenciales han sido enviadas al correo especificado.',
            };
        } catch (error) {
            throw new BadRequestException('Error al crear el usuario. Inténtalo de nuevo.');
        }
    }

    async resetNutritionistPassword(email: string) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }

        // Generate secure random password
        const password = crypto.randomBytes(8).toString('hex');

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        try {
            await this.prisma.user.update({
                where: { email },
                data: { password: hashedPassword },
            });

            // MOCK EMAIL SERVICE
            console.log('=====================================================');
            console.log(`[EMAIL SERVICE MOCK] PASSWORD RESET for ${email}`);
            console.log(`New Password: ${password}`);
            console.log('=====================================================');

            return {
                success: true,
                message: 'Contraseña restablecida. Las nuevas credenciales han sido enviadas al correo especificado.',
            };
        } catch (error) {
            throw new BadRequestException('Error al restablecer la contraseña.');
        }
    }
}
