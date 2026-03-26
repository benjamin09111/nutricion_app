import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
export declare class ConsultationsController {
    private readonly consultationsService;
    constructor(consultationsService: ConsultationsService);
    create(req: any, createConsultationDto: CreateConsultationDto): Promise<{
        patient: {
            fullName: string;
        };
    } & {
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        date: Date;
        patientId: string;
        title: string;
    }>;
    findAll(req: any, page?: string, limit?: string, search?: string, patientId?: string, type?: 'CLINICAL' | 'METRIC' | 'ALL'): Promise<{
        data: {
            patientName: string;
            patient: {
                fullName: string;
            };
            nutritionistId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            metrics: import("@prisma/client/runtime/library").JsonValue | null;
            date: Date;
            patientId: string;
            title: string;
        }[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    findOne(req: any, id: string): Promise<{
        patientName: string;
        patient: {
            fullName: string;
        };
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        date: Date;
        patientId: string;
        title: string;
    }>;
    update(req: any, id: string, updateConsultationDto: UpdateConsultationDto): Promise<{
        patient: {
            fullName: string;
        };
    } & {
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        date: Date;
        patientId: string;
        title: string;
    }>;
    remove(req: any, id: string): Promise<{
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        date: Date;
        patientId: string;
        title: string;
    }>;
}
