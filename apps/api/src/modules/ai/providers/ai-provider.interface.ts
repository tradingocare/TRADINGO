export interface AiProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiCompletionResponse {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface AiStreamChunk {
  content: string;
  done: boolean;
  model?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface AiProvider {
  name: string;
  complete(req: AiCompletionRequest): Promise<AiCompletionResponse>;
  stream?(req: AiCompletionRequest): AsyncGenerator<AiStreamChunk>;
}
