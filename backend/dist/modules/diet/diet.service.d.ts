import { PrismaService } from '../../prisma/prisma.service';
import { VerifyFoodsDto } from './dto/verify-foods.dto';
import { AiService } from '../../common/services/ai.service';
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
    private readonly aiService;
    constructor(prisma: PrismaService, aiService: AiService);
    private normalizeText;
    private heuristicVerify;
    private verifyWithAi;
    verifyFoodsAgainstRestrictions(body: VerifyFoodsDto): Promise<VerifyResponse>;
}
export {};
