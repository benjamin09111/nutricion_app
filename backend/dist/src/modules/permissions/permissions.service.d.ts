import { PrismaService } from '../../prisma/prisma.service';
export declare class PermissionsService {
    private prisma;
    constructor(prisma: PrismaService);
    checkFeatureAccess(accountId: string, featureKey: string): Promise<boolean>;
    getFeatureLimit(accountId: string, limitKey: string): Promise<number>;
    ensureAccess(accountId: string, featureKey: string): Promise<void>;
}
