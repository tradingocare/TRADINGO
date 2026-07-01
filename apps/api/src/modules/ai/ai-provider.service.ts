import { Injectable, Logger } from '@nestjs/common';
import { AiProvider } from './providers/ai-provider.interface';
import { OpenAiProvider } from './providers/openai.provider';

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);
  private provider: AiProvider;

  constructor(openAiProvider: OpenAiProvider) {
    this.provider = openAiProvider;
  }

  async generate(prompt: string, options?: { systemPrompt?: string; temperature?: number; maxTokens?: number }): Promise<string> {
    try {
      const response = await this.provider.complete({
        systemPrompt: options?.systemPrompt || 'You are a helpful product catalog assistant.',
        userPrompt: prompt,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2048,
      });
      return response.content;
    } catch (error) {
      this.logger.error(`AI generation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async generateJson<T>(prompt: string, options?: { systemPrompt?: string; temperature?: number }): Promise<T> {
    const systemPrompt = (options?.systemPrompt || 'You are a helpful product catalog assistant.') + ' Respond ONLY with valid JSON. No markdown, no code fences.';
    const content = await this.generate(prompt, { ...options, systemPrompt });
    return JSON.parse(content) as T;
  }
}
