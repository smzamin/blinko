import '@mdxeditor/editor/style.css';
import '@/styles/editor.css';
import { RootStore } from '@/store';
import { PromiseState } from '@/store/standard/PromiseState';
import { useTheme } from 'next-themes';
import React, { ReactElement, useEffect, useState, useMemo, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { helper } from '@/lib/helper';
import { FileType, OnSendContentType } from './type';
import { MyPlugins, ProcessCodeBlocks } from './editorPlugins';
import { BlinkoStore } from '@/store/blinkoStore';
import { eventBus } from '@/lib/event';
import { _ } from '@/lib/lodash';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'usehooks-ts';
import { api } from '@/lib/trpc';
import { type Note, NoteType, type Attachment } from '@/server/types';
import { IsTagSelectVisible, showTagSelectPop } from '../PopoverFloat/tagSelectPop';
import { showAiWriteSuggestions } from '../PopoverFloat/aiWritePop';
import { AiStore } from '@/store/aiStore';
import { usePasteFile } from '@/lib/hooks';
import { getEditorElements, HandleFileType, UploadAction } from './editorUtils';
import { handleEditorKeyEvents } from './editorUtils';
import { ButtonWithTooltip, ChangeCodeMirrorLanguage, ConditionalContents, CreateLink, InsertCodeBlock, InsertImage, InsertSandpack, InsertTable, ListsToggle, MDXEditorMethods, ShowSandpackInfo, toolbarPlugin, ViewMode } from '@mdxeditor/editor';
import { Button, Divider, DropdownTrigger, DropdownItem, DropdownMenu, Dropdown, Input, PopoverTrigger, Popover, PopoverContent, Card } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { CameraIcon, CancelIcon, FileUploadIcon, HashtagIcon, LightningIcon, NotesIcon, SendIcon, VoiceIcon } from '../Icons';
import { AttachmentsRender, ReferenceRender } from '../AttachmentRender';
import { ShowCamera } from '../CameraDialog';
import { ShowAudioDialog } from '../AudioDialog';
import { DialogStore } from '@/store/module/Dialog';
import dayjs from 'dayjs';
import { ScrollArea } from '../ScrollArea';

const { MDXEditor } = await import('@mdxeditor/editor')

// https://mdxeditor.dev/editor/docs/theming
// https://react-dropzone.js.org/

type IProps = {
  mode: 'create' | 'edit',
  content: string,
  onChange?: (content: string) => void,
  onHeightChange?: () => void,
  onSend?: (args: OnSendContentType) => Promise<any>,
  isSendLoading?: boolean,
  bottomSlot?: ReactElement<any, any>,
  originFiles?: Attachment[],
  originReference?: number[],
  showCloseButton?: boolean
}

const Editor = observer(({ content, onChange, onSend, isSendLoading, bottomSlot, originFiles, originReference = [], mode, onHeightChange, showCloseButton }: IProps) => {
  content = ProcessCodeBlocks(content)
  const [canSend, setCanSend] = useState(false)
  const [references, setReferences] = useState<number[]>(originReference)
  const [referenceSearchList, setReferenceSearchList] = useState<Note[]>([])
  const [isShowSearch, setIsShowSearch] = useState(false)

  const { t } = useTranslation()
  const isPc = useMediaQuery('(min-width: 768px)')
  const mdxEditorRef = React.useRef<MDXEditorMethods>(null)
  const cardRef = React.useRef(null)

  const blinko = RootStore.Get(BlinkoStore)
  const ai = RootStore.Get(AiStore);
  const { theme } = useTheme();

  const pastedFiles = usePasteFile(cardRef);
  useEffect(() => {
    if (pastedFiles) {
      store.uploadFiles(pastedFiles)
    }
  }, [pastedFiles])

  const store = useLocalObservable(() => ({
    files: [] as FileType[],
    lastRange: null as Range | null,
    lastRangeText: '',
    viewMode: "rich-text" as ViewMode,
    lastSelection: null as Selection | null,
    handleIOSFocus() {
      try {
        if (helper.env.isIOS() && mode == 'edit') {
          store.focus(true)
        }
      } catch (error) { }
    },
    updateSendStatus() {
      if (store.files?.length == 0 && mdxEditorRef.current?.getMarkdown() == '') {
        return setCanSend(false)
      }
      if (store.files?.some(i => i.uploadPromise?.loading?.value === true)) {
        return setCanSend(false)
      }
      if (store.files?.every(i => !i?.uploadPromise?.loading?.value) && store.files?.length != 0) {
        return setCanSend(true)
      }
      if (mdxEditorRef.current?.getMarkdown() != '') {
        return setCanSend(true)
      }
    },
    replaceMarkdownTag(text: string, forceFocus = false) {
      if (mdxEditorRef.current) {
        if (store.lastRange) {
          console.log('replaceMarkdownTag', store.lastRangeText)
          const currentTextBeforeRange = store.lastRangeText.replace(/&#x20;/g, " ") ?? ''
          const currentText = mdxEditorRef.current!.getMarkdown().replace(/\\/g, '').replace(/&#x20;/g, " ")
          const tag = currentTextBeforeRange.replace(helper.regex.isEndsWithHashTag, "#" + text + '&#x20;')
          const MyContent = currentText.replace(currentTextBeforeRange, tag)
          mdxEditorRef.current.setMarkdown(MyContent)
          store.focus(forceFocus)
        }
      }
    },
    insertMarkdown(text) {
      const Mycontent = mdxEditorRef.current!.getMarkdown()
      mdxEditorRef.current!.setMarkdown(Mycontent + text)
      mdxEditorRef.current!.focus(() => {
        onChange?.(Mycontent + text)
      }, {
        defaultSelection: 'rootEnd'
      })
    },
    insertMarkdownByEvent(text) {
      mdxEditorRef.current!.insertMarkdown(text)
      store.focus()
    },
    focus(force = false) {
      if (force && store.lastRange) {
        const editorElements = getEditorElements()
        if (editorElements.length > 0) {
          editorElements.forEach(editorElement => {
            requestAnimationFrame(() => {
              const range = document.createRange()
              const selection = window.getSelection()
              const walker = document.createTreeWalker(
                editorElement,
                NodeFilter.SHOW_TEXT,
                null
              )
              let lastNode: any = null
              while (walker.nextNode()) {
                lastNode = walker.currentNode
              }
              if (lastNode) {
                range.setStart(lastNode, lastNode?.length)
                range.setEnd(lastNode, lastNode?.length)
                selection?.removeAllRanges()
                selection?.addRange(range)
                editorElement.focus()
              }
            })
          })
        }
        onChange?.(mdxEditorRef.current!.getMarkdown())
      } else {
        mdxEditorRef.current!.focus(() => {
          onChange?.(mdxEditorRef.current!.getMarkdown())
        }, {
          defaultSelection: 'rootEnd'
        })
      }
    },
    clearMarkdown() {
      if (mdxEditorRef.current) {
        mdxEditorRef.current.setMarkdown("")
        store.focus()
      }
    },
    inertHash() {
      mdxEditorRef.current!.insertMarkdown("&#x20;#")
      mdxEditorRef.current!.focus()
      store.handlePopTag()
    },
    async speechToText(filePath) {
      if (!blinko.showAi) {
        return
      }
      if (filePath.endsWith('.webm') || filePath.endsWith('.mp3') || filePath.endsWith('.wav')) {
        try {
          const doc = await api.ai.speechToText.mutate({ filePath })
          store.insertMarkdown(doc[0]?.pageContent)
        } catch (error) { }
      }
    },
    uploadFiles(acceptedFiles) {
      const _acceptedFiles = acceptedFiles.map(file => {
        const extension = helper.getFileExtension(file.name)
        const previewType = helper.getFileType(file.type, file.name)
        return {
          name: file.name,
          size: file.size,
          previewType,
          extension: extension ?? '',
          preview: URL.createObjectURL(file),
          uploadPromise: new PromiseState({
            function: async () => {
              store.updateSendStatus()
              const formData = new FormData();
              formData.append('file', file)
              const response = await fetch('/api/file/upload', {
                method: 'POST',
                body: formData,
              });
              const data = await response.json();
              store.speechToText(data.filePath)
              if (data.filePath) {
                return data.filePath
              }
            }
          }),
          type: file.type
        }
      })
      store.files.push(..._acceptedFiles)
      Promise.all(_acceptedFiles.map(i => i.uploadPromise.call())).then(() => {
        store.updateSendStatus()
      }).finally(() => {
        store.updateSendStatus()
      })
    },
    handlePopTag() {
      const selection = window.getSelection();
      if (selection!.rangeCount > 0) {
        if (!IsTagSelectVisible()) {
          let lastRange = selection!.getRangeAt(0);
          store.lastRange = lastRange
          store.lastRangeText = lastRange.endContainer.textContent?.slice(0, lastRange.endOffset) ?? ''
          store.lastSelection = selection
        }
        const hasHashTagRegex = /#[^\s#]+/g
        const endsWithBankRegex = /\s$/g
        const currentText = store.lastRange?.startContainer.textContent?.slice(0, store.lastRange?.endOffset) ?? ''
        const isEndsWithBank = endsWithBankRegex.test(currentText)
        const isEndsWithHashTag = helper.regex.isEndsWithHashTag.test(currentText)
        if (currentText == '' || !isEndsWithHashTag) {
          setTimeout(() => eventBus.emit('tagselect:hidden'))
          return
        }
        if (isEndsWithHashTag && currentText != '' && !isEndsWithBank) {
          const match = currentText.match(hasHashTagRegex)
          let searchText = match?.[match?.length - 1] ?? ''
          if (currentText.endsWith("#")) {
            searchText = ''
          }
          showTagSelectPop(searchText.toLowerCase())
        }
      }
    },
    handlePopAiWrite() {
      if (!blinko.showAi) {
        return
      }
      const selection = window.getSelection();
      if (selection!.rangeCount > 0) {
        const lastRange = selection!.getRangeAt(0);
        const currentText = lastRange.startContainer.textContent?.slice(0, lastRange.endOffset) ?? '';
        const isEndsWithSlash = /[^\s]?\/$/.test(currentText);
        if (currentText === '' || !isEndsWithSlash) {
          setTimeout(() => eventBus.emit('aiwrite:hidden'));
          return;
        }
        if (isEndsWithSlash) {
          showAiWriteSuggestions();
        }
      }
    },
    deleteLastChar() {
      const content = mdxEditorRef.current!.getMarkdown()
      mdxEditorRef.current!.setMarkdown(content.slice(0, -1))
    },
    setMarkdownLoading(loading: boolean) {
      if (loading) {
        mdxEditorRef.current!.insertMarkdown("Thinking...")
        store.focus()
      } else {
        const content = mdxEditorRef.current!.getMarkdown()
        const newContent = content.replace(/Thinking.../g, '')
        mdxEditorRef.current!.setMarkdown(newContent)
        store.focus()
      }
    }
  }))
  //fix ui not render
  useEffect(() => {
    store.updateSendStatus()
    onHeightChange?.()
  }, [blinko.noteTypeDefault, content, store.files?.length])

  useEffect(() => {
    eventBus.on('editor:replace', store.replaceMarkdownTag)
    eventBus.on('editor:clear', store.clearMarkdown)
    eventBus.on('editor:insert', store.insertMarkdownByEvent)
    eventBus.on('editor:deleteLastChar', store.deleteLastChar)
    eventBus.on('editor:focus', store.focus)
    eventBus.on('editor:setMarkdownLoading', store.setMarkdownLoading)
    eventBus.on('editor:setViewMode', (mode) => store.viewMode = (mode))
    handleEditorKeyEvents()
    store.handleIOSFocus()

    return () => {
      eventBus.off('editor:replace', store.replaceMarkdownTag)
      eventBus.off('editor:clear', store.clearMarkdown)
      eventBus.off('editor:insert', store.insertMarkdownByEvent)
      eventBus.off('editor:deleteLastChar', store.deleteLastChar)
      eventBus.off('editor:focus', store.focus)
      eventBus.off('editor:setMarkdownLoading', store.setMarkdownLoading)
      eventBus.off('editor:setViewMode', (mode) => store.viewMode = (mode))
    }
  }, [])

  useEffect(() => {
    if (originFiles?.length != 0) {
      store.files = HandleFileType(originFiles!)
    }
    setReferenceSearchList(blinko.referenceSearchList?.value ?? [])
  }, [originFiles,blinko.referenceSearchList.value])

  const {
    getRootProps,
    isDragAccept,
    getInputProps,
    open
  } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: acceptedFiles => {
      store.uploadFiles(acceptedFiles)
    }
  });

  const uploadActions: UploadAction[] = [
    {
      key: 'file',
      icon: <FileUploadIcon className='hover:opacity-80 transition-all' />,
      title: t('upload-file'),
      onClick: open,
    },
    {
      key: 'audio',
      icon: <VoiceIcon className='primary-foreground group-hover:rotate-[180deg] transition-all' />,
      title: t('recording'),
      onClick: () => ShowAudioDialog((file) => store.uploadFiles([file])),
      showCondition: blinko.showAi,
    },
    {
      key: 'camera',
      icon: <CameraIcon className='primary-foreground group-hover:rotate-[180deg] transition-all' />,
      title: t('camera'),
      onClick: () => ShowCamera((file) => store.uploadFiles([file])),
    },
  ];

  const renderUploadButtons = () => {
    if (isPc) {
      return (
        <>
          {uploadActions
            .filter(action => action.showCondition !== false)
            .map(action => (
              <ButtonWithTooltip
                key={action.key}
                className='!w-[24px] !h-[24px]'
                title={action.title}
                onClick={action.onClick}
              >
                {action.key === 'file' && <input {...getInputProps()} />}
                {action.icon}
              </ButtonWithTooltip>
            ))}
        </>
      );
    }

    return (
      <>
        <input {...getInputProps()} className="hidden" id="mobile-file-input" />
        <Dropdown>
          <DropdownTrigger>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="!w-[24px] !h-[24px]"
            >
              <FileUploadIcon className='hover:opacity-80 transition-all' />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Upload Actions">
            {uploadActions
              .filter(action => action.showCondition !== false)
              .map(action => (
                <DropdownItem
                  key={action.key}
                  startContent={action.icon}
                  onClick={() => {
                    if (action.key === 'file') {
                      document.getElementById('mobile-file-input')?.click();
                    } else {
                      action.onClick();
                    }
                  }}
                >
                  {action.title}
                </DropdownItem>
              ))}
          </DropdownMenu>
        </Dropdown>
      </>
    );
  };

  const throttleSearchRef = useRef(_.throttle((searchText: string) => {
    blinko.referenceSearchList.resetAndCall({ searchText })
  }, 500, { trailing: true, leading: false }));

  return <Card
    shadow='none' {...getRootProps()}
    className={`p-2 relative border-2 border-border transition-all 
    ${isDragAccept ? 'border-2 border-green-500 border-dashed transition-all' : ''} ${store.viewMode == 'source' ? 'border-red-500' : ''}`}>

    <div ref={cardRef}
      onKeyUp={async event => {
        event.preventDefault();
        if (event.key === 'Enter' && event.ctrlKey) {
          await onSend?.({
            content,
            files: store.files.map(i => { return { ...i, uploadPath: i.uploadPromise.value, type: i.type } }),
            references
          })
          onChange?.('')
          store.files = []
        }
      }}
      onKeyDown={e => {
        onHeightChange?.()
      }}>
      <MDXEditor
        translation={(key, defaultValue) => {
          if (key == 'toolbar.bulletedList') return t('bulleted-list');
          if (key == 'toolbar.numberedList') return t('numbered-list');
          if (key == 'toolbar.checkList') return t('check-list');
          if (key == 'toolbar.table') return t('insert-table');
          if (key == 'toolbar.codeBlock') return t('insert-codeblock');
          if (key == 'toolbar.insertSandpack') return t('insert-sandpack');
          return defaultValue
        }}
        ref={mdxEditorRef}
        placeholder={t('i-have-a-new-idea')}
        className={theme == 'dark' ? "dark-theme dark-editor" : ''}
        contentEditableClassName='prose'
        onChange={v => {
          onChange?.(v)
          store.handlePopTag()
          store.handlePopAiWrite()
        }}
        autoFocus={{
          defaultSelection: 'rootEnd'
        }}
        markdown={content}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <div className='flex flex-col w-full'>
                {/******************** AttchMent Render *****************/}
                {store.files.length > 0 && (
                  <div className='w-full my-2'>
                    <AttachmentsRender files={store.files} />
                  </div>
                )}

                {/******************** Reference Render *****************/}
                <div className='w-full mb-2'>
                  <ReferenceRender references={references} onDelete={(id) => {
                    setReferences(references.filter(i => i != id))
                  }} />
                </div>

                {/******************** Source/Rich Text Text *****************/}
                {store.viewMode == 'source' && <div className='text-red-500 text-xs select-none'>Source Code Mode</div>}

                {/******************** Mode Render *****************/}
                <div className='flex w-full items-center'>
                  <ButtonWithTooltip className='!w-[24px] !h-[24px]' title={
                    blinko.noteTypeDefault == NoteType.BLINKO ? t('blinko') : t('note')
                  } onClick={() => {
                    blinko.noteTypeDefault = blinko.noteTypeDefault == NoteType.BLINKO ? NoteType.NOTE : NoteType.BLINKO;
                  }}>
                    {blinko.noteTypeDefault == NoteType.BLINKO ?
                      <LightningIcon className='blinko' /> :
                      <NotesIcon className='note' />
                    }
                  </ButtonWithTooltip>

                  {/******************** Insert Hashtag *****************/}
                  <ButtonWithTooltip className='!w-[24px] !h-[24px] ' title={t('insert-hashtag')} onClick={() => {
                    store.inertHash();
                  }}>
                    <HashtagIcon />
                  </ButtonWithTooltip>

                  {/******************** Insert Reference *****************/}
                  <Popover placement="bottom" backdrop='blur' isOpen={isShowSearch} onOpenChange={setIsShowSearch}>
                    <PopoverTrigger>
                      <div className='!w-[24px] !h-[24px] hover:bg-hover rounded-md flex items-center justify-center ml-1' onClick={e => {
                        blinko.referenceSearchList.resetAndCall({ searchText: ' ' })
                      }}>
                        <Icon icon="hugeicons:at" width="24" height="24" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className='flex flex-col max-w-[300px]'>
                      <Input onChange={e => throttleSearchRef.current?.(e.target.value)} type='text' autoFocus className='w-full my-2 focus:outline-none focus:ring-0' placeholder='Search' size='sm' endContent={<Icon className='cursor-pointer' icon="tabler:search" width="24" height="24" />} />
                      <ScrollArea className='max-h-[400px] max-w-[290px]' onBottom={() => { blinko.referenceSearchList.callNextPage({}) }}>
                        {
                          referenceSearchList && referenceSearchList?.map(i => {
                            return <div className={`flex flex-col w-full p-1 bg-background hover:bg-hover rounded-md cursor-pointer 
                              ${(references?.includes(i.id!) || i.id == blinko.curSelectedNote?.id) ? 'opacity-50 not-allowed' : ''}`}
                              onClick={e => {
                                console.log('references', references, i.id)
                                if (references?.includes(i.id!)) return
                                setReferences([...references!, i.id!])
                                console.log('references', references)
                                setIsShowSearch(false)
                              }}>
                              <div className='flex flex-col w-full p-1'>
                                <div className='text-xs text-desc'>
                                  {blinko.config.value?.timeFormat == 'relative'
                                    ? dayjs(blinko.config.value?.isOrderByCreateTime ? i.createdAt : i.updatedAt).fromNow()
                                    : dayjs(blinko.config.value?.isOrderByCreateTime ? i.createdAt : i.updatedAt).format(blinko.config.value?.timeFormat ?? 'YYYY-MM-DD HH:mm:ss')
                                  }
                                </div>
                                <div className='text-sm line-clamp-2'>
                                  {i.content}
                                </div>
                              </div>
                            </div>
                          })
                        }
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>

                  <Divider orientation="vertical" />

                  {/******************** Insert List *****************/}
                  <ListsToggle />
                  {isPc && <InsertTable />}
                  {isPc && <InsertImage />}

                  {/* <CreateLink /> */}

                  {/******************** Insert Code *****************/}
                  <ConditionalContents
                    options={[
                      { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
                      { when: (editor) => editor?.editorType === 'sandpack', contents: () => <ShowSandpackInfo /> },
                      {
                        fallback: () => (<>
                          {isPc && <InsertCodeBlock />}
                          {isPc && <InsertSandpack />}
                        </>)
                      }
                    ]}
                  />

                  <Divider orientation="vertical" />

                  {/******************** Upload Render *****************/}
                  {renderUploadButtons()}

                  {/******************** View Mode Render *****************/}
                  <ButtonWithTooltip
                    title={store.viewMode === 'source' ? t('preview-mode') : t('source-code')}
                    className='!ml-auto'
                    onClick={() => {
                      const nextMode = store.viewMode === 'source' ? 'rich-text' : 'source';
                      eventBus.emit('editor:setViewMode', nextMode);
                    }}
                  >
                    {store.viewMode !== 'source' ?
                      <Icon icon="tabler:source-code" className='transition-all' /> :
                      <Icon icon="grommet-icons:form-view" className='transition-all !text-red-500' />
                    }
                  </ButtonWithTooltip>

                  {/******************** Send Render *****************/}
                  <Button
                    isDisabled={!canSend}
                    size='sm'
                    radius='md'
                    isLoading={isSendLoading}
                    onClick={async () => {
                      await onSend?.({
                        content: mdxEditorRef.current?.getMarkdown() ?? '',
                        files: store.files.map(i => ({ ...i, uploadPath: i.uploadPromise.value })),
                        references
                      });
                      onChange?.('');
                      store.files = [];
                      ai.isWriting = false;
                      setReferences([])
                    }}
                    className={`ml-2 w-[60px] group`}
                    isIconOnly
                    color='primary'
                  >
                    {store.files?.some(i => i.uploadPromise?.loading?.value) ?
                      <Icon icon="line-md:uploading-loop" width="24" height="24" /> :
                      <SendIcon className='primary-foreground !text-primary-foreground group-hover:rotate-[-35deg] transition-all' />
                    }
                  </Button>
                </div>
              </div>
            )
          }),
          ...MyPlugins
        ]}
      />
    </div>
  </Card >
})

export default Editor

