import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AiService } from '../../common/services/ai.service';
import { PAUTAS_AI_PROMPTS } from './pautas-ai-prompts';
import { AiGeneratePautasDto } from './dto/ai-generate-pautas.dto';
import { PlanUsageService } from '../permissions/plan-usage.service';

type PautaParagraph = {
  category: string;
  categoryOptional: string;
  portionsPerDay: string;
  foods: Array<{ portion: string; food: string }>;
};

type PautaAiResponse = {
  paragraphs: PautaParagraph[];
};

@Injectable()
export class PautasService {
  private readonly logger = new Logger(PautasService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly planUsageService: PlanUsageService,
  ) {}

  async generateWithAi(
    accountId: string,
    dto: AiGeneratePautasDto,
  ): Promise<PautaAiResponse> {
    const {
      restriction,
      categories,
      allowedFoods = [],
      restrictedFoods = [],
      patient,
    } = dto;

    if (!restriction || !categories || categories.length === 0) {
      throw new BadRequestException(
        'Se requiere una restricción clínica y al menos una categoría.',
      );
    }

    const systemInstruction = PAUTAS_AI_PROMPTS.system;
    const patientContext = this.aiService.formatPatientContext(patient);
    const userPrompt = PAUTAS_AI_PROMPTS.userPrompt(
      restriction,
      categories,
      allowedFoods,
      restrictedFoods,
      patientContext,
    );

    this.logger.log(
      `[AI] Generating pautas for restriction: ${restriction}, categories: ${categories.join(', ')}`,
    );

    try {
      await this.planUsageService.consumeMonthlyQuota(
        accountId,
        'ai.calls.limit',
      );

      const rawResponse = await this.aiService.callJson(
        systemInstruction,
        userPrompt,
      );
      const parsed = this.parseAiResponse(rawResponse);
      return parsed;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[AI] Request failed: ${message}`);
      throw new BadRequestException(this.mapAiErrorMessage(message));
    }
  }

  private parseAiResponse(rawContent: string): PautaAiResponse {
    const trimmed = rawContent.trim();

    let jsonStr = '';
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      jsonStr = trimmed;
    } else {
      const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fencedMatch?.[1]) {
        jsonStr = fencedMatch[1].trim();
      } else {
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          jsonStr = trimmed.slice(firstBrace, lastBrace + 1);
        } else {
          throw new BadRequestException('La IA no devolvió un JSON válido.');
        }
      }
    }

    try {
      const parsed = JSON.parse(jsonStr);

      if (!parsed.paragraphs || !Array.isArray(parsed.paragraphs)) {
        this.logger.warn(
          '[AI] Response missing paragraphs array, wrapping in default structure',
        );
        return { paragraphs: [] };
      }

      const validParagraphs = parsed.paragraphs.filter(
        (p: unknown) =>
          p !== null &&
          typeof p === 'object' &&
          typeof (p as { category?: unknown }).category === 'string',
      );

      return { paragraphs: validParagraphs as PautaParagraph[] };
    } catch {
      throw new BadRequestException(
        'No se pudo parsear la respuesta de la IA como JSON.',
      );
    }
  }

  private mapAiErrorMessage(error: string): string {
    const lower = error.toLowerCase();
    if (lower.includes('rate_limit') || lower.includes('quota')) {
      return 'Límite de requests de IA alcanzado. Intenta más tarde.';
    }
    if (lower.includes('timeout')) {
      return 'La IA tardó demasiado en responder. Intenta de nuevo.';
    }
    if (lower.includes('invalid_api_key') || lower.includes('unauthorized')) {
      return 'Error de autenticación con el servicio de IA.';
    }
    return 'Error al generar con IA. Por favor intenta de nuevo.';
  }
}
