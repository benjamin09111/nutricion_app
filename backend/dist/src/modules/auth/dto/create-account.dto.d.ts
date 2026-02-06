import { UserRole } from '@prisma/client';
export declare class CreateAccountDto {
    email: string;
    fullName?: string;
    role?: UserRole;
}
