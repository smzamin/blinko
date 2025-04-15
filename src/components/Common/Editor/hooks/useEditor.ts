import { eventBus } from '@/lib/event';
import { api } from '@/lib/trpc';
import { NoteType, toNoteTypeEnum } from '@/server/types';
import { RootStore } from '@/store';
import { BlinkoStore } from '@/store/blinkoStore';
import { UserStore } from '@/store/user';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'usehooks-ts';
import Vditor from 'vditor';
import { EditorStore } from '../editorStore';
import { ToolbarMobile, ToolbarPC } from '../EditorToolbar';
import { AIExtend, Extend } from '../EditorToolbar/extends';
import { i18nEditor } from '../EditorToolbar/i18n';
import { FocusEditorFixMobile, HandleFileType } from '../editorUtils';
import { OnSendContentType } from '../type';

export const useEditorInit = (
  store: EditorStore,
  onChange: ((content: string) => void) | undefined,
  onSend: (args: OnSendContentType) => Promise<any>,
  mode: 'create' | 'edit' | 'comment',
  originReference: number[] = [],
  content: string
) => {
  const { t } = useTranslation()
  const router = useRouter()
  const isPc = useMediaQuery('(min-width: 768px)')
  const blinko = RootStore.Get(BlinkoStore)

  useEffect(() => {
    const showToolbar = store.isShowEditorToolbar(isPc)
    if (store.vditor) {
      store.vditor?.destroy();
      store.vditor = null
    }

    const theme = RootStore.Get(UserStore).theme
    const vditor = new Vditor("vditor" + "-" + mode, {
      width: '100%',
      "toolbar": isPc ? ToolbarPC : ToolbarMobile,
      mode: isPc ? store.viewMode : (store.viewMode == 'ir' ? 'ir' : store.viewMode),
      theme,
      hint: {
        extend: mode != 'comment' ? Extend : AIExtend
      },
      async ctrlEnter(md) {
        await store.handleSend()
      },
      placeholder: t('i-have-a-new-idea'),
      i18n: {
        ...i18nEditor(t)
      },
      input: (value) => {
        onChange?.(value)
      },
      upload: {
        url: '/api/file/upload',
        success: (editor, res) => {
          const { fileName, filePath, type, size } = JSON.parse(res)
          store.handlePasteFile({
            fileName,
            filePath,
            type,
            size
          })
        },
        max: 1024 * 1024 * 1000,
        fieldName: 'file',
        multiple: false,
        linkToImgUrl: '/api/file/upload-by-url',
        linkToImgFormat(res) {
          const data = JSON.parse(res)
          const result = {
            msg: '',
            code: 0,
            data: {
              originalURL: data.originalURL,
              url: data.filePath,
            }
          }
          return JSON.stringify(result)
        }
      },
      tab: '\t',
      undoDelay: 20,
      value: content,
      toolbarConfig: {
        hide: !showToolbar,
      },
      preview: {
        hljs: {
          style: theme === 'dark' ? 'github-dark' : 'github',
          lineNumber: true,
        },
        theme,
        delay: 20
      },
      after: () => {
        vditor.setValue(content);
        store.init({
          onChange,
          onSend,
          mode,
          vditor
        });
        isPc ? store.focus() : FocusEditorFixMobile()
      },
    });
    // Clear the effect
    return () => {
      store.vditor?.destroy();
      store.vditor = null;
    };

  }, [mode, blinko.config.value?.toolbarVisibility, store.viewMode, isPc]);

  useEffect(() => {
    store.references = originReference
    if (store.references.length > 0) {
      store.noteListByIds.call({ ids: store.references })
    }
  }, []);

  useEffect(() => {
    if (mode == 'create') {
      if (router.query.path == 'notes') {
        store.noteType = NoteType.NOTE
      } else {
        store.noteType = NoteType.BLINKO
      }
      if (router.query.tagId) {
        try {
          api.tags.fullTagNameById.query({ id: Number(router.query.tagId) }).then(res => {
            store.currentTagLabel = res
          })
        } catch (error) {
          console.error(error)
        }
      } else {
        store.currentTagLabel = ''
      }
    } else {
      store.noteType = toNoteTypeEnum(blinko.curSelectedNote?.type)
    }
  }, [mode, router?.query?.path, router?.query?.tagId]);
};


export const useEditorEvents = (store: EditorStore) => {
  const adjustEditorHeight = () => {
    if (!store.isFullscreen) return;

    requestAnimationFrame(() => {
      const editorElement = document.querySelector('.vditor-ir .vditor-reset') as HTMLElement;
      const attachmentContainer = document.querySelector('.attachment-container') as HTMLElement;
      const referenceContainer = document.querySelector('.reference-container') as HTMLElement;

      if (editorElement) {
        const attachmentHeight = attachmentContainer?.offsetHeight || 0;
        const referenceHeight = referenceContainer?.offsetHeight || 0;
        const toolbarHeight = 50;
        const padding = 40;

        const availableHeight = `calc(100vh - ${toolbarHeight + attachmentHeight + referenceHeight + padding}px)`;
        editorElement.style.height = availableHeight;
        editorElement.style.maxHeight = availableHeight;
      }
    });
  };

  useEffect(() => {
    if (store.isFullscreen) {
      adjustEditorHeight();
    }
  }, [store.files.length, store.references.length]);

  const handleFullScreen = (isFullscreen: boolean) => {
    store.setFullscreen(isFullscreen);
    if (isFullscreen) {
      adjustEditorHeight();
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(adjustEditorHeight);
      });

      const attachmentContainer = document.querySelector('.attachment-container');
      const referenceContainer = document.querySelector('.reference-container');
      const editorContainer = document.querySelector('.vditor') as HTMLElement;

      if (attachmentContainer) resizeObserver.observe(attachmentContainer);
      if (referenceContainer) resizeObserver.observe(referenceContainer);
      if (editorContainer) resizeObserver.observe(editorContainer);

      (store as any)._resizeObserver = resizeObserver;

      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(adjustEditorHeight);
      });

      if (attachmentContainer) {
        mutationObserver.observe(attachmentContainer, {
          childList: true,
          subtree: true,
          attributes: true
        });
      }
      if (referenceContainer) {
        mutationObserver.observe(referenceContainer, {
          childList: true,
          subtree: true,
          attributes: true
        });
      }

      (store as any)._mutationObserver = mutationObserver;
    } else {
      const editorElement = document.querySelector('.vditor-ir .vditor-reset') as HTMLElement;
      if (editorElement) {
        editorElement.style.height = '';
        editorElement.style.maxHeight = '';
      }
      if ((store as any)._resizeObserver) {
        (store as any)._resizeObserver.disconnect();
        (store as any)._resizeObserver = null;
      }
      if ((store as any)._mutationObserver) {
        (store as any)._mutationObserver.disconnect();
        (store as any)._mutationObserver = null;
      }
    }
  };

  useEffect(() => {
    eventBus.on('editor:clear', store.clearMarkdown);
    eventBus.on('editor:insert', store.insertMarkdown);
    eventBus.on('editor:replace', store.replaceMarkdown);
    eventBus.on('editor:focus', store.focus);
    eventBus.on('editor:setViewMode', (mode) => {
      store.viewMode = mode;
      if (store.isFullscreen) {
        adjustEditorHeight();
      }
    });
    eventBus.on('editor:setFullScreen', handleFullScreen);
    store.handleIOSFocus();

    return () => {
      eventBus.off('editor:clear', store.clearMarkdown);
      eventBus.off('editor:insert', store.insertMarkdown);
      eventBus.off('editor:replace', store.replaceMarkdown);
      eventBus.off('editor:focus', store.focus);
      eventBus.off('editor:setViewMode', (mode) => {
        store.viewMode = mode;
      });
      eventBus.off('editor:setFullScreen', handleFullScreen);
      if ((store as any)._resizeObserver) {
        (store as any)._resizeObserver.disconnect();
        (store as any)._resizeObserver = null;
      }
      if ((store as any)._mutationObserver) {
        (store as any)._mutationObserver.disconnect();
        (store as any)._mutationObserver = null;
      }
    };
  }, []);
};

export const useEditorFiles = (
  store: EditorStore,
  blinko: BlinkoStore,
  originFiles?: any[],
) => {
  useEffect(() => {
    if (originFiles?.length) {
      console.log({ originFiles })
      store.files = HandleFileType(originFiles);
    }
  }, [originFiles]);
};

export const useEditorHeight = (
  onHeightChange: (() => void) | undefined,
  blinko: BlinkoStore,
  content: string,
  store: EditorStore
) => {
  useEffect(() => {
    onHeightChange?.();
  }, [store.noteType, content, store.files?.length, store.viewMode]);
};