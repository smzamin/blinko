import { BlinkoStore } from '@/store/blinkoStore';
import { Card } from '@nextui-org/react';
import { _ } from '@/lib/lodash';
import { observer } from 'mobx-react-lite';
import Masonry from 'react-masonry-css'
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { RootStore } from '@/store';
import { motion } from "framer-motion"
import { FilesAttachmentRender } from '@/components/Common/Editor/attachmentsRender';
import { ContextMenuTrigger } from '@/components/Common/ContextMenu';
import { MarkdownRender } from '@/components/Common/MarkdownRender';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/router';
import { BlinkoEditor } from '@/components/BlinkoEditor';
import { ScrollArea } from '@/components/Common/ScrollArea';
import { BlinkoMultiSelectPop } from '@/components/BlinkoMultiSelectPop';
import dayjs from '@/lib/dayjs';
import { PromiseCall } from '@/store/standard/PromiseState';
import { api } from '@/lib/trpc';
import { BlinkoRightClickMenu } from '@/components/BlinkoRightClickMenu';
import { NoteType } from '@/server/types';

const Home = observer(({ type, isArchived }: { type?: number | null, isArchived?: boolean | null }) => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  const router = useRouter();
  const { tagId } = router.query;

  useEffect(() => {
    if (!router.isReady) return
    blinko.noteListFilterConfig.type = type ? Number(type) : 0
    blinko.noteTypeDefault = type ? Number(type) : 0
    blinko.noteListFilterConfig.tagId = null
    blinko.noteListFilterConfig.isArchived = false

    if (tagId) {
      console.log({ tagId })
      blinko.noteListFilterConfig.tagId = Number(tagId) as number
    }
    if (router.pathname == '/all') {
      blinko.noteListFilterConfig.type = -1
    }
    if (isArchived) {
      blinko.noteListFilterConfig.type = -1
      blinko.noteListFilterConfig.isArchived = true
    }
    blinko.noteList.resetAndCall({})
  }, [type, tagId])

  const store = RootStore.Local(() => ({
    editorHeight: 90,
    get showEditor() {
      return !isArchived
    },
    get showLoadAll() {
      return blinko.noteList.isLoadAll
    }
  }))

  return (
    <div className="md:p-0 relative h-full flex flex-col-reverse md:flex-col">
      {store.showEditor && <div className='px-2 md:px-6 ' >
        <BlinkoEditor mode='create' key='create-key' onHeightChange={height => store.editorHeight = height} />
      </div>}
      <div className='text-ignore flex items-center justify-center gap-2 w-full '>
        {
          blinko.noteList.isLoading && <Icon className='text-ignore mt-2' icon="eos-icons:three-dots-loading" width="30" height="30" />
        }
        {
          blinko.noteList.isEmpty &&
          <div className='absolute top-[40%] select-none text-ignore flex items-center justify-center gap-2 w-full mt-2 md:mt-10'>
            <Icon icon="line-md:coffee-half-empty-twotone-loop" width="24" height="24" />
            <div className='text-md text-ignore font-bold'>{t('no-data-here-well-then-time-to-write-a-note')}</div>
          </div>
        }
      </div>
      {
        !blinko.noteList.isEmpty && <ScrollArea
          onBottom={() => blinko.onBottom()}
          style={{ height: store.showEditor ? `calc(100vh - ${100 + store.editorHeight}px)` : '100vh' }}
          className={`px-2 mt-0 md:mt-6 md:px-6 w-full h-full overflow-y-scroll overflow-x-hidden`}>
          <Masonry
            breakpointCols={{
              default: 2,
              500: 1
            }}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column">
            {
              blinko.noteList?.value?.map(i => {
                return <motion.div className='w-full' style={{ boxShadow: '0 0 15px -5px #5858581a' }} whileTap={{ scale: 1 }} key={i.id}>
                  <ContextMenuTrigger id="blink-item-context-menu" >
                    <div
                      onContextMenu={e => {
                        blinko.curSelectedNote = _.cloneDeep(i)
                      }}
                      onClick={() => {
                        if (blinko.isMultiSelectMode) {
                          blinko.onMultiSelectNote(i.id)
                        }
                      }}>
                      <Card shadow='none' className={`mb-4 flex flex-col p-4 bg-background transition-all
                    ${blinko.curMultiSelectIds?.includes(i.id) ? 'border-2 border-primary' : ''}`}>
                        <div className='mb-2 text-xs text-desc'>{dayjs(i.createdAt).fromNow()}</div>
                        <MarkdownRender content={i.content} />
                        <div className={i.attachments?.length != 0 ? 'my-2' : ''}>
                          <FilesAttachmentRender files={i.attachments ?? []} preview />
                        </div>
                        {
                          i.type == NoteType.BLINKO ?
                            <div className='flex items-center justify-start mt-2'>
                              <Icon className='text-yellow-500' icon="basil:lightning-solid" width="12" height="12" />
                              <div className='text-desc text-xs font-bold ml-1'>{t('blinko')}</div>
                            </div> :
                            <div className='flex items-center justify-start mt-2'>
                              <Icon className='text-blue-500' icon="solar:notes-minimalistic-bold-duotone" width="12" height="12" />
                              <div className='text-desc text-xs font-bold ml-1'>{t('note')}</div>
                            </div>
                        }
                      </Card>
                    </div>
                  </ContextMenuTrigger>
                </motion.div>
              })
            }
          </Masonry>
          {store.showLoadAll && <div className='w-full text-center text-sm font-bold text-ignore mt-4'>{t('all-notes-have-been-loaded', { items: blinko.noteList.value?.length })}</div>}
        </ScrollArea>
      }

      <BlinkoRightClickMenu />
      <BlinkoMultiSelectPop />
    </div>
  );
});

export default Home;
