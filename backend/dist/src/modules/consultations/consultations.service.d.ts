import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
export declare class ConsultationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(nutritionistId: string, createConsultationDto: CreateConsultationDto): Promise<{
        patient: {
            fullName: string;
        };
    } & {
        id: string;
        date: Date;
        title: string;
        description: string | null;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        nutritionistId: string;
    }>;
    findAll(nutritionistId: string, page?: number, limit?: number, search?: string, patientId?: string): Promise<{
        data: {
            patientName: string;
            patient: {
                fullName: string;
            };
            id: string;
            date: Date;
            title: string;
            description: string | null;
            metrics: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
            patientId: string;
            nutritionistId: string;
        }[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    findOne(nutritionistId: string, id: string): Promise<{
        patientName: string;
        patient: {
            fullName: string;
        };
        id: string;
        date: Date;
        title: string;
        description: string | null;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        nutritionistId: string;
    }>;
    update(nutritionistId: string, id: string, updateConsultationDto: UpdateConsultationDto): Promise<{
        patient: {
            fullName: string;
        };
    } & {
        id: string;
        date: Date;
        title: string;
        description: string | null;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        nutritionistId: string;
    }>;
    private syncPatientData;
    remove(nutritionistId: string, id: string): Promise<{
        id: string;
        date: Date;
        title: string;
        description: string | null;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        nutritionistId: string;
    }>;
}
