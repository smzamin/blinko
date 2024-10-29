import { cache } from "@/lib/cache"
import { MarkdownTextSplitter } from "@langchain/textsplitters"
import { FaissStore } from "@langchain/community/vectorstores/faiss"
import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import { Embeddings } from "@langchain/core/embeddings"
import { OpenAIModelProvider } from "./openAIModelProvider"
import { getGlobalConfig } from "@/server/routers/config"

export class AiModelFactory {
  static async globalConfig() {
    return cache.wrap('globalConfig', async () => {
      return await getGlobalConfig()
    }, { ttl: 1000 })
  }
  static async ValidConfig() {
    const globalConfig = await AiModelFactory.globalConfig()
    if (!globalConfig.aiModelProvider || !globalConfig.aiApiKey || !globalConfig.isUseAI) {
      throw new Error('model provider or apikey not configure!')
    }
    return await AiModelFactory.globalConfig()
  }

  static async GetProvider() {
    const globalConfig = await AiModelFactory.ValidConfig()
    if (globalConfig.aiModelProvider == 'OpenAI') {
      const provider = new OpenAIModelProvider({ globalConfig })
      return {
        LLM: provider.LLM(),
        VectorStore: await provider.VectorStore(),
        Embeddings: provider.Embeddings(),
        Splitter: provider.Splitter()
      }
    }
    return {
      LLM: null as unknown as BaseChatModel,
      VectorStore: null as unknown as FaissStore,
      Embeddings: null as unknown as Embeddings,
      Splitter: null as unknown as MarkdownTextSplitter
    }
  }

  static async GetAudioLoader(audioPath: string) {
    const globalConfig = await AiModelFactory.ValidConfig()
    if (globalConfig.aiModelProvider == 'OpenAI') {
      const provider = new OpenAIModelProvider({ globalConfig })
      return provider.AudioLoader(audioPath)
    }else{
      throw new Error('not support other loader')
    }
  }
}

