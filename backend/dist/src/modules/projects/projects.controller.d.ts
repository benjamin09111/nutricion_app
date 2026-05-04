import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(req: any, dto: CreateProjectDto): Promise<{
        patient: {
            id: string;
            fullName: string;
            email: string | null;
            height: number | null;
            weight: number | null;
            dietRestrictions: import("@prisma/client/runtime/library").JsonValue;
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
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
        mode: string;
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
            fullName: string;
            email: string | null;
            height: number | null;
            weight: number | null;
            dietRestrictions: import("@prisma/client/runtime/library").JsonValue;
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
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
        mode: string;
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
            fullName: string;
            email: string | null;
            height: number | null;
            weight: number | null;
            dietRestrictions: import("@prisma/client/runtime/library").JsonValue;
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
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
        mode: string;
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
            fullName: string;
            email: string | null;
            height: number | null;
            weight: number | null;
            dietRestrictions: import("@prisma/client/runtime/library").JsonValue;
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
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
        mode: string;
        patientId: string | null;
        activeDietCreationId: string | null;
        activeRecipeCreationId: string | null;
        activeCartCreationId: string | null;
        activeDeliverableCreationId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
