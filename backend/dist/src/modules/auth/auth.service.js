"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    mailService;
    constructor(prisma, jwtService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }
    async createAccount(email, role, fullName = 'Usuario') {
        const normalizedEmail = email.toLowerCase().trim();
        const existingAccount = await this.prisma.account.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingAccount) {
            throw new common_1.BadRequestException('La cuenta ya existe con este correo');
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
            await this.mailService.sendWelcomeEmail(email, fullName, password);
            return {
                success: true,
                message: 'Cuenta creada. Las credenciales han sido enviadas al correo especificado.',
            };
        }
        catch (error) {
            console.error('CRITICAL ERROR creating account:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Error interno al crear cuenta: ${error.message}`);
        }
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const normalizedEmail = email.toLowerCase().trim();
        const account = await this.prisma.account.findUnique({
            where: { email: normalizedEmail },
            include: { nutritionist: true },
        });
        if (!account || !account.password) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const isPasswordValid = await bcrypt.compare(password, account.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const payload = {
            email: account.email,
            sub: account.id,
            role: account.role,
            nutritionistId: account.nutritionist?.id
        };
        const signOptions = {
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
    async validateUser(payload) {
        return this.prisma.account.findUnique({
            where: { id: payload.sub },
            include: { nutritionist: true },
        });
    }
    async resetAccountPassword(email) {
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`[AuthService] Attempting to reset password for email: "${normalizedEmail}"`);
        const account = await this.prisma.account.findUnique({
            where: { email: normalizedEmail },
            include: { nutritionist: true },
        });
        if (!account) {
            console.error(`[AuthService] Reset failed: User not found for email "${email}"`);
            throw new common_1.BadRequestException('Usuario no encontrado');
        }
        console.log(`[AuthService] User found: ${account.id}, role: ${account.role}`);
        const password = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            await this.prisma.account.update({
                where: { email: normalizedEmail },
                data: { password: hashedPassword },
            });
            let greetingName = 'Usuario';
            if (account.nutritionist?.fullName) {
                greetingName = account.nutritionist.fullName;
            }
            else if (account.role === 'ADMIN_MASTER') {
                greetingName = 'Admin Master';
            }
            else if (['ADMIN', 'ADMIN_GENERAL'].includes(account.role)) {
                greetingName = 'Admin General';
            }
            await this.mailService.sendWelcomeEmail(email, greetingName, password);
            return {
                success: true,
                message: 'Contraseña restablecida. Las nuevas credenciales han sido enviadas al correo especificado.',
            };
        }
        catch (error) {
            console.error('Error resetting password:', error);
            throw new common_1.BadRequestException('Error al restablecer la contraseña.');
        }
    }
    async updatePassword(userId, updatePasswordDto) {
        const { currentPassword, newPassword } = updatePasswordDto;
        const account = await this.prisma.account.findUnique({
            where: { id: userId },
        });
        if (!account || !account.password) {
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, account.password);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('La contraseña actual es incorrecta');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map