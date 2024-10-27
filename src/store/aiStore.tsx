
import { _ } from '@/lib/lodash';
import { Store } from './standard/base';
import { ToastPlugin } from './module/Toast/Toast';
import { RootStore } from './root';
import { streamApi } from '@/lib/trpc';
import { StorageListState } from './standard/StorageListState';
import { Note } from '@/server/types';
import { makeAutoObservable } from 'mobx';

type Chat = {
  content: string
  role: 'user' | 'system' | 'assistant',
  createAt: number
}

export class AiStore implements Store {
  sid = 'AiStore';
  constructor() {
    makeAutoObservable(this)
  }
  noteContent = '';
  aiSearchText = '';
  aiSearchResult = {
    content: "",
    notes: [] as Note[]
  }
  modelProviderSelect = [
    {
      label: "OpenAI",
      value: "OpenAI"
    }
  ]
  modelSelect = [
    {
      label: "gpt-3.5-turbo",
      value: "gpt-3.5-turbo"
    },
    {
      label: "gpt-4",
      value: "gpt-4"
    },
    {
      label: "gpt-4o",
      value: "gpt-4o"
    },
    {
      label: "gpt-4o-mini",
      value: "gpt-4o-mini"
    }
  ]
  scrollTicker = 0
  relationNotes: Note[] = []
  chatHistory = new StorageListState<Chat>({ key: 'chatHistory' })
  private abortController = new AbortController()

  async completionsStream() {
    try {
      this.relationNotes = []
      this.chatHistory.push({
        content: this.aiSearchText,
        role: 'user',
        createAt: new Date().getTime()
      })
      this.scrollTicker++
      const conversations = this.chatHistory.list.map(i => { return { role: i.role, content: i.content } })
      this.chatHistory.push({
        content: '',
        role: 'assistant',
        createAt: new Date().getTime()
      })
      const res = await streamApi.ai.completions.mutate({ question: this.aiSearchText, conversations }, { signal: this.abortController.signal })
      for await (const item of res) {
        if (item.notes) {
          this.relationNotes = item.notes as Note[]
        } else {
          this.chatHistory.list[this.chatHistory.list.length - 1]!.content += item.context
          this.scrollTicker++
        }
      }
      this.chatHistory.save()
    } catch (error) {
      this.chatHistory.clear()
      RootStore.Get(ToastPlugin).error(error.message)
    }
  }

  abortCompletions() {
    this.abortController.abort()
  }
}
