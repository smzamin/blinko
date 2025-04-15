"use client";
import { eventBus } from '@/lib/event';
import { helper } from '@/lib/helper';
import i18n from '@/lib/i18n';
import { api } from '@/lib/trpc';
import { Attachment, NoteType, type Note } from '@/server/types';
import { action, makeAutoObservable, observable } from 'mobx';
import { useEffect } from 'react';
import { BaseStore } from './baseStore';
import { ToastPlugin } from './module/Toast/Toast';
import { RootStore } from './root';
import { PromisePageState, PromiseState } from './standard/PromiseState';
import { StorageListState } from './standard/StorageListState';
import { StorageState } from './standard/StorageState';
import { Store } from './standard/base';
import { UserStore } from './user';

type filterType = {
  label: string;
  sortBy: string;
  direction: string;
}

// Interface for note upsert parameters
interface UpsertNoteParams {
  /** Note content */
  content?: string | null;
  /** Whether the note is archived */
  isArchived?: boolean;
  /** Whether the note is in recycle bin */
  isRecycle?: boolean;
  /** Note type */
  type?: NoteType;
  /** Note ID */
  id?: number;
  /** List of attachments */
  attachments?: Attachment[];
  /** Whether to refresh the list after operation */
  refresh?: boolean;
  /** Whether the note is pinned to top */
  isTop?: boolean;
  /** Whether the note is publicly shared */
  isShare?: boolean;
  /** Whether to show toast notification */
  showToast?: boolean;
  /** List of referenced note IDs */
  references?: number[];
  /** Creation time */
  createdAt?: Date;
  /** Last update time */
  updatedAt?: Date;
  /** Metadata */
  metadata?: any;
}

interface OfflineNote extends Omit<Note, 'id' | 'references'> {
  id: number;
  isOffline: boolean;
  pendingSync: boolean;
  references: { toNoteId: number }[];
}

export class BlinkoStore implements Store {
  sid = 'BlinkoStore';
  noteContent = '';
  createContentStorage = new StorageState<{ content: string }>({
    key: 'createModeNote',
    default: { content: '' }
  });
  createAttachmentsStorage = new StorageListState<{ name: string, path: string, type: string, size: number }>({
    key: 'createModeAttachments',
  });
  editContentStorage = new StorageListState<{ content: string, id: number }>({
    key: 'editModeNotes'
  });
  editAttachmentsStorage = new StorageListState<{ name: string, path: string, type: string, size: number, id: number }>({
    key: 'editModeAttachments'
  });

  searchText: string = '';
  isCreateMode: boolean = true
  curSelectedNote: Note | null = null;
  curMultiSelectIds: number[] = [];
  isMultiSelectMode: boolean = false;
  forceQuery: number = 0;
  allTagRouter = {
    title: 'total',
    href: '/?path=all',
    icon: ''
  }
  noteListFilterConfig = {
    isArchived: false as boolean | null,
    isRecycle: false,
    isShare: null as boolean | null,
    type: 0,
    tagId: null as number | null,
    withoutTag: false,
    withFile: false,
    withLink: false,
    isUseAiQuery: false,
    startDate: null as Date | null,
    endDate: null as Date | null,
    hasTodo: false
  }
  noteTypeDefault: NoteType = NoteType.BLINKO
  currentCommonFilter: filterType | null = null
  updateTicker = 0
  fullNoteList: Note[] = []

  // For global search
  globalSearchTerm: '';
  // Will be set to true when the global search modal is opened
  isGlobalSearchOpen: false;
  // For search results presentation
  searchResults = {
    notes: [],
    resources: [],
    settings: []
  };

  offlineNoteStorage = new StorageListState<OfflineNote>({ key: 'offlineNotes' });

  get offlineNotes(): OfflineNote[] {
    return this.offlineNoteStorage.list;
  }

  get isOnline(): boolean {
    return RootStore.Get(BaseStore).isOnline;
  }

  private saveOfflineNote(note: OfflineNote) {
    this.offlineNoteStorage.push(note);
  }

  private removeOfflineNote(id: number) {
    const index = this.offlineNoteStorage.list?.findIndex(note => note.id === id);
    if (index !== -1) {
      this.offlineNoteStorage.remove(index);
    }
  }

  upsertNote = new PromiseState({
    eventKey: 'upsertNote',
    function: async (params: UpsertNoteParams) => {
      console.log("upsertNote", params)
      const {
        content = null,
        isArchived,
        isRecycle,
        type,
        id,
        attachments = [],
        refresh = true,
        isTop,
        isShare,
        showToast = true,
        references = [],
        createdAt: inputCreatedAt,
        updatedAt: inputUpdatedAt,
        metadata
      } = params;

      if (!this.isOnline && !id) {
        const now = new Date();
        const offlineNote: OfflineNote = {
          id: now.getTime(),
          content: content || '',
          type,
          isArchived: !!isArchived,
          isRecycle: !!isRecycle,
          attachments: attachments || [],
          isTop: !!isTop,
          isShare: !!isShare,
          references: references.map(refId => ({ toNoteId: refId })),
          createdAt: now,
          updatedAt: now,
          isOffline: true,
          pendingSync: true,
          tags: [],
          metadata: metadata || {}
        };

        this.saveOfflineNote(offlineNote);
        showToast && RootStore.Get(ToastPlugin).success(i18n.t("create-successfully") + '-' + i18n.t("offline-status"));
        return offlineNote;
      }

      const res = await api.notes.upsert.mutate({
        content,
        type,
        isArchived,
        isRecycle,
        id,
        attachments,
        isTop,
        isShare,
        references,
        createdAt: inputCreatedAt ? new Date(inputCreatedAt) : undefined,
        updatedAt: inputUpdatedAt ? new Date(inputUpdatedAt) : undefined,
        metadata
      });
      eventBus.emit('editor:clear')
      showToast && RootStore.Get(ToastPlugin).success(id ? i18n.t("update-successfully") : i18n.t("create-successfully"))
      refresh && this.updateTicker++
      return res
    }
  })

  shareNote = new PromiseState({
    function: async (params: { id: number, isCancel: boolean, password?: string, expireAt?: Date }) => {
      const res = await api.notes.shareNote.mutate(params)
      RootStore.Get(ToastPlugin).success(i18n.t("operation-success"))
      this.updateTicker++
      return res
    }
  })

  internalShareNote = new PromiseState({
    function: async (params: { id: number, accountIds: number[], isCancel: boolean }) => {
      const res = await api.notes.internalShareNote.mutate(params)
      RootStore.Get(ToastPlugin).success(i18n.t("operation-success"))
      this.updateTicker++
      return res
    }
  })

  getInternalSharedUsers = new PromiseState({
    function: async (id: number) => {
      return await api.notes.getInternalSharedUsers.mutate({ id })
    }
  })

  async syncOfflineNotes() {
    if (!this.isOnline) return;

    const offlineNotes = [...this.offlineNotes];
    for (const note of offlineNotes) {
      if (note.pendingSync) {
        try {
          const { id, isOffline, pendingSync, references, ...noteData } = note;
          const onlineNote: UpsertNoteParams = {
            ...noteData,
            references: references.map(ref => ref.toNoteId),
            showToast: false
          };
          await this.upsertNote.call(onlineNote);
          this.removeOfflineNote(id);
        } catch (error) {
          console.error('Failed to sync offline note:', error);
        }
      }
    }
    this.updateTicker++;
  }

  noteList = new PromisePageState({
    function: async ({ page, size }) => {
      let notes: Note[] = [];

      if (this.isOnline) {
        notes = await api.notes.list.mutate({ ...this.noteListFilterConfig, searchText: this.searchText, page, size });
        if (this.offlineNotes.length > 0) {
          await this.syncOfflineNotes();
        }
      }

      const mergedNotes = [...this.offlineNotes, ...notes]
        .map(i => ({ ...i, isExpand: false }))

      if (!this.isOnline) {
        const start = (page - 1) * size;
        const end = start + size;
        return mergedNotes.slice(start, end);
      }

      return mergedNotes;
    }
  })

  referenceSearchList = new PromisePageState({
    function: async ({ page, size, searchText }) => {
      return await api.notes.list.mutate({
        searchText
      })
    }
  })

  userList = new PromiseState({
    function: async () => {
      return await api.users.list.query()
    }
  })

  noteDetail = new PromiseState({
    function: async ({ id }) => {
      return await api.notes.detail.mutate({ id })
    }
  })

  dailyReviewNoteList = new PromiseState({
    function: async () => {
      return await api.notes.dailyReviewNoteList.query()
    }
  })

  randomReviewNoteList = new PromiseState({
    function: async ({ limit = 30 }) => {
      return await api.notes.randomNoteList.query({ limit })
    }
  })

  resourceList = new PromisePageState({
    function: async ({ page, size, searchText, folder }) => {
      return await api.attachments.list.query({ page, size, searchText, folder })
    }
  })

  tagList = new PromiseState({
    function: async () => {
      const falttenTags = await api.tags.list.query(undefined, { context: { skipBatch: true } });
      const listTags = helper.buildHashTagTreeFromDb(falttenTags)
      console.log(falttenTags, 'listTags')
      let pathTags: string[] = [];
      listTags.forEach(node => {
        pathTags = pathTags.concat(helper.generateTagPaths(node));
      });
      return { falttenTags, listTags, pathTags }
    }
  })

  get showAi() {
    return this.config.value?.isUseAI
  }

  config = new PromiseState({
    function: async () => {
      return await api.config.list.query()
    }
  })

  task = new PromiseState({
    function: async () => {
      try {
        // if (RootStore.Get(UserStore).role == 'superadmin') {
        //   return (await api.task.list.query()) ?? [];
        // }
        return []
      } catch (error) {
        return []
      }
    }
  })

  updateDBTask = new PromiseState({
    function: async (isStart) => {
      // if (isStart) {
      //   await api.task.upsertTask.mutate({ type: 'start', task: DBBAK_TASK_NAME })
      // } else {
      //   await api.task.upsertTask.mutate({ type: 'stop', task: DBBAK_TASK_NAME })
      // }
      await this.task.call()
    }
  })
  updateArchiveTask = new PromiseState({
    function: async (isStart) => {
      // if (isStart) {
      //   await api.task.upsertTask.mutate({ type: 'start', task: ARCHIVE_BLINKO_TASK_NAME })
      // } else {
      //   await api.task.upsertTask.mutate({ type: 'stop', task: ARCHIVE_BLINKO_TASK_NAME })
      // }
      await this.task.call()
    }
  })


  get DBTask() {
    return // this.task.value?.find(i => i.name == DBBAK_TASK_NAME)
  }

  get ArchiveTask() {
    return // this.task.value?.find(i => i.name == ARCHIVE_BLINKO_TASK_NAME)
  }


  async onBottom() {
    await this.noteList.callNextPage({})
  }

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

  firstLoad() {
    this.tagList.call()
    this.config.call()
    this.dailyReviewNoteList.call()
    this.task.call()
  }


  async refreshData() {
    this.tagList.call()
    this.noteList.resetAndCall({})
    this.config.call()
    this.dailyReviewNoteList.call()
  }

  private clear() {
    this.createContentStorage.clear()
    this.editContentStorage.clear()
  }

  use() {
    useEffect(() => {
      this.firstLoad()
    }, [RootStore.Get(UserStore).id])

    useEffect(() => {
      if (this.updateTicker == 0) return
      this.refreshData()
    }, [this.updateTicker])
  }

  useQuery(router) {
    const { tagId, withoutTag, withFile, withLink, searchText, hasTodo, path } = router.query;
    useEffect(() => {
      if (!router.isReady) return
      this.noteListFilterConfig.type = NoteType.BLINKO
      this.noteTypeDefault = NoteType.BLINKO
      this.noteListFilterConfig.tagId = null
      this.noteListFilterConfig.isArchived = false
      this.noteListFilterConfig.withoutTag = false
      this.noteListFilterConfig.withLink = false
      this.noteListFilterConfig.withFile = false
      this.noteListFilterConfig.isRecycle = false
      this.noteListFilterConfig.startDate = null
      this.noteListFilterConfig.endDate = null
      this.noteListFilterConfig.isShare = null
      this.noteListFilterConfig.hasTodo = false

      if (path == 'notes') {
        this.noteListFilterConfig.type = NoteType.NOTE
        // this.noteTypeDefault = NoteType.NOTE
      }
      if (tagId) {
        this.noteListFilterConfig.tagId = Number(tagId) as number
      }
      if (withoutTag) {
        this.noteListFilterConfig.withoutTag = true
      }
      if (withLink) {
        this.noteListFilterConfig.withLink = true
      }
      if (withFile) {
        this.noteListFilterConfig.withFile = true
      }
      if (hasTodo) {
        this.noteListFilterConfig.hasTodo = true
      }
      if (searchText) {
        this.searchText = searchText as string;
      } else {
        this.searchText = '';
      }

      if (path == 'all') {
        this.noteListFilterConfig.type = -1
      }
      if (path == 'archived') {
        this.noteListFilterConfig.type = -1
        this.noteListFilterConfig.isArchived = true
      }
      if (path == 'trash') {
        this.noteListFilterConfig.type = -1
        this.noteListFilterConfig.isRecycle = true
      }
      this.noteList.resetAndCall({})
    }, [router.isReady, this.forceQuery, router?.query?.path, router?.query?.searchText])
  }

  @observable
  excludeEmbeddingTagId: number | null = null;

  @action
  setExcludeEmbeddingTagId(tagId: number | null) {
    this.excludeEmbeddingTagId = tagId;
  }

  settingsSearchText: string = '';

  constructor() {
    makeAutoObservable(this)
    eventBus.on('user:signout', () => {
      this.clear()
    })
  }

  removeCreateAttachments(file: { name: string, }) {
    this.createAttachmentsStorage.removeByFind(f => f.name === file.name);
    this.updateTicker++;
  }
}
