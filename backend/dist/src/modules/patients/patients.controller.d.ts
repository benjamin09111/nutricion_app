import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    create(req: any, createPatientDto: CreatePatientDto): Promise<{
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
    }>;
    findAll(req: any, page?: string, limit?: string, search?: string): Promise<{
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
        }[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    findOne(req: any, id: string): Promise<{
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
    }>;
    update(req: any, id: string, updatePatientDto: UpdatePatientDto): Promise<{
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
    }>;
    remove(req: any, id: string): Promise<{
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
    }>;
}
