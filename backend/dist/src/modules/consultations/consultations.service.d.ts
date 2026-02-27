import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { CacheService } from '../../common/services/cache.service';
export declare class ConsultationsService {
    private prisma;
    private cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
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
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        patientId: string;
    }>;
    findAll(nutritionistId: string, page?: number, limit?: number, search?: string, patientId?: string, type?: 'CLINICAL' | 'METRIC' | 'ALL'): Promise<{
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
            metrics: import("@prisma/client/runtime/library").JsonValue | null;
            patientId: string;
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
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        patientId: string;
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
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        patientId: string;
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
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        patientId: string;
    }>;
}
