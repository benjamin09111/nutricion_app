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
            fullName: string;
            email: string | null;
            id: string;
            updatedAt: Date;
        }[];
    }>;
}
