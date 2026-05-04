import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    private readonly projectInclude;
    private validatePatientOwnership;
    private validateCreationOwnership;
    private validateOwnerships;
    create(nutritionistId: string, dto: CreateProjectDto): Promise<{
        patient: {
            id: string;
            email: string | null;
            fullName: string;
            height: number | null;
            weight: number | null;
            dietRestrictions: Prisma.JsonValue;
        } | null;
        activeCartCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDeliverableCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDietCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeRecipeCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
    } & {
        id: string;
        name: string;
        nutritionistId: string;
        mode: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        patientId: string | null;
        activeDietCreationId: string | null;
        activeRecipeCreationId: string | null;
        activeCartCreationId: string | null;
        activeDeliverableCreationId: string | null;
        metadata: Prisma.JsonValue | null;
    }>;
    findAll(nutritionistId: string, search?: string, status?: string): Promise<({
        patient: {
            id: string;
            email: string | null;
            fullName: string;
            height: number | null;
            weight: number | null;
            dietRestrictions: Prisma.JsonValue;
        } | null;
        activeCartCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDeliverableCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDietCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeRecipeCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
    } & {
        id: string;
        name: string;
        nutritionistId: string;
        mode: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        patientId: string | null;
        activeDietCreationId: string | null;
        activeRecipeCreationId: string | null;
        activeCartCreationId: string | null;
        activeDeliverableCreationId: string | null;
        metadata: Prisma.JsonValue | null;
    })[]>;
    findOne(nutritionistId: string, id: string): Promise<{
        patient: {
            id: string;
            email: string | null;
            fullName: string;
            height: number | null;
            weight: number | null;
            dietRestrictions: Prisma.JsonValue;
        } | null;
        activeCartCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDeliverableCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDietCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeRecipeCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
    } & {
        id: string;
        name: string;
        nutritionistId: string;
        mode: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        patientId: string | null;
        activeDietCreationId: string | null;
        activeRecipeCreationId: string | null;
        activeCartCreationId: string | null;
        activeDeliverableCreationId: string | null;
        metadata: Prisma.JsonValue | null;
    }>;
    update(nutritionistId: string, id: string, dto: UpdateProjectDto): Promise<{
        patient: {
            id: string;
            email: string | null;
            fullName: string;
            height: number | null;
            weight: number | null;
            dietRestrictions: Prisma.JsonValue;
        } | null;
        activeCartCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDeliverableCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDietCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeRecipeCreation: {
            id: string;
            name: string;
            updatedAt: Date;
            type: string;
        } | null;
    } & {
        id: string;
        name: string;
        nutritionistId: string;
        mode: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        patientId: string | null;
        activeDietCreationId: string | null;
        activeRecipeCreationId: string | null;
        activeCartCreationId: string | null;
        activeDeliverableCreationId: string | null;
        metadata: Prisma.JsonValue | null;
    }>;
}
