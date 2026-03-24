import { DietService } from './diet.service';
import { VerifyFoodsDto } from './dto/verify-foods.dto';
export declare class DietController {
    private readonly dietService;
    constructor(dietService: DietService);
    verifyFoods(body: VerifyFoodsDto): Promise<{
        ok: boolean;
        source: "openai" | "heuristic";
        checkedFoods: number;
        checkedRestrictions: number;
        conflicts: {
            foodId: string;
            foodName: string;
            restriction: string;
            reason: string;
            severity: "low" | "medium" | "high";
        }[];
        safeFoods: string[];
        summary: string;
    }>;
}
