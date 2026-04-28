import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(req: any, dto: CreateProjectDto): Promise<{
        patient: {
            id: string;
            email: string | null;
            fullName: string;
            height: number | null;
            weight: number | null;
            dietRestrictions: import("@prisma/client/runtime/library").JsonValue;
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(req: any, search?: string, status?: string): Promise<({
        patient: {
            id: string;
            email: string | null;
            fullName: string;
            height: number | null;
            weight: number | null;
            dietRestrictions: import("@prisma/client/runtime/library").JsonValue;
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOne(req: any, id: string): Promise<{
        patient: {
            id: string;
            email: string | null;
            fullName: string;
            height: number | null;
            weight: number | null;
            dietRestrictions: import("@prisma/client/runtime/library").JsonValue;
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(req: any, id: string, dto: UpdateProjectDto): Promise<{
        patient: {
            id: string;
            email: string | null;
            fullName: string;
            height: number | null;
            weight: number | null;
            dietRestrictions: import("@prisma/client/runtime/library").JsonValue;
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
