// Types
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RequestOptions {
  responseFormat?: ResponseFormat;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export class OpenRouterService {
  private readonly _apiKey: string;
  private readonly _baseUrl: string;
  private readonly _defaultModel: string;

  constructor(config: OpenRouterConfig) {
    this._apiKey = config.apiKey;
    this._baseUrl = config.baseUrl;
    this._defaultModel = config.defaultModel;
  }

  /**
   * Sends a message to OpenRouter API and returns the response
   */
  public async sendMessage(
    messages: ChatMessage[],
    options: RequestOptions = {}
  ): Promise<unknown> {
    try {
      const payload = this.buildPayload(messages, options);
      const response = await fetch(`${this._baseUrl}/api/v1/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${this._apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return response.json();
    } catch (error) {
      throw new Error(error as string);
    }
  }

  /**
   * Builds the request payload from messages and options
   */
  private buildPayload(
    messages: ChatMessage[],
    options: RequestOptions
  ): Record<string, unknown> {
    return {
      messages,
      model: this._defaultModel,
      response_format: options.responseFormat,
    };
  }

} 