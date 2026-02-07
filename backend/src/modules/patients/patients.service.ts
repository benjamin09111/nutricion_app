import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
    constructor(private prisma: PrismaService) { }

    async create(nutritionistId: string, createPatientDto: CreatePatientDto) {
        return this.prisma.patient.create({
            data: {
                ...createPatientDto,
                nutritionistId,
            },
        });
    }

    async findAll(nutritionistId: string, page: number = 1, limit: number = 20, search?: string) {
        const skip = (page - 1) * limit;

        const where: any = {
            nutritionistId,
        };

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [total, data] = await Promise.all([
            this.prisma.patient.count({ where }),
            this.prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async findOne(nutritionistId: string, id: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
        });

        if (!patient) {
            throw new NotFoundException('Paciente no encontrado');
        }

        // IDOR PROTECTION: Ensure the patient belongs to the requesting nutritionist
        if (patient.nutritionistId !== nutritionistId) {
            throw new ForbiddenException('No tienes permiso para acceder a este paciente');
        }

        return patient;
    }

    async update(nutritionistId: string, id: string, updatePatientDto: UpdatePatientDto) {
        // Run check ownership first
        await this.findOne(nutritionistId, id);

        return this.prisma.patient.update({
            where: { id },
            data: updatePatientDto,
        });
    }

    async remove(nutritionistId: string, id: string) {
        // Run check ownership first
        await this.findOne(nutritionistId, id);

        return this.prisma.patient.delete({
            where: { id },
        });
    }
}
