import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
export declare class PatientsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(nutritionistId: string, createPatientDto: CreatePatientDto): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        fullName: string;
        phone: string | null;
        nutritionistId: string;
        documentId: string | null;
        birthDate: Date | null;
        gender: string | null;
        height: number | null;
        weight: number | null;
        dietRestrictions: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(nutritionistId: string, page?: number, limit?: number, search?: string): Promise<{
        data: {
            id: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            fullName: string;
            phone: string | null;
            nutritionistId: string;
            documentId: string | null;
            birthDate: Date | null;
            gender: string | null;
            height: number | null;
            weight: number | null;
            dietRestrictions: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    findOne(nutritionistId: string, id: string): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        fullName: string;
        phone: string | null;
        nutritionistId: string;
        documentId: string | null;
        birthDate: Date | null;
        gender: string | null;
        height: number | null;
        weight: number | null;
        dietRestrictions: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(nutritionistId: string, id: string, updatePatientDto: UpdatePatientDto): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        fullName: string;
        phone: string | null;
        nutritionistId: string;
        documentId: string | null;
        birthDate: Date | null;
        gender: string | null;
        height: number | null;
        weight: number | null;
        dietRestrictions: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(nutritionistId: string, id: string): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        fullName: string;
        phone: string | null;
        nutritionistId: string;
        documentId: string | null;
        birthDate: Date | null;
        gender: string | null;
        height: number | null;
        weight: number | null;
        dietRestrictions: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
