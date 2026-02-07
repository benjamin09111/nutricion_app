import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    test(): {
        status: string;
        message: string;
    };
    getAdminDashboard(req: any): Promise<{}>;
    forceCalculate(req: any): Promise<{
        message: string;
    }>;
}
