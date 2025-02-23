import { AiBaseModelPrivider } from '.';
import { createXai } from '@ai-sdk/xai';

export class GrokModelProvider extends AiBaseModelPrivider {
  constructor({ globalConfig }) {
    super({ globalConfig });
    this.provider = createXai({
      apiKey: this.globalConfig.aiApiKey,
      baseURL: this.globalConfig.aiApiEndpoint || undefined,
    });
  }

  LLM() {
    try {
      return this.provider.languageModel(this.globalConfig.aiModel ?? 'grok-v1');
    } catch (error) {
      throw error;
    }
  }

  Embeddings() {
    try {
      return this.provider.textEmbeddingModel(this.globalConfig.embeddingModel);
    } catch (error) {
      throw error;
    }
  }
}  