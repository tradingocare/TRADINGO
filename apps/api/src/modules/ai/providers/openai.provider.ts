import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, AiCompletionRequest, AiCompletionResponse } from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  name = 'openai';
  private readonly logger = new Logger(OpenAiProvider.name);
  private apiKey: string;
  private model: string;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get('OPENAI_API_KEY') || '';
    this.model = configService.get('OPENAI_MODEL') || 'gpt-4o-mini';
  }

  async complete(req: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured, returning mock response');
      return { content: `[AI MOCK - ${this.model}] ${req.userPrompt.substring(0, 100)}...`, model: this.model };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.userPrompt },
        ],
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens } : undefined,
    };
  }
}
