"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
let AiService = AiService_1 = class AiService {
    logger = new common_1.Logger(AiService_1.name);
    requestTimeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS || 90000);
    getProviderConfig(provider) {
        if (provider === 'deepseek') {
            const apiKey = process.env.DEEPSEEK_API_KEY;
            if (!apiKey)
                return null;
            return {
                provider,
                apiKey,
                model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
                baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
            };
        }
        if (provider === 'abacus') {
            const apiKey = process.env.ABACUS_API_KEY;
            if (!apiKey)
                return null;
            return {
                provider,
                apiKey,
                model: process.env.ABACUS_MODEL || 'route-llm',
                baseUrl: process.env.ABACUS_BASE_URL || 'https://routellm.abacus.ai/v1',
            };
        }
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey)
            return null;
        return {
            provider,
            apiKey,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        };
    }
    extractOpenAICompatibleText(payload) {
        const choices = Array.isArray(payload?.choices) ? payload.choices : [];
        const first = choices[0];
        const message = first?.message;
        if (typeof message?.content === 'string')
            return message.content;
        if (Array.isArray(message?.content)) {
            const parts = message.content
                .map((part) => (typeof part?.text === 'string' ? part.text : ''))
                .filter(Boolean);
            if (parts.length > 0)
                return parts.join('\n');
        }
        return null;
    }
    async callProviderJson(config, systemInstruction, userPrompt) {
        const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
        this.logger.log(`[AI:${config.provider}] Request model=${config.model} promptChars=${userPrompt.length}`);
        const payload = {
            model: config.model,
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        };
        if (config.provider === 'deepseek') {
            payload.thinking = { type: 'enabled' };
            payload.reasoning_effort = 'medium';
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
            signal: AbortSignal.timeout(this.requestTimeoutMs),
            body: JSON.stringify(payload),
        });
        const raw = await response.json().catch(() => ({}));
        if (!response.ok) {
            const upstreamMessage = raw?.error?.message || raw?.message || '';
            throw new common_1.BadRequestException(upstreamMessage || `No se pudo completar la solicitud con ${config.provider}.`);
        }
        const text = this.extractOpenAICompatibleText(raw);
        if (!text) {
            throw new common_1.BadRequestException('La IA no devolvio contenido.');
        }
        return text;
    }
    async callJson(systemInstruction, userPrompt) {
        const providers = ['deepseek', 'abacus', 'openai'];
        const errors = [];
        for (const provider of providers) {
            const config = this.getProviderConfig(provider);
            if (!config) {
                errors.push(`${provider}: sin credenciales`);
                continue;
            }
            try {
                return await this.callProviderJson(config, systemInstruction, userPrompt);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                errors.push(`${provider}: ${message}`);
                this.logger.warn(`[AI:${provider}] Fallback triggered: ${message}`);
            }
        }
        throw new common_1.BadRequestException(`No se pudo completar la solicitud de IA. ${errors.join(' | ')}`);
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)()
], AiService);
//# sourceMappingURL=ai.service.js.map