import { _ } from '@/lib/lodash';
import { ChatOpenAI, ClientOptions, OpenAIEmbeddings, } from "@langchain/openai";
import path from 'path';
import type { Document } from "@langchain/core/documents";
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from '@langchain/core/output_parsers';
import { OpenAIWhisperAudio } from "@langchain/community/document_loaders/fs/openai_whisper_audio";
import { prisma } from '../prisma';
import { FAISS_PATH } from '@/lib/constant';
import { AiModelFactory } from './ai/aiModelFactory';
import { ProgressResult } from './memos';

//https://js.langchain.com/docs/introduction/
//https://smith.langchain.com/onboarding
//https://js.langchain.com/docs/tutorials/qa_chat_history
const FaissStorePath = path.join(process.cwd(), FAISS_PATH);

export class AiService {
  static async embeddingUpsert({ id, content, type }: { id: number, content: string, type: 'update' | 'insert' }) {
    try {
      const { VectorStore, Splitter } = await AiModelFactory.GetProvider()
      const chunks = await Splitter.splitText(content);
      console.log('3. 分割完成', { chunks })

      if (type == 'update') {
        console.log('4. 执行更新操作')
        // ... existing delete logic ...
      }

      console.log('5. 准备创建文档')
      const documents: Document[] = chunks.map((chunk, index) => {
        return {
          pageContent: chunk,
          metadata: { noteId: id, uniqDocId: `${id}-${index}` },
        }
      })
      try {
        await prisma.notes.update({
          where: { id },
          data: {
            metadata: {
              isIndexed: true
            }
          }
        })
      } catch (error) {
        console.log(error)
      }
      const BATCH_SIZE = 5;
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        const batchIds = batch.map(doc => doc.metadata.uniqDocId);
        await VectorStore.addDocuments(batch, { ids: batchIds });
      }
      await VectorStore.save(FaissStorePath)
      return { ok: true }
    } catch (error) {
      return { ok: false, error }
    }
  }

  static async embeddingDelete({ id }: { id: number }) {
    const { VectorStore } = await AiModelFactory.GetProvider()
    for (const index of new Array(999).keys()) {
      try {
        await VectorStore.delete({ ids: [`${id}-${index}`] })
      } catch (error) {
        console.log(error)
        break;
      }
    }
    return { ok: true }
  }

  static async similaritySearch({ question }: { question: string }) {
    const { VectorStore } = await AiModelFactory.GetProvider()
    const result = await VectorStore.similaritySearch(question, 2);
    return result
  }

  static async *rebuildEmbeddingIndex(): AsyncGenerator<ProgressResult & { progress?: { current: number, total: number } }, void, unknown> {
    const notes = await prisma.notes.findMany();
    const total = notes.length;
    const BATCH_SIZE = 5;

    console.log({ total })
    let current = 0;

    for (let i = 0; i < notes.length; i += BATCH_SIZE) {
      const noteBatch = notes.slice(i, i + BATCH_SIZE);
      for (const note of noteBatch) {
        current++;
        try {
          //@ts-ignore
          if (note.metadata?.isIndexed) {
            console.log('skip note:', note.id);
            yield {
              type: 'skip' as const,
              content: note.content.slice(0, 30),
              progress: { current, total }
            };
            continue;
          }

          await AiService.embeddingUpsert({
            id: note?.id,
            content: note?.content,
            type: 'insert' as const
          });
          yield {
            type: 'success' as const,
            content: note?.content.slice(0, 30) ?? '',
            progress: { current, total }
          };
        } catch (error) {
          console.error('rebuild index error->', error);
          yield {
            type: 'error' as const,
            content: note.content.slice(0, 30),
            error,
            progress: { current, total }
          };
        }
      }
    }
  }

  static getQAPrompt() {
    const systemPrompt =
    "You are a versatile AI assistant who can: \n" +
    "1. Answer questions and explain concepts\n" +
    "2. Provide suggestions and analysis\n" +
    "3. Help with planning and organizing ideas\n" +
    "4. Assist with content creation and editing\n" +
    "5. Perform basic calculations and reasoning\n\n" +
    "Use the following context to assist with your responses: \n" +
    "{context}\n\n" +
    "If a request is beyond your capabilities, please be honest about it.\n" +
    "Always respond in the user's language.\n" +
    "Maintain a friendly and professional conversational tone.";

    const qaPrompt = ChatPromptTemplate.fromMessages(
      [
        ["system", systemPrompt],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"]
      ]
    )

    return qaPrompt
  }

  static getChatHistory({ conversations }: { conversations: { role: string, content: string }[] }) {
    const conversationMessage = conversations.map(i => {
      if (i.role == 'user') {
        return new HumanMessage(i.content)
      }
      return new AIMessage(i.content)
    })
    conversationMessage.pop()
    return conversationMessage
  }

  static async completions({ question, conversations }: { question: string, conversations: { role: string, content: string }[] }) {
    try {
      const { LLM } = await AiModelFactory.GetProvider()
      let searchRes = await AiService.similaritySearch({ question })
      let notes: any[] = []
      if (searchRes && searchRes.length != 0) {
        notes = await prisma.notes.findMany({
          where: {
            id: {
              in: _.uniqWith(searchRes.map(i => i.metadata?.noteId)).filter(i => !!i) as number[]
            }
          }
        })
      }
      notes = notes?.map(i => { return { ...i, index: searchRes.findIndex(t => t.metadata.noteId == i.id) } }) ?? []
      //@ts-ignore
      notes.sort((a, b) => a.index! - b.index!)
      const chat_history = AiService.getChatHistory({ conversations })
      const qaPrompt = AiService.getQAPrompt()
      const qaChain = qaPrompt.pipe(LLM).pipe(new StringOutputParser())
      const result = await qaChain.stream({
        chat_history,
        input: question,
        context: notes?.map(i => i.content)
      })
      return { result, notes }
    } catch (error) {
      console.log(error)
      throw new Error(error)
    }
  }

  static async speechToText(audioPath: string) {
    const loader = await AiModelFactory.GetAudioLoader(audioPath)
    const docs = await loader.load();
    return docs
  }
}