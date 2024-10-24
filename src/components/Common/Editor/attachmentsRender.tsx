import { Icon } from '@iconify/react';
import React, { useEffect, useState } from 'react';
import { FileIcons } from '../FileIcon';
import { observer } from 'mobx-react-lite';
import { FileType } from './type';
import { RootStore } from '@/store';
import { TipsPopover } from '@/components/Common/TipsDialog';
import { ToastPlugin } from '@/store/module/Toast/Toast';
import { DialogStore } from '@/store/module/Dialog';
import { HandleFileType } from '.';
import { Image } from '@nextui-org/react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { useTranslation } from 'react-i18next';
import { PromiseState } from '@/store/standard/PromiseState';
import { BlinkoStore } from '@/store/blinkoStore';
import { helper } from '@/lib/helper';
import { type Attachment } from '@/server/types';

type IProps = {
  files: FileType[]
  preview?: boolean
}

const AttachmentsRender = observer(({ files, preview = false }: IProps) => {
  const { t } = useTranslation()
  const store = RootStore.Local(() => ({
    deleteFile: new PromiseState({
      function: async (file) => {
        await fetch('/api/file/delete', {
          method: 'POST',
          body: JSON.stringify({ attachment_path: file.uploadPromise?.value }),
        });
        const index = files.findIndex(i => i.name == file.name)
        files.splice(index, 1)
        RootStore.Get(DialogStore).close()
        RootStore.Get(ToastPlugin).success(t('delete-success'))
        RootStore.Get(BlinkoStore).updateTicker++
      }
    })
  }))
  const DeleteIcon = observer(({ className, file }: { className: string, file: FileType }) => {
    return <>
      <TipsPopover isLoading={store.deleteFile.loading.value} content={t('this-operation-will-be-delete-resource-are-you-sure')}
        onConfirm={async e => {
          store.deleteFile.call(file)
        }}>
        <Icon className={className}
          icon="basil:cross-solid" width="20" height="20" />
      </TipsPopover >
    </>
  })

  return <>
    <div className='columns-3 md:columns-3'>
      <PhotoProvider>
        {files?.filter(i => i.isImage).map((file, index) => (
          <div className='relative group'>
            {file.uploadPromise?.loading?.value && <div className='absolute inset-0 flex items-center justify-center w-full h-full'>
              <Icon icon="line-md:uploading-loop" width="40" height="40" />
            </div>}

            <PhotoView width={150} src={file.preview} >
              <Image
                src={file.preview}
                className='rounded-lg mb-4'
              // onLoad={() => { URL.revokeObjectURL(file.preview) }}
              />
            </PhotoView>

            {!file.uploadPromise?.loading?.value && !preview &&
              <DeleteIcon className='absolute z-10 right-[5px] top-[5px] !text-background opacity-80 hover:opacity-100 bg-foreground cursor-pointer rounded-sm transition-all'
                file={file} />
            }
            {preview && <Icon onClick={() => {
              helper.download.downloadByLink(file.uploadPromise.value)
            }} className='hidden group-hover:block transition-all absolute z-10 right-[5px] top-[5px] !text-background opacity-80 hover:opacity-100 bg-foreground cursor-pointer rounded-sm transition-all' icon="tabler:download" width="15" height="15" />
            }
          </div>
        ))}
      </PhotoProvider>

    </div>
    <div className="columns-3 mt-3">
      {files?.filter(i => !i.isImage).map((file, index) => (
        <div onClick={() => {
          if (preview) {
            helper.download.downloadByLink(file.uploadPromise.value)
          }
        }} className='relative flex p-2 items-center gap-2 cursor-pointer bg-sencondbackground hover:bg-hover tansition-all rounded-md '>
          <FileIcons path={file.name} isLoading={file.uploadPromise?.loading?.value} />
          <div className='truncate text-sm font-bold'>{file.name}</div>
          {!file.uploadPromise?.loading?.value && !preview &&
            <DeleteIcon className='ml-auto w-[35px] !text-foreground hover:bg-background cursor-pointer rounded-sm tansition-all'
              file={file} />}
        </div>
      ))}
    </div>
  </>
})

const FilesAttachmentRender = observer(({ files, preview }: { files: Attachment[], preview?: boolean }) => {
  const [handledFiles, setFiles] = useState<FileType[]>([])
  useEffect(() => {
    setFiles(HandleFileType(files))
  }, [files])
  return <AttachmentsRender files={handledFiles} preview={preview} />
})

export { AttachmentsRender, FilesAttachmentRender }

