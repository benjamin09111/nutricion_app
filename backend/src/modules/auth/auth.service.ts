import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { MailService } from '../mail/mail.service';

import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async createAccount(email: string, role: UserRole, fullName: string = 'Usuario', adminMessage?: string) {
        const normalizedEmail = email.toLowerCase().trim();
        const existingAccount = await this.prisma.account.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingAccount) {
            throw new BadRequestException('La cuenta ya existe con este correo');
        }

        const password = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            await this.prisma.$transaction(async (tx) => {
                const newAccount = await tx.account.create({
                    data: {
                        email: normalizedEmail,
                        password: hashedPassword,
                        role: role,
                    },
                });

                if (role === 'NUTRITIONIST') {
                    await tx.nutritionist.create({
                        data: {
                            accountId: newAccount.id,
                            fullName: fullName,
                        },
                    });
                }
            });

            // SEND REAL EMAIL
            await this.mailService.sendWelcomeEmail(email, fullName, password, adminMessage);

            return {
                success: true,
                message: 'Cuenta creada. Las credenciales han sido enviadas al correo especificado.',
            };
        } catch (error) {
            console.error('CRITICAL ERROR creating account:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Error interno al crear cuenta: ${error.message}`);
        }
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const normalizedEmail = email.toLowerCase().trim();
        const account = await this.prisma.account.findUnique({
            where: { email: normalizedEmail },
            include: { nutritionist: true },
        });

        if (!account || !account.password) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isPasswordValid = await bcrypt.compare(password, account.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!account.nutritionist) {
            console.warn(`[AuthService] Warning: Account ${account.email} has no Nutritionist record. Role: ${account.role}`);
        }

        const payload = {
            email: account.email,
            sub: account.id,
            role: account.role,
            nutritionistId: account.nutritionist?.id
        };

        const signOptions: any = {
            expiresIn: loginDto.rememberMe ? '30d' : '24h'
        };

        return {
            access_token: this.jwtService.sign(payload, signOptions),
            user: {
                id: account.id,
                email: account.email,
                role: account.role,
                nutritionist: account.nutritionist,
            },
        };
    }

    async validateUser(payload: any) {
        return this.prisma.account.findUnique({
            where: { id: payload.sub },
            include: { nutritionist: true },
        });
    }

    async resetAccountPassword(email: string) {
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`[AuthService] Attempting to reset password for email: "${normalizedEmail}"`);
        const account = await this.prisma.account.findUnique({
            where: { email: normalizedEmail },
            include: { nutritionist: true },
        });

        if (!account) {
            console.error(`[AuthService] Reset failed: User not found for email "${email}"`);
            throw new BadRequestException('Usuario no encontrado');
        }
        console.log(`[AuthService] User found: ${account.id}, role: ${account.role}`);

        const password = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            await this.prisma.account.update({
                where: { email: normalizedEmail },
                data: { password: hashedPassword },
            });

            // Determine greeting name
            let greetingName = 'Usuario';
            if (account.nutritionist?.fullName) {
                greetingName = account.nutritionist.fullName;
            } else if (account.role === 'ADMIN_MASTER') {
                greetingName = 'Admin Master';
            } else if (['ADMIN', 'ADMIN_GENERAL'].includes(account.role)) {
                greetingName = 'Admin General';
            }

            // Use specific password reset email
            await this.mailService.sendPasswordResetEmail(email, greetingName, password);

            return {
                success: true,
                message: 'Contraseña restablecida. Las nuevas credenciales han sido enviadas al correo especificado.',
            };
        } catch (error) {
            console.error('Error resetting password:', error);
            throw new BadRequestException('Error al restablecer la contraseña.');
        }
    }

    async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
        const { currentPassword, newPassword } = updatePasswordDto;

        const account = await this.prisma.account.findUnique({
            where: { id: userId },
        });

        if (!account || !account.password) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, account.password);

        if (!isPasswordValid) {
            throw new BadRequestException('La contraseña actual es incorrecta');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.account.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });

        return {
            success: true,
            message: 'Contraseña actualizada correctamente',
        };
    }
}
