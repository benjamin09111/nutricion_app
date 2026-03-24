import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    findAll(search?: string): Promise<{
        name: string;
        unit: string;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
        name: string;
        unit: string;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        icon: string | null;
        color: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        name: string;
        unit: string;
        nutritionistId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        icon: string | null;
        color: string | null;
    }>;
}
