import { AuthService } from './auth.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            plan: import(".prisma/client").$Enums.SubscriptionPlan;
            planName: string;
            nutritionist: {
                id: string;
                fullName: string;
                phone: string | null;
                professionalId: string | null;
                specialty: string | null;
                createdAt: Date;
                updatedAt: Date;
                accountId: string;
                avatarUrl: string | null;
                settings: import("@prisma/client/runtime/library").JsonValue | null;
            } | null;
        };
    }>;
    createAccount(createAccountDto: CreateAccountDto, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    updatePassword(req: any, updatePasswordDto: UpdatePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
