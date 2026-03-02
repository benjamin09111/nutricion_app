import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    findAll(search?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        unit: string;
        key: string;
        icon: string | null;
        color: string | null;
    }[]>;
    create(data: {
        name: string;
        unit: string;
        key: string;
        icon?: string;
        color?: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        unit: string;
        key: string;
        icon: string | null;
        color: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        unit: string;
        key: string;
        icon: string | null;
        color: string | null;
    }>;
}
