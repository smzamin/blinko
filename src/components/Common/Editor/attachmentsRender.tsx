import { Icon } from '@iconify/react';
import React, { useEffect, useMemo, useState } from 'react';
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
  columns?: number
}

const AttachmentsRender = observer(({ files, preview = false, columns = 3 }: IProps) => {
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

  const DeleteIcon = observer(({ className, file, size = 20 }: { className: string, file: FileType, size?: number }) => {
    return <>
      <TipsPopover isLoading={store.deleteFile.loading.value} content={t('this-operation-will-be-delete-resource-are-you-sure')}
        onConfirm={async e => {
          store.deleteFile.call(file)
        }}>
        <div className={`opacity-70 hover:opacity-100 !bg-foreground cursor-pointer rounded-sm transition-al ${className}`}>
          <Icon className='white' icon="basil:cross-solid" width={size} height={size} />
        </div>

      </TipsPopover >
    </>
  })

  const DownloadIcon = observer(({ className, file, size = 20 }: { className: string, file: FileType, size?: number }) => {
    return <div className={`hidden p-1 group-hover:block transition-all absolute z-10 right-[5px] top-[5px] !text-background opacity-70 hover:opacity-100 !bg-foreground cursor-pointer rounded-sm transition-all ${className}`}>
      <Icon onClick={() => {
        helper.download.downloadByLink(file.uploadPromise.value)
      }} icon="tabler:download" width="15" height="15" />
    </div>
  })

  const imageRenderClassName = useMemo(() => {
    const imageLength = files?.filter(i => i.previewType == 'image')?.length
    if (imageLength == 1) {
      return `flex`
    }
    if (imageLength > 1 && imageLength < 5) {
      return `grid grid-cols-2 gap-2`
    }
    if (imageLength > 5) {
      return `grid grid-cols-3 gap-2`
    }
    return ''
  }, [files?.filter(i => i.previewType == 'image')])

  const imageHeight = useMemo(() => {
    const imageLength = files?.filter(i => i.previewType == 'image')?.length
    if (imageLength == 1) {
      return `h-auto`
    }
    if (imageLength > 1 && imageLength < 5) {
      return `md:h-[180px] h-[160px]`
    }
    if (imageLength > 5) {
      return `md:h-[120px] h-[100px]`
    }
    return ''
  }, [files?.filter(i => i.previewType == 'image')])

  return <>
    {/* image render  */}
    <div className={imageRenderClassName}>
      <PhotoProvider>
        {files?.filter(i => i.previewType == 'image').map((file, index) => (
          <div className={`relative group w-full ${imageHeight}`}>
            {file.uploadPromise?.loading?.value && <div className='absolute inset-0 flex items-center justify-center w-full h-full'>
              <Icon icon="line-md:uploading-loop" width="40" height="40" />
            </div>}

            <div className='w-full'>
              <PhotoView src={file.preview}>
                <Image src={file.preview} style={{borderRadius:'13px'}} className={`rounded-xl mb-4 ${imageHeight} object-cover w-[1000px]`} />
              </PhotoView>
            </div>


            {!file.uploadPromise?.loading?.value && !preview &&
              <DeleteIcon className='absolute z-10 right-[5px] top-[5px]'
                file={file} />
            }
            {preview && <DownloadIcon className=''
              file={file} />
            }
          </div>
        ))}
      </PhotoProvider>
    </div>

    {/* video render  */}
    <div className={`columns-1 md:columns-1`}>
      {files?.filter(i => i.previewType == 'video').map((file, index) => (
        <div className='group relative flex p-2 items-center gap-2 cursor-pointer tansition-all rounded-2xl'>
          <video src={file.preview} id="player" playsInline controls className='rounded-2xl w-full z-0' />
          {!file.uploadPromise?.loading?.value && !preview &&
            <DeleteIcon className='absolute z-10 right-[5px] top-[5px]'
              file={file} />
          }
          {preview && <DownloadIcon className='top-[8px] right-[8px]' file={file} />}
        </div>
      ))}
    </div>

    {/* audio render  */}
    <div className={`columns-1 md:columns-1`}>
      {files?.filter(i => i.previewType == 'audio').map((file, index) => (
        <div className='group relative flex p-2 items-center gap-2 cursor-pointer tansition-all rounded-2xl'>
          <audio src={file.preview} id="player" playsInline controls className='rounded-2xl w-full' />
          {!file.uploadPromise?.loading?.value && !preview &&
            <DeleteIcon className='absolute z-10 right-[5px] top-[5px]'
              file={file} />
          }
          {preview && <DownloadIcon className='top-[8px] right-[8px]' file={file} />}
        </div>
      ))}
    </div >


    {/* other file render  */}
    <div className={`${helper.env.isIOS ? 'columns-1' : 'columns-' + columns} mt-3 select-none`}>
      {files?.filter(i => i.previewType == 'other').map((file, index) => (
        <div onClick={() => {
          if (preview) {
            helper.download.downloadByLink(file.uploadPromise.value)
          }
        }} className='relative flex p-2 items-center gap-2 cursor-pointer bg-sencondbackground hover:bg-hover tansition-all rounded-md '>
          <FileIcons path={file.name} isLoading={file.uploadPromise?.loading?.value} />
          <div className='truncate text-sm font-bold'>{file.name}</div>
          {!file.uploadPromise?.loading?.value && !preview &&
            <DeleteIcon className='ml-auto w-[35px]' file={file} />}
        </div>
      ))}
    </div >
  </>
})

const FilesAttachmentRender = observer(({ files, preview, columns }: { files: Attachment[], preview?: boolean, columns?: number }) => {
  const [handledFiles, setFiles] = useState<FileType[]>([])
  useEffect(() => {
    setFiles(HandleFileType(files))
  }, [files])
  return <AttachmentsRender files={handledFiles} preview={preview} columns={columns} />
})

export { AttachmentsRender, FilesAttachmentRender }

