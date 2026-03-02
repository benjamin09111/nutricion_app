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
            fullName: string;
            email: string | null;
            id: string;
            updatedAt: Date;
        }[];
    }>;
}
