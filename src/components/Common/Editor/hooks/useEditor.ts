import { useEffect } from 'react';
import { eventBus } from '@/lib/event';
import { EditorStore } from '../editorStore';
import { handleEditorKeyEvents } from '../editorUtils';
import { HandleFileType } from '../editorUtils';
import { BlinkoStore } from '@/store/blinkoStore';
import { usePasteFile } from '@/lib/hooks';
import { OnSendContentType } from '../type';

export const useEditorInit = (
  store: EditorStore,
  mdxEditorRef: any,
  onChange: ((content: string) => void) | undefined,
  onSend: (args: OnSendContentType) => Promise<any>,
  mode: 'create' | 'edit',
  originReference: number[] = []
) => {
  useEffect(() => {
    if (mdxEditorRef.current) {
      store.init({
        onChange,
        onSend,
        mode,
        mdxEditorRef
      });
    }
  }, [onChange, mode, mdxEditorRef.current]);

  useEffect(() => {
    store.references = originReference
    if(store.references.length > 0) {
      store.noteListByIds.call({ids: store.references})
    }
  }, []);

};

export const useEditorEvents = (store: EditorStore) => {
  useEffect(() => {
    eventBus.on('editor:replace', store.replaceMarkdownTag);
    eventBus.on('editor:clear', store.clearMarkdown);
    eventBus.on('editor:insert', store.insertMarkdownByEvent);
    eventBus.on('editor:deleteLastChar', store.deleteLastChar);
    eventBus.on('editor:focus', store.focus);
    eventBus.on('editor:setMarkdownLoading', store.setMarkdownLoading);
    eventBus.on('editor:setViewMode', (mode) => store.viewMode = mode);

    handleEditorKeyEvents();
    store.handleIOSFocus();

    return () => {
      eventBus.off('editor:replace', store.replaceMarkdownTag);
      eventBus.off('editor:clear', store.clearMarkdown);
      eventBus.off('editor:insert', store.insertMarkdownByEvent);
      eventBus.off('editor:deleteLastChar', store.deleteLastChar);
      eventBus.off('editor:focus', store.focus);
      eventBus.off('editor:setMarkdownLoading', store.setMarkdownLoading);
      eventBus.off('editor:setViewMode', (mode) => store.viewMode = mode);
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
      store.files = HandleFileType(originFiles);
    }
  }, [originFiles]);
};

export const useEditorPaste = (store: EditorStore, cardRef: React.RefObject<any>) => {
  const pastedFiles = usePasteFile(cardRef);

  useEffect(() => {
    if (pastedFiles) {
      store.uploadFiles(pastedFiles);
    }
  }, [pastedFiles]);
};

export const useEditorHeight = (
  onHeightChange: (() => void) | undefined,
  blinko: BlinkoStore,
  content: string,
  files: any[]
) => {
  useEffect(() => {
    onHeightChange?.();
  }, [blinko.noteTypeDefault, content, files?.length]);
}; 