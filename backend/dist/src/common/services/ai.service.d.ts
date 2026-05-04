export declare class AiService {
    private readonly logger;
    private readonly requestTimeoutMs;
    private getProviderConfig;
    private extractOpenAICompatibleText;
    private callProviderJson;
    callJson(systemInstruction: string, userPrompt: string): Promise<string>;
}
