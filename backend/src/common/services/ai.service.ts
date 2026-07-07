import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

type AiProvider = 'deepseek' | 'openai';

interface AiModelConfig {
  provider: AiProvider;
  model: ReturnType<ReturnType<typeof createOpenAI>>;
  modelId: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private getModelConfig(provider: AiProvider): AiModelConfig | null {
    if (provider === 'deepseek') {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) return null;
      const modelId = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
      const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
      const deepseek = createOpenAI({ apiKey, baseURL });
      return { provider, model: deepseek(modelId), modelId };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    const modelId = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const openai = createOpenAI({ apiKey, baseURL });
    return { provider, model: openai(modelId), modelId };
  }

  async callJson(
    systemInstruction: string,
    userPrompt: string,
  ): Promise<string> {
    const providers: AiProvider[] = ['deepseek', 'openai'];
    const errors: string[] = [];

    for (const provider of providers) {
      const config = this.getModelConfig(provider);
      if (!config) {
        errors.push(`${provider}: sin credenciales`);
        continue;
      }

      try {
        this.logger.log(
          `[AI:${config.provider}] Request model=${config.modelId} promptChars=${userPrompt.length}`,
        );

        const { text } = await generateText({
          model: config.model,
          system: systemInstruction,
          prompt: userPrompt,
          temperature: 0.2,
          providerOptions: {
            openai: { responseFormat: { type: 'json_object' } },
          },
        });

        if (!text) {
          throw new BadRequestException('Empty response from AI provider');
        }

        return text;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${provider}: ${message}`);
        this.logger.warn(`[AI:${config.provider}] Fallback triggered: ${message}`);
      }
    }

    const errorSummary = errors.join(' | ');
    this.logger.error(`[AI] All providers failed: ${errorSummary}`);
    throw new BadRequestException(
      `No se pudo completar la solicitud de IA. Detalles: ${errorSummary}`,
    );
  }

  formatPatientContext(patient?: any): string | null {
    if (!patient) return null;
    const parts: string[] = [];

    const demo: string[] = [];
    if (patient.ageYears) demo.push(`${patient.ageYears}a`);
    if (patient.gender) {
      const g = patient.gender.toLowerCase();
      demo.push(
        g.startsWith('m') ? 'M' : g.startsWith('f') ? 'F' : patient.gender,
      );
    }
    const weight = patient.weight ?? patient.weightKg;
    if (weight != null) demo.push(`${weight}kg`);
    const height = patient.height ?? patient.heightCm;
    if (height != null) demo.push(`${height}cm`);
    if (demo.length > 0) parts.push(`Pte: ${demo.join(', ')}`);

    if (patient.nutritionalFocus || patient.fitnessGoals) {
      const goals = [patient.nutritionalFocus, patient.fitnessGoals]
        .filter(Boolean)
        .join('/');
      parts.push(`Obj: ${goals}`);
    }

    if (patient.likes) parts.push(`Gustos: ${patient.likes}`);

    const restr = patient.restrictions || patient.dietRestrictions;
    if (restr && restr.length > 0) {
      const cleanRestr = Array.isArray(restr)
        ? restr.filter((r: any) => typeof r === 'string' && r.trim().length > 0)
        : [];
      if (cleanRestr.length > 0) {
        parts.push(`Restr: ${cleanRestr.join(', ')}`);
      }
    }

    if (patient.clinicalSummary) parts.push(`Obs: ${patient.clinicalSummary}`);

    return parts.join(' | ');
  }
}
