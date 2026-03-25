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
        activeDietCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeRecipeCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeCartCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDeliverableCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
    } & {
        name: string;
        nutritionistId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        mode: string;
        patientId: string | null;
        metadata: Prisma.JsonValue | null;
        activeDietCreationId: string | null;
        activeRecipeCreationId: string | null;
        activeCartCreationId: string | null;
        activeDeliverableCreationId: string | null;
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
        activeDietCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeRecipeCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeCartCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDeliverableCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
    } & {
        name: string;
        nutritionistId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        mode: string;
        patientId: string | null;
        metadata: Prisma.JsonValue | null;
        activeDietCreationId: string | null;
        activeRecipeCreationId: string | null;
        activeCartCreationId: string | null;
        activeDeliverableCreationId: string | null;
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
        activeDietCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeRecipeCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeCartCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDeliverableCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
    } & {
        name: string;
        nutritionistId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        mode: string;
        patientId: string | null;
        metadata: Prisma.JsonValue | null;
        activeDietCreationId: string | null;
        activeRecipeCreationId: string | null;
        activeCartCreationId: string | null;
        activeDeliverableCreationId: string | null;
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
        activeDietCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeRecipeCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeCartCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
        activeDeliverableCreation: {
            name: string;
            id: string;
            updatedAt: Date;
            type: string;
        } | null;
    } & {
        name: string;
        nutritionistId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        mode: string;
        patientId: string | null;
        metadata: Prisma.JsonValue | null;
        activeDietCreationId: string | null;
        activeRecipeCreationId: string | null;
        activeCartCreationId: string | null;
        activeDeliverableCreationId: string | null;
    }>;
}
