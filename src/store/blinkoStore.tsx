
import { _ } from '@/lib/lodash';
import { makeAutoObservable } from 'mobx';
import { useEffect } from 'react';
import { PromisePageState, PromiseState } from './standard/PromiseState';
import { Store } from './standard/base';
import { helper } from '@/lib/helper';
import { ToastPlugin } from './module/Toast/Toast';
import { RootStore } from './root';
import { eventBus } from '@/lib/event';
import i18n from '@/lib/i18n';
import { api } from '@/lib/trpc';
import { type RouterOutput } from '@/server/routers/_app';
import { Attachment, NoteType, type Note } from '@/server/types';
import { DBBAK_TASK_NAME } from '@/lib/constant';

type filterType = {
  label: string;
  sortBy: string;
  direction: string;
}

export class BlinkoStore implements Store {
  constructor() {
    makeAutoObservable(this)
  }
  sid = 'BlinkoStore';
  noteContent = '';
  curSelectedNote: RouterOutput['notes']['list'][0];
  curMultiSelectIds: number[] = [];
  isMultiSelectMode: boolean = false;

  onMultiSelectNote(id: number) {
    if (this.curMultiSelectIds.includes(id)) {
      this.curMultiSelectIds = this.curMultiSelectIds.filter(item => item !== id);
    } else {
      this.curMultiSelectIds.push(id);
    }
    if (this.curMultiSelectIds.length == 0) {
      this.isMultiSelectMode = false
    }
  }
  onMultiSelectRest() {
    this.isMultiSelectMode = false
    this.curMultiSelectIds = []
    this.updateTicker++
  }

  autoObservable = true;
  routerList = [
    {
      title: "blinko",
      href: '/',
      icon: 'basil:lightning-outline'
    },
    {
      title: "notes",
      href: '/notes',
      icon: 'hugeicons:note'
    },
    {
      title: "resources",
      href: '/resources',
      icon: 'solar:database-linear'
    },
    {
      title: "archived",
      href: '/archived',
      icon: 'solar:box-broken'
    },
    {
      title: "settings",
      href: '/settings',
      icon: 'lsicon:setting-outline'
    }
  ];
  allTagRouter = {
    title: 'total',
    href: '/all',
    icon: ''
  }
  noteListFilterConfig = {
    isArchived: false,
    type: 0,
    tagId: null as number | null,
    searchText: ""
  }
  noteTypeDefault: NoteType = NoteType.BLINKO
  currentCommonFilter: filterType | null = null
  currentRouter = this.routerList[0]
  updateTicker = 0

  upsertNote = new PromiseState({
    function: async ({ content = '', isArchived, type, id, attachments = [] }:
      { content?: string, isArchived?: boolean, type?: NoteType, id?: number, attachments?: Attachment[] }) => {
      if (type == undefined) {
        type = this.noteTypeDefault
      }
      // const res = await BlinkoController.upsertBlinko({ content, type, isArchived, id, attachments })
      const res = await api.notes.upsert.mutate({ content, type, isArchived, id, attachments })
      console.log(res)
      if (res?.id) {
        api.ai.embeddingUpsert.mutate({ id: res!.id, content: res!.content, type: id ? 'update' : 'insert' })
      }
      eventBus.emit('editor:clear')
      RootStore.Get(ToastPlugin).success(id ? i18n.t("update-successfully") : i18n.t("create-successfully"))
      this.updateTicker++
      return res
    }
  })

  fullNoteList: Note[] = []

  noteList = new PromisePageState({
    function: async ({ page, size }) => {
      const notes = await api.notes.list.query({ ...this.noteListFilterConfig, page, size })
      return notes.map(i => { return { ...i, isExpand: false } })
    }
  })

  dailyReviewNoteList = new PromiseState({
    function: async () => {
      return await api.notes.dailyReviewNoteList.query()
    }
  })

  resourceList = new PromisePageState({
    size: 30,
    function: async ({ page, size }) => {
      return await api.attachments.list.query({ page, size })
    }
  })

  tagList = new PromiseState({
    function: async () => {
      const falttenTags = await api.tags.list.query();
      const listTags = helper.buildHashTagTreeFromDb(falttenTags)
      let pathTags: string[] = [];
      listTags.forEach(node => {
        pathTags = pathTags.concat(helper.generateTagPaths(node));
      });
      return { falttenTags, listTags, pathTags }
    }
  })

  public = new PromiseState({
    function: async () => {
      const version = await api.public.version.query()
      return { version }
    }
  })

  get showAi() {
    return this.config.value?.isUseAI && this.config.value?.aiApiKey
  }

  config = new PromiseState({
    function: async () => {
      return await api.config.list.query()
    }
  })

  task = new PromiseState({
    function: async () => {
      return await api.task.list.query()
    }
  })

  updateTask = new PromiseState({
    function: async (isStart) => {
      if (isStart) {
        await api.task.startDBackupTask.query({ time: '0 0 * * 0', immediate: true })
      } else {
        await api.task.stopDBackupTask.query()
      }
      await this.task.call()
    }
  })

  get DBTask() {
    return this.task.value?.find(i => i.name == DBBAK_TASK_NAME)
  }


  async onBottom() {
    await this.noteList.callNextPage({})
  }

  loadAllData() {
    this.tagList.call()
    this.noteList.resetAndCall({})
    this.config.call()
    this.dailyReviewNoteList.call()
  }

  use() {
    useEffect(() => {
      this.loadAllData()
      this.public.call()
      this.task.call()
    }, [])

    useEffect(() => {
      this.loadAllData()
    }, [this.updateTicker])
  }
}
