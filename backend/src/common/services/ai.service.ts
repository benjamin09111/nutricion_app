import { BadRequestException, Injectable, Logger } from '@nestjs/common';

type AiProvider = 'deepseek' | 'abacus' | 'openai';

type AiConfig = {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly requestTimeoutMs = Number(
    process.env.AI_REQUEST_TIMEOUT_MS || 90000,
  );

  private getProviderConfig(provider: AiProvider): AiConfig | null {
    if (provider === 'deepseek') {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) return null;
      return {
        provider,
        apiKey,
        model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      };
    }

    if (provider === 'abacus') {
      const apiKey = process.env.ABACUS_API_KEY;
      if (!apiKey) return null;
      return {
        provider,
        apiKey,
        model: process.env.ABACUS_MODEL || 'route-llm',
        baseUrl: process.env.ABACUS_BASE_URL || 'https://routellm.abacus.ai/v1',
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return {
      provider,
      apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    };
  }

  private extractOpenAICompatibleText(payload: any): string | null {
    const choices = Array.isArray(payload?.choices) ? payload.choices : [];
    const first = choices[0];
    const message = first?.message;
    if (typeof message?.content === 'string') return message.content;
    if (Array.isArray(message?.content)) {
      const parts = message.content
        .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
        .filter(Boolean);
      if (parts.length > 0) return parts.join('\n');
    }
    return null;
  }

  private buildEmptyContentMessage(config: AiConfig, payload: any): string {
    const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
    const finishReason =
      typeof choice?.finish_reason === 'string'
        ? choice.finish_reason
        : 'unknown';
    const hasReasoning = Boolean(choice?.message?.reasoning_content);

    return [
      'La IA no devolvio contenido util.',
      `provider=${config.provider}`,
      `model=${config.model}`,
      `finish_reason=${finishReason}`,
      `reasoning=${hasReasoning ? 'yes' : 'no'}`,
    ].join(' ');
  }

  private async callProviderJson(
    config: AiConfig,
    systemInstruction: string,
    userPrompt: string,
  ): Promise<string> {
    const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    this.logger.log(
      `[AI:${config.provider}] Request model=${config.model} promptChars=${userPrompt.length}`,
    );

    // Standard OpenAI payload structure
    const payload: Record<string, unknown> = {
      model: config.model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: AbortSignal.timeout(this.requestTimeoutMs),
      body: JSON.stringify(payload),
    });

    const raw = await response.json().catch((e) => {
      this.logger.error(
        `[AI:${config.provider}] JSON parse error: ${e.message}`,
      );
      return {};
    });
    if (!response.ok) {
      const upstreamMessage = raw?.error?.message || raw?.message || '';
      throw new BadRequestException(
        upstreamMessage ||
          `No se pudo completar la solicitud con ${config.provider}.`,
      );
    }

    const text = this.extractOpenAICompatibleText(raw);
    if (!text) {
      this.logger.error(
        `[AI:${config.provider}] No usable content. Raw response: ${JSON.stringify(raw)}`,
      );
      throw new BadRequestException(this.buildEmptyContentMessage(config, raw));
    }

    return text;
  }

  async callJson(
    systemInstruction: string,
    userPrompt: string,
  ): Promise<string> {
    const providers: AiProvider[] = ['deepseek', 'abacus', 'openai'];
    const errors: string[] = [];

    for (const provider of providers) {
      const config = this.getProviderConfig(provider);
      if (!config) {
        errors.push(`${provider}: sin credenciales`);
        continue;
      }

      try {
        return await this.callProviderJson(
          config,
          systemInstruction,
          userPrompt,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${provider}: ${message}`);
        this.logger.warn(`[AI:${provider}] Fallback triggered: ${message}`);
      }
    }

    const errorSummary = errors.join(' | ');
    this.logger.error(`[AI] All providers failed: ${errorSummary}`);
    throw new BadRequestException(
      `No se pudo completar la solicitud de IA. Detalles: ${errorSummary}`,
    );
  }

  /**
   * Compacts patient information into a single-line clinical shorthand notation.
   * Saves up to 60% of patient-context tokens and improves data privacy by omitting full names.
   */
  formatPatientContext(patient?: any): string | null {
    if (!patient) return null;
    const parts: string[] = [];

    // Demographics
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

    // Objectives / Focus
    if (patient.nutritionalFocus || patient.fitnessGoals) {
      const goals = [patient.nutritionalFocus, patient.fitnessGoals]
        .filter(Boolean)
        .join('/');
      parts.push(`Obj: ${goals}`);
    }

    // Preferences / Likes
    if (patient.likes) parts.push(`Gustos: ${patient.likes}`);

    // Restrictions
    const restr = patient.restrictions || patient.dietRestrictions;
    if (restr && restr.length > 0) {
      const cleanRestr = Array.isArray(restr)
        ? restr.filter((r: any) => typeof r === 'string' && r.trim().length > 0)
        : [];
      if (cleanRestr.length > 0) {
        parts.push(`Restr: ${cleanRestr.join(', ')}`);
      }
    }

    // Clinical Summary
    if (patient.clinicalSummary) parts.push(`Obs: ${patient.clinicalSummary}`);

    return parts.join(' | ');
  }
}
