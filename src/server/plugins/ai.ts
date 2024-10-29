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

//https://js.langchain.com/docs/introduction/
//https://smith.langchain.com/onboarding
//https://js.langchain.com/docs/tutorials/qa_chat_history
const FaissStorePath = path.join(process.cwd(), FAISS_PATH);

export class AiService {
  static async embeddingUpsert({ id, content, type }: { id: number, content: string, type: 'update' | 'insert' }) {
    const { VectorStore, Splitter } = await AiModelFactory.GetProvider()
    const chunks = await Splitter.splitText(content);
    if (type == 'update') {
      for (const index of new Array(999).keys()) {
        try {
          await VectorStore.delete({ ids: [`${id}-${index}`] })
        } catch (error) {
          console.log(error)
          break;
        }
      }
    }
    const documents: Document[] = chunks.map((chunk, index) => {
      return {
        pageContent: chunk,
        metadata: { noteId: id, uniqDocId: `${id}-${index}` },
      }
    })
    await VectorStore.addDocuments(documents, { ids: documents.map(i => i.metadata.uniqDocId) });
    await VectorStore.save(FaissStorePath)
    return { ok: true }
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

  static getQAPrompt() {
    const systemPrompt =
      "You are an blinko assistant for question-answering tasks. " +
      "Use the following pieces of retrieved context to answer " +
      "the question. If you don't know the answer, say that you " +
      "don't know. " +
      " According to the user's language to reply" +
      "\n\n" +
      "{context}";

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