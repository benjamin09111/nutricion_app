import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { generateObject, type LanguageModel } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { ZodTypeAny } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';

export type AiProvider = 'openrouter' | 'gemini' | 'openai' | 'deepseek';

const STRICT_CLINICAL_SYSTEM_PROMPT = [
  'Actúa como Naty, el Agente y Copiloto Nutricional Clínico experto de NutriNet (Chile).',
  'Aplica un proceso agéntico de auto-verificación clínica antes de emitir cualquier recomendación.',
  'Aplica de forma estricta, prioritaria y no negociable todas las restricciones médicas, alergias, intolerancias y contraindicaciones del paciente.',
  'NUNCA inventes, sustituyas ni agregues alimentos que contradigan una patología o restricción clínica.',
  'Basa todas las preparaciones en la gastronomía cotidiana chilena y en el Sistema de Porciones de Intercambio (porciones realistas y accesibles en ferias y supermercados de Chile).',
  'Respeta la lista de alimentos permitidos y la política de alimentos externos definida en el pedido.',
  'Si existe conflicto entre objetivo estético, preferencias del paciente y seguridad clínica, SIEMPRE prevalece la seguridad clínica.',
  'La respuesta debe cumplir exactamente el esquema estructurado recibido; no agregues campos ni texto libre fuera de schema.',
].join(' ');

interface AiModelConfig {
  provider: AiProvider;
  model: LanguageModel;
  modelId: string;
}

function calculateCostInCents(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const modelLower = (model || '').toLowerCase();
  let promptRatePerM = 0.15;
  let completionRatePerM = 0.6;

  if (modelLower.includes('gpt-4o') && !modelLower.includes('mini')) {
    promptRatePerM = 2.5;
    completionRatePerM = 10.0;
  } else if (modelLower.includes('gpt-4o-mini')) {
    promptRatePerM = 0.15;
    completionRatePerM = 0.6;
  } else if (modelLower.includes('gemini')) {
    promptRatePerM = 0.075;
    completionRatePerM = 0.3;
  } else if (modelLower.includes('deepseek')) {
    promptRatePerM = 0.14;
    completionRatePerM = 0.28;
  } else if (modelLower.includes('claude-3-5') || modelLower.includes('claude-3.5')) {
    promptRatePerM = 0.8;
    completionRatePerM = 4.0;
  } else {
    // OpenRouter generic routing rate estimate
    promptRatePerM = 0.15;
    completionRatePerM = 0.6;
  }

  const totalCostUSD =
    (promptTokens / 1_000_000) * promptRatePerM +
    (completionTokens / 1_000_000) * completionRatePerM;
  return Number((totalCostUSD * 100).toFixed(6));
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  resolveModelConfig(provider: AiProvider): AiModelConfig | null {
    if (provider === 'openrouter') {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return null;
      const modelId =
        process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
      const baseURL =
        process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      const openrouter = createOpenAI({
        apiKey,
        baseURL,
        headers: {
          'HTTP-Referer': process.env.APP_URL || 'https://nutrinet.cl',
          'X-Title': 'NutriNet Clinical Copilot',
        },
      });
      return { provider, model: openrouter(modelId), modelId };
    }

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
    providers: AiProvider[] = ['openrouter', 'gemini', 'openai', 'deepseek'],
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
    providers: AiProvider[] = ['openrouter', 'gemini', 'openai', 'deepseek'],
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
      accountId?: string;
      feature?: string;
      maxTokens?: number;
    },
  ): Promise<{
    provider: AiProvider;
    modelId: string;
    object: TSchema['_output'];
  }> {
    const temperature = options?.temperature ?? 0.2;
    const providers = options?.providers ?? ['openrouter', 'gemini', 'openai', 'deepseek'];
    const maxTokens = options?.maxTokens ?? 2000;

    return this.runWithFallback(
      taskName,
      async (config) => {
        const { object, usage } = await generateObject({
          model: config.model,
          schema,
          system: [STRICT_CLINICAL_SYSTEM_PROMPT, systemInstruction]
            .filter(Boolean)
            .join('\n'),
          prompt: userPrompt,
          temperature,
          maxTokens,
          providerOptions:
            config.provider === 'gemini'
              ? { google: { structuredOutputs: true } }
              : undefined,
        });

        if (this.prisma) {
          const uAny = (usage || {}) as any;
          const promptTokens =
            uAny?.promptTokens ?? uAny?.inputTokens ?? uAny?.prompt_tokens ?? 0;
          const completionTokens =
            uAny?.completionTokens ??
            uAny?.outputTokens ??
            uAny?.completion_tokens ??
            0;
          const totalTokens =
            uAny?.totalTokens ??
            uAny?.total_tokens ??
            promptTokens + completionTokens;
          const costCents = calculateCostInCents(
            config.modelId,
            promptTokens,
            completionTokens,
          );

          this.prisma.aiUsageLog
            .create({
              data: {
                accountId: options?.accountId || null,
                feature: options?.feature || taskName || 'general',
                model: config.modelId,
                promptTokens,
                completionTokens,
                totalTokens,
                estimatedCostCents: costCents,
                metadata: { taskName, provider: config.provider },
              },
            })
            .catch((err: any) =>
              this.logger.warn(
                `Could not log AI usage: ${err?.message || err}`,
              ),
            );
        }

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

    const details: string[] = [];
    if (patient.ageYears || patient.age)
      details.push(`Edad: ${patient.ageYears || patient.age} años`);
    if (patient.gender) details.push(`Género: ${patient.gender}`);
    if (patient.weightKg || patient.weight)
      details.push(`Peso: ${patient.weightKg || patient.weight} kg`);
    if (patient.heightCm || patient.height)
      details.push(`Estatura: ${patient.heightCm || patient.height} cm`);
    if (patient.nutritionalFocus)
      details.push(`Enfoque Nutricional: ${patient.nutritionalFocus}`);
    if (patient.fitnessGoals)
      details.push(`Objetivo Físico: ${patient.fitnessGoals}`);
    if (patient.activityLevel)
      details.push(`Nivel de Actividad: ${patient.activityLevel}`);
    if (
      patient.dietRestrictions &&
      Array.isArray(patient.dietRestrictions) &&
      patient.dietRestrictions.length > 0
    ) {
      details.push(`Restricciones: ${patient.dietRestrictions.join(', ')}`);
    }
    if (patient.likes) details.push(`Gustos: ${patient.likes}`);
    if (patient.clinicalSummary)
      details.push(`Resumen Clínico: ${patient.clinicalSummary}`);

    return details.length > 0
      ? `[Perfil del Paciente: ${details.join(' | ')}]`
      : null;
  }
}
