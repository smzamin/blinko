import { ButtonWithTooltip, ChangeCodeMirrorLanguage, ConditionalContents, CreateLink, InsertCodeBlock, InsertImage, InsertSandpack, InsertTable, ListsToggle, MDXEditorMethods, ShowSandpackInfo } from '@mdxeditor/editor';
import { Button, Divider, DropdownTrigger, DropdownItem, DropdownMenu, Dropdown } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { FileType } from './type';
import { CameraIcon, CancelIcon, FileUploadIcon, HashtagIcon, LightningIcon, NotesIcon, SendIcon, VoiceIcon } from '../Icons';
import { NoteType } from '@/server/types';
import { AttachmentsRender } from '../AttachmentRender';
import { ShowCamera } from '../CameraDialog';
import { ShowAudioDialog } from '../AudioDialog';
import { BlinkoStore } from '@/store/blinkoStore';
import { RootStore } from '@/store';
import { DialogStore } from '@/store/module/Dialog';
import { AiStore } from '@/store/aiStore';
import { eventBus } from '@/lib/event';

type ToolbarProps = {
  store: any;
  files: FileType[];
  openFileDialog: () => void;
  getInputProps: any;
  mode: 'create' | 'edit';
  isPc: boolean;
  viewMode: 'source' | 'rich-text';
  canSend: boolean;
  isSendLoading?: boolean;
  mdxEditorRef: React.RefObject<MDXEditorMethods>;
  onSend?: (args: any) => Promise<any>;
  onChange?: (content: string) => void;
}

type UploadAction = {
  key: string;
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  showCondition?: boolean;
}

export const Toolbar = ({
  store,
  files,
  mode,
  isPc,
  viewMode,
  canSend,
  isSendLoading,
  mdxEditorRef,
  onSend,
  onChange,
  openFileDialog,
  getInputProps,
}: ToolbarProps) => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore);
  const ai = RootStore.Get(AiStore);

  const uploadActions: UploadAction[] = [
    {
      key: 'file',
      icon: <FileUploadIcon className='hover:opacity-80 transition-all' />,
      title: t('upload-file'),
      onClick: openFileDialog,
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

  return (
    <div className='flex flex-col w-full'>
      {files.length > 0 && (
        <div className='w-full my-2'>
          <AttachmentsRender files={files} />
        </div>
      )}

      {viewMode == 'source' && <div className='text-red-500 text-xs select-none'>Source Code Mode</div>}

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

        <ButtonWithTooltip className='!w-[24px] !h-[24px] ' title={t('insert-hashtag')} onClick={() => {
          store.inertHash();
        }}>
          <HashtagIcon />
        </ButtonWithTooltip>

        <Divider orientation="vertical" />

        <ListsToggle />
        {isPc && <InsertTable />}
        {isPc && <InsertImage />}

        {/* <CreateLink /> */}

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

        {renderUploadButtons()}

        <ButtonWithTooltip
          title={viewMode === 'source' ? t('preview-mode') : t('source-code')}
          className='!ml-auto'
          onClick={() => {
            const nextMode = viewMode === 'source' ? 'rich-text' : 'source';
            eventBus.emit('editor:setViewMode', nextMode);
          }}
        >
          {viewMode !== 'source' ?
            <Icon icon="tabler:source-code" className='transition-all' /> :
            <Icon icon="grommet-icons:form-view" className='transition-all !text-red-500' />
          }
        </ButtonWithTooltip>

        <Button
          isDisabled={!canSend}
          size='sm'
          radius='md'
          isLoading={isSendLoading}
          onClick={async () => {
            await onSend?.({
              content: mdxEditorRef.current?.getMarkdown(),
              files: files.map(i => ({ ...i, uploadPath: i.uploadPromise.value }))
            });
            onChange?.('');
            store.files = [];
            ai.isWriting = false;
          }}
          className={`ml-2 w-[60px] group`}
          isIconOnly
          color='primary'
        >
          {files?.some(i => i.uploadPromise?.loading?.value) ?
            <Icon icon="line-md:uploading-loop" width="24" height="24" /> :
            <SendIcon className='primary-foreground !text-primary-foreground group-hover:rotate-[-35deg] transition-all' />
          }
        </Button>
      </div>
    </div>
  );
}; 