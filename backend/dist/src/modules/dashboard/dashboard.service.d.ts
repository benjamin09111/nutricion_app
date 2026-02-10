import { PrismaService } from '../../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getNutritionistStats(nutritionistId: string): Promise<{
        stats: {
            name: string;
            stat: string;
            icon: string;
            change: string;
            changeType: string;
        }[];
        recentPatients: {
            id: string;
            updatedAt: Date;
            email: string | null;
            fullName: string;
        }[];
    }>;
}
