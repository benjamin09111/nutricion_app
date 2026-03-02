import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(req: any): Promise<{
        stats: {
            name: string;
            stat: string;
            icon: string;
            change: string;
            changeType: string;
        }[];
        recentPatients: {
            id: string;
            email: string | null;
            updatedAt: Date;
            fullName: string;
        }[];
    }>;
}
