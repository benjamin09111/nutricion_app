import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { generateObject, type LanguageModel } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { ZodTypeAny } from 'zod';

export type AiProvider = 'gemini' | 'deepseek' | 'openai';

const STRICT_CLINICAL_SYSTEM_PROMPT = [
  'Actúa exclusivamente como un nutricionista clínico experto.',
  'Aplica de forma estricta y prioritaria todas las restricciones médicas, alergias, intolerancias y contraindicaciones indicadas en el contexto.',
  'Nunca inventes, sustituyas ni agregues alimentos que contradigan una restricción médica.',
  'Respeta la lista de alimentos permitidos y la política de alimentos externos definida en el pedido.',
  'Si existe conflicto entre objetivo, preferencias y seguridad clínica, siempre gana la seguridad clínica.',
  'La respuesta debe cumplir exactamente el esquema estructurado recibido; no agregues campos ni texto libre.',
].join(' ');

interface AiModelConfig {
  provider: AiProvider;
  model: LanguageModel;
  modelId: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  resolveModelConfig(provider: AiProvider): AiModelConfig | null {
    if (provider === 'gemini') {
      const apiKey =
        process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) return null;
      const modelId = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
      const google = createGoogleGenerativeAI({ apiKey });
      return { provider, model: google(modelId), modelId };
    }

    if (provider === 'deepseek') {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) return null;
      const modelId = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
      const baseURL =
        process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
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

  resolvePreferredModelConfig(
    providers: AiProvider[] = ['gemini', 'deepseek', 'openai'],
  ): AiModelConfig | null {
    for (const provider of providers) {
      const config = this.resolveModelConfig(provider);
      if (config) return config;
    }

    return null;
  }

  private async runWithFallback<T>(
    taskName: string,
    runner: (config: AiModelConfig) => Promise<T>,
    providers: AiProvider[] = ['gemini', 'deepseek', 'openai'],
  ): Promise<{ provider: AiProvider; modelId: string; result: T }> {
    const errors: string[] = [];

    for (const provider of providers) {
      const config = this.resolveModelConfig(provider);
      if (!config) {
        errors.push(`${provider}: sin credenciales`);
        continue;
      }

      try {
        this.logger.log(
          `[AI:${taskName}] Request provider=${config.provider} model=${config.modelId}`,
        );
        const result = await runner(config);
        return {
          provider: config.provider,
          modelId: config.modelId,
          result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${provider}: ${message}`);
        this.logger.warn(`[AI:${taskName}] Fallback triggered: ${message}`);
      }
    }

    const errorSummary = errors.join(' | ');
    this.logger.error(`[AI:${taskName}] All providers failed: ${errorSummary}`);
    throw new BadRequestException(
      `No se pudo completar la solicitud de IA. Detalles: ${errorSummary}`,
    );
  }

  async generateStructuredObject<TSchema extends ZodTypeAny>(
    taskName: string,
    systemInstruction: string,
    userPrompt: string,
    schema: TSchema,
    options?: {
      temperature?: number;
      providers?: AiProvider[];
    },
  ): Promise<{
    provider: AiProvider;
    modelId: string;
    object: TSchema['_output'];
  }> {
    const temperature = options?.temperature ?? 0.2;
    const providers = options?.providers ?? ['gemini', 'deepseek', 'openai'];

    return this.runWithFallback(
      taskName,
      async (config) => {
        const { object } = await generateObject({
          model: config.model,
          schema,
          system: [STRICT_CLINICAL_SYSTEM_PROMPT, systemInstruction]
            .filter(Boolean)
            .join('\n'),
          prompt: userPrompt,
          temperature,
          providerOptions:
            config.provider === 'gemini'
              ? { google: { structuredOutputs: true } }
              : undefined,
        });

        return object;
      },
      providers,
    ).then(({ provider, modelId, result }) => ({
      provider,
      modelId,
      object: result,
    }));
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
