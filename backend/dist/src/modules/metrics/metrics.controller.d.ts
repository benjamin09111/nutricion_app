import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    findAll(search?: string): Promise<{
        name: string;
        unit: string;
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        color: string | null;
        key: string;
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
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        color: string | null;
        key: string;
    }>;
    remove(id: string, req: any): Promise<{
        name: string;
        unit: string;
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        color: string | null;
        key: string;
    }>;
}
