import '@mdxeditor/editor/style.css';
import { RootStore } from '@/store';
import { PromiseState } from '@/store/standard/PromiseState';
import { ButtonWithTooltip, ChangeCodeMirrorLanguage, ConditionalContents, InsertCodeBlock, InsertSandpack, InsertTable, ListsToggle, MDXEditorMethods, SandpackConfig, sandpackPlugin, Select, ShowSandpackInfo, SingleChoiceToggleGroup, toolbarPlugin, UndoRedo, type CodeBlockEditorDescriptor } from '@mdxeditor/editor';
import { Button, Card, Divider, Image } from '@nextui-org/react';
import { useTheme } from 'next-themes';
import React, { ReactElement, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { observer } from 'mobx-react-lite';
import { helper } from '@/lib/helper';
import { FileType, OnSendContentType } from './type';
import { AttachmentsRender } from './attachmentsRender';
import { MyPlugins } from './editorPlugins';
import { BlinkoStore } from '@/store/blinkoStore';
import { eventBus } from '@/lib/event';
import { _ } from '@/lib/lodash';
import { FileUploadIcon, HashtagIcon, LightningIcon, NotesIcon, SendIcon } from '../Icons';
import { useTranslation } from 'react-i18next';
import usePasteFile from '@/lib/hooks';
import useAudioRecorder from '../AudioRecorder/hook';
import AudioRecorder from '../AudioRecorder';
import { useMediaQuery } from 'usehooks-ts';
import { api } from '@/lib/trpc';
import { NoteType, type Attachment } from '@/server/types';
import { UPLOAD_FILE_PATH } from '@/lib/constant';
const { MDXEditor } = await import('@mdxeditor/editor')

// https://mdxeditor.dev/editor/docs/theming
// https://react-dropzone.js.org/

type IProps = {
  content: string,
  onChange?: (content: string) => void,
  onSend?: (args: OnSendContentType) => Promise<any>,
  isSendLoading?: boolean,
  bottomSlot?: ReactElement<any, any>,
  originFiles?: Attachment[]
}

export const HandleFileType = (originFiles: Attachment[]): FileType[] => {
  if (originFiles.length == 0) return []
  const res = originFiles?.map(file => {
    const extension = helper.getFileExtension(file.name)
    return {
      name: file.name,
      size: file.size,
      //@ts-ignore
      isImage: 'JPEG/JPG/PNG/BMP/TIFF/TIF/WEBP/SVG'.includes(extension?.toUpperCase() ?? null),
      extension: extension ?? '',
      preview: file.path,
      uploadPromise: new PromiseState({ function: async () => file.path })
    }
  })
  res.map(i => i.uploadPromise.call())
  return res
}



const Editor = observer(({ content, onChange, onSend, isSendLoading, bottomSlot, originFiles }: IProps) => {
  const { t } = useTranslation()
  const isPc = useMediaQuery('(min-width: 768px)')
  const mdxEditorRef = React.useRef<MDXEditorMethods>(null)
  const cardRef = React.useRef(null)
  const blinko = RootStore.Get(BlinkoStore)
  const { theme } = useTheme();

  const pastedFiles = usePasteFile(cardRef);
  useEffect(() => {
    if (pastedFiles) {
      store.uploadFiles(pastedFiles)
    }
  }, [pastedFiles])

  const recorderControls = useAudioRecorder(
    {
      noiseSuppression: true,
      echoCancellation: true,
    },
    (err) => console.table(err)
  );

  const store = RootStore.Local(() => ({
    files: [] as FileType[],
    get canSend() {
      if (store.files.length == 0) return true
      return store.files?.every(i => !i?.uploadPromise?.loading?.value)
    },
    replaceMarkdownTag(text) {
      if (mdxEditorRef.current) {
        const Mycontent = mdxEditorRef.current!.getMarkdown().replace(helper.regex.isEndsWithHashTag, "#" + text + '&#x20;')
        mdxEditorRef.current.setMarkdown(Mycontent)
        mdxEditorRef.current.focus(() => {
          setTimeout(() => eventBus.emit('hashpop:hidden'), 100)
          onChange?.(Mycontent)
        }, {
          defaultSelection: 'rootEnd'
        })
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
    clearMarkdown() {
      if (mdxEditorRef.current) {
        mdxEditorRef.current.setMarkdown("")
        mdxEditorRef.current.focus(() => {
          onChange?.("")
        })
      }
    },
    inertHash() {
      mdxEditorRef.current!.insertMarkdown("&#x20;#")
      mdxEditorRef.current!.focus()
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
        return {
          name: file.name,
          size: file.size,
          //@ts-ignore
          isImage: 'JPEG/JPG/PNG/BMP/TIFF/TIF/WEBP/SVG'.includes(extension?.toUpperCase() ?? null),
          extension: extension ?? '',
          preview: URL.createObjectURL(file),
          uploadPromise: new PromiseState({
            function: async () => {
              const formData = new FormData();
              formData.append('file', file)
              const response = await fetch('/api/file/upload', {
                method: 'POST',
                body: formData,
              });
              const data = await response.json();
              store.speechToText(UPLOAD_FILE_PATH + '/' + data.fileName)
              if (data.filePath) {
                return data.filePath
              }
            }
          })
        }
      })
      store.files.push(..._acceptedFiles)
      _acceptedFiles.map(i => i.uploadPromise.call())
    },
    onRecordingComplete(blob) {
      const mp3File = new File([blob], Date.now() + '.webm', {
        type: "audio/webm",
        lastModified: Date.now(), // 可以指定最后修改时间为当前时间
      });
      store.uploadFiles([mp3File])
    }
  }))

  //fix ui not render
  useEffect(() => {
  }, [store.canSend, blinko.noteTypeDefault])

  useEffect(() => {
    eventBus.on('editor:replace', store.replaceMarkdownTag)
    eventBus.on('editor:clear', store.clearMarkdown)
    return () => {
      eventBus.off('editor:replace', store.replaceMarkdownTag)
      eventBus.off('editor:clear', store.clearMarkdown)
    }
  }, [])

  useEffect(() => {
    if (originFiles?.length != 0) {
      store.files = HandleFileType(originFiles!)
    }
  }, [originFiles])

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

  return <Card
    shadow='none' {...getRootProps()}
    className={`p-2 relative border-2 border-[#cfcfcf] transition-all ${isDragAccept ? 'border-2 border-green-500 border-dashed transition-all' : ''}`}>
    <div ref={cardRef}>
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
        }}
        autoFocus={{
          defaultSelection: 'rootEnd'
        }}
        markdown={content}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <div className='flex flex-col  w-full'>
                <div className='w-full'>
                  <AttachmentsRender files={store.files} />
                </div>
                <div className='flex w-full items-center'>
                  <ButtonWithTooltip className='!w-[24px] !h-[24px]' title={
                    blinko.noteTypeDefault == NoteType.BLINKO ? t('blinko') : t('note')
                  } onClick={e => {
                    if (blinko.noteTypeDefault == NoteType.BLINKO) {
                      blinko.noteTypeDefault = NoteType.NOTE
                    } else {
                      blinko.noteTypeDefault = NoteType.BLINKO
                    }
                  }}>
                    {
                      blinko.noteTypeDefault == NoteType.BLINKO ? <LightningIcon className='blinko' /> :
                        <NotesIcon className='note' />
                    }
                  </ButtonWithTooltip>

                  <ButtonWithTooltip className='!w-[24px] !h-[24px] mr-2' title={t('insert-hashtag')} onClick={e => {
                    store.inertHash()
                  }}>
                    <HashtagIcon />
                  </ButtonWithTooltip>

                  <Divider orientation="vertical" />
                  <ListsToggle />
                  {isPc && <InsertTable />}
                  <ConditionalContents
                    options={[
                      { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
                      { when: (editor) => editor?.editorType === 'sandpack', contents: () => <ShowSandpackInfo /> },
                      {
                        fallback: () => (<>
                          <InsertCodeBlock />
                          <InsertSandpack />
                        </>)
                      }
                    ]}
                  />
                  <Divider orientation="vertical" />

                  <ButtonWithTooltip className='!w-[24px] !h-[24px] mr-2' title={t('upload-file')} onClick={e => {
                    open()
                  }}>
                    <input {...getInputProps()} />
                    <FileUploadIcon className='hover:opacity-80 transition-all' />
                  </ButtonWithTooltip>

                  {
                    blinko.showAi && <ButtonWithTooltip className='!w-[24px] !h-[24px] mr-2' title={t('recording')} onClick={e => {
                    }}>
                      <AudioRecorder
                        onRecordingComplete={(blob) => store.onRecordingComplete(blob)}
                        recorderControls={recorderControls}
                        showVisualizer={true}
                      />
                    </ButtonWithTooltip>
                  }

                  <Button isDisabled={!store.canSend} size='sm' radius='md' isLoading={isSendLoading} onClick={async e => {
                    await onSend?.({
                      content,
                      files: store.files.map(i => { return { ...i, uploadPath: i.uploadPromise.value } })
                    })
                    onChange?.('')
                    store.files = []
                  }} className='ml-auto w-[60px] group' isIconOnly color='primary' >
                    <SendIcon className='primary-foreground group-hover:rotate-[-35deg] transition-all' />
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

