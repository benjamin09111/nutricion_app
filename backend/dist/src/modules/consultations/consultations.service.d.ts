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
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
        description: string | null;
        title: string;
        date: Date;
        patientId: string;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(nutritionistId: string, page?: number, limit?: number, search?: string, patientId?: string): Promise<{
        data: {
            patientName: string;
            patient: {
                fullName: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            nutritionistId: string;
            description: string | null;
            title: string;
            date: Date;
            patientId: string;
            metrics: import("@prisma/client/runtime/library").JsonValue | null;
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
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
        description: string | null;
        title: string;
        date: Date;
        patientId: string;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(nutritionistId: string, id: string, updateConsultationDto: UpdateConsultationDto): Promise<{
        patient: {
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
        description: string | null;
        title: string;
        date: Date;
        patientId: string;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    private syncPatientData;
    remove(nutritionistId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
        description: string | null;
        title: string;
        date: Date;
        patientId: string;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
