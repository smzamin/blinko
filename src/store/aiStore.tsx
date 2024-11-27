
import { _ } from '@/lib/lodash';
import { Store } from './standard/base';
import { ToastPlugin } from './module/Toast/Toast';
import { RootStore } from './root';
import { api, streamApi } from '@/lib/trpc';
import { StorageListState } from './standard/StorageListState';
import { GlobalConfig, Note } from '@/server/types';
import { makeAutoObservable } from 'mobx';
import { BlinkoStore } from './blinkoStore';
import { eventBus } from '@/lib/event';
import { showAiWriteSuggestions } from '@/components/Common/PopoverFloat/aiWritePop';
import { PromiseCall, PromiseState } from './standard/PromiseState';
import { DialogStore } from './module/Dialog';
import { CheckboxGroup } from '@nextui-org/react';
import { AiTag } from '@/components/BlinkoAi/aiTag';
import i18n from '@/lib/i18n';

type Chat = {
  content: string
  role: 'user' | 'system' | 'assistant',
  createAt: number
}

type WriteType = 'expand' | 'polish' | 'custom'

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
  modelProviderSelect: { label: string, value: GlobalConfig['aiModelProvider'] }[] = [
    {
      label: "OpenAI",
      value: "OpenAI"
    }
  ]

  modelSelect: Record<GlobalConfig['aiModelProvider'], Array<{ label: string, value: string }>> = {
    OpenAI: [
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
  }

  embeddingSelect: Record<string, Array<{label: string, value: string}>> = {
    OpenAI: [
      {
        label: "text-embedding-3-small",
        value: "text-embedding-3-small"
      },
      {
        label: "text-embedding-3-large",
        value: "text-embedding-3-large"
      },
      {
        label: "text-embedding-ada-002",
        value: "text-embedding-ada-002"
      }
    ]
  }

  scrollTicker = 0
  relationNotes = new StorageListState<Note>({ key: 'relationNotes' })
  chatHistory = new StorageListState<Chat>({ key: 'chatHistory' })
  private abortController = new AbortController()

  writingResponse = ''
  isWriting = false
  writeQuestion = ''
  originalContent = ''
  isLoading = false

  async completionsStream() {
    try {
      this.relationNotes.clear()
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
          this.relationNotes.list = item.notes
          this.relationNotes.save()
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

  get blinko() {
    return RootStore.Get(BlinkoStore)
  }

  async writeStream(writeType: "expand" | "polish" | "custom" | undefined, content: string | undefined) {
    try {
      this.isLoading = true
      // console.log('writeStream', writeType, content)
      this.originalContent = content ?? ' '
      this.scrollTicker++
      this.isWriting = true
      eventBus.emit('editor:deleteLastChar')
      if (writeType == 'polish') {
        eventBus.emit('editor:clear')
      }
      let testContent = ''
      // eventBus.emit('editor:setMarkdownLoading', true)
      const res = await streamApi.ai.writing.mutate({
        question: this.writeQuestion,
        type: writeType,
        content
      }, { signal: this.abortController.signal })
      // eventBus.emit('editor:setMarkdownLoading', false)
      for await (const item of res) {
        eventBus.emit('editor:insert', item.content)
        testContent += item.content
        this.scrollTicker++
      }
      console.log('writeStream end', testContent)
      this.writeQuestion = ''
      eventBus.emit('editor:focus')
      this.isLoading = false
    } catch (error) {
      console.log('writeStream error', error)
      this.isLoading = false
    }
  }

  autoTag = new PromiseState({
    function: async (id: number, content: string) => {
      try {
        RootStore.Get(ToastPlugin).loading(i18n.t('thinking...'))
        const res = await api.ai.autoTag.mutate({ content, tags: this.blinko.tagList?.value?.pathTags ?? [] })
        RootStore.Get(ToastPlugin).remove()
        console.log(res)
        RootStore.Get(DialogStore).setData({
          isOpen: true,
          title: i18n.t('ai-tag'),
          content: <AiTag tags={res} onSelect={async e => {
            let newContent
            if (this.blinko.config.value?.textFoldLength) {
              if (content.length > this.blinko.config.value?.textFoldLength) {
                newContent = content + '\n\n' + e.join(' ')
              } else {
                newContent = e.join(' ') + ' \n\n' + content
              }
            } else {
              newContent = e.join(' ') + ' \n\n' + content
            }
            await PromiseCall(this.blinko.upsertNote.call({ id, content: newContent }))
            RootStore.Get(DialogStore).close()
          }} />
        })
        return res
      } catch (error) {
        RootStore.Get(ToastPlugin).remove()
        RootStore.Get(ToastPlugin).error(error.message)
      }
    }
  })

  abort() {
    this.abortController.abort()
    this.abortController = new AbortController()
    this.isLoading = false
  }
}
