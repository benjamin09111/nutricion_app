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
    findAll(req: any, page?: string, limit?: string, search?: string, patientId?: string): Promise<{
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
    findOne(req: any, id: string): Promise<{
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
    update(req: any, id: string, updateConsultationDto: UpdateConsultationDto): Promise<{
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
    remove(req: any, id: string): Promise<{
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
