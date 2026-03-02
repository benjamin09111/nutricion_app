import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { MailService } from '../mail/mail.service';
import { UserRole } from '@prisma/client';
export declare class AuthService {
    private prisma;
    private jwtService;
    private mailService;
    constructor(prisma: PrismaService, jwtService: JwtService, mailService: MailService);
    createAccount(email: string, role: UserRole, fullName?: string, adminMessage?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            nutritionist: {
                fullName: string;
                phone: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                accountId: string;
                professionalId: string | null;
                specialty: string | null;
                avatarUrl: string | null;
                settings: import("@prisma/client/runtime/library").JsonValue | null;
            } | null;
        };
    }>;
    validateUser(payload: any): Promise<({
        nutritionist: {
            fullName: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            professionalId: string | null;
            specialty: string | null;
            avatarUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
    } & {
        email: string;
        status: import(".prisma/client").$Enums.AccountStatus;
        id: string;
        password: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        subscriptionEndsAt: Date | null;
    }) | null>;
    resetAccountPassword(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
