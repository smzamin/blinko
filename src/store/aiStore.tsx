
import { _ } from '@/lib/lodash';
import { makeAutoObservable } from 'mobx';
import { useEffect } from 'react';
import { PromisePageState, PromiseState } from './standard/PromiseState';
import { Store } from './standard/base';
import { type AttachmentsType, BlinkoController } from '@/server/share/controllers/blinkoController';
import { Note, NoteType } from '@/server/share/entities/notes';
import { tagRepo } from '@/server/share/index';
import { helper } from '@/lib/helper';
import { ToastPlugin } from './module/Toast/Toast';
import { RootStore } from './root';
import { StorageState } from './standard/StorageState';
import { eventBus } from '@/lib/event';
import i18n from '@/lib/i18n';
import { useRouter } from 'next/router';
import { api, streamApi } from '@/lib/trpc';
import { StorageListState } from './standard/StorageListState';

type Chat = {
  content: string
  role: 'user' | 'system' | 'assistant',
  createAt: number
}

export class AiStore implements Store {
  constructor() {
    makeAutoObservable(this)
  }
  sid = 'AiStore';
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
  async onBottom() {
    // await this.noteList.callNextPage({})
  }

  loadAllData() {
    // this.noteList.resetAndCall({})
    // this.tagList.call()
  }

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

  use() {
    const router = useRouter()

  }


}
