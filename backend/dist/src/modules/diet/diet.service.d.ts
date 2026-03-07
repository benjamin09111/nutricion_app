import { PrismaService } from '../../prisma/prisma.service';
import { VerifyFoodsDto } from './dto/verify-foods.dto';
type RestrictionConflict = {
    foodId: string;
    foodName: string;
    restriction: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
};
type VerifyResponse = {
    ok: boolean;
    source: 'openai' | 'heuristic';
    checkedFoods: number;
    checkedRestrictions: number;
    conflicts: RestrictionConflict[];
    safeFoods: string[];
    summary: string;
};
export declare class DietService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private normalizeText;
    private heuristicVerify;
    private verifyWithOpenAI;
    verifyFoodsAgainstRestrictions(body: VerifyFoodsDto): Promise<VerifyResponse>;
}
export {};
