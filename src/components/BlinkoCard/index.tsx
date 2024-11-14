import { observer } from "mobx-react-lite";
import { BlinkoStore } from '@/store/blinkoStore';
import { Card, Tooltip } from '@nextui-org/react';
import { _ } from '@/lib/lodash';
import { useTranslation } from 'react-i18next';
import { RootStore } from '@/store';
import { motion } from "framer-motion"
import { ContextMenuTrigger } from '@/components/Common/ContextMenu';
import { MarkdownRender } from '@/components/Common/MarkdownRender';
import { Icon } from '@iconify/react';
import dayjs from '@/lib/dayjs';
import { Note, NoteType } from '@/server/types';
import { ConvertItemFunction, LeftCickMenu, ShowEditBlinkoModel } from "../BlinkoRightClickMenu";
import { useMediaQuery } from "usehooks-ts";
import { Copy } from "../Common/Copy";
import { FilesAttachmentRender } from "../Common/AttachmentRender";

export const BlinkoCard = observer(({ blinkoItem, isShareMode = false }: { blinkoItem: Note, isShareMode?: boolean }) => {
  const { t } = useTranslation();
  const isPc = useMediaQuery('(min-width: 768px)')
  const blinko = RootStore.Get(BlinkoStore)

  return <motion.div key={blinkoItem.id} className='w-full' style={{ boxShadow: '0 0 15px -5px #5858581a' }}>
    <ContextMenuTrigger id="blink-item-context-menu" >
      <div
        onContextMenu={() => {
          blinko.curSelectedNote = _.cloneDeep(blinkoItem)
        }}
        onDoubleClick={() => {
          blinko.curSelectedNote = _.cloneDeep(blinkoItem)
          ShowEditBlinkoModel()
        }}
        onClick={() => {
          if (blinko.isMultiSelectMode) {
            blinko.onMultiSelectNote(blinkoItem.id!)
          }
        }}>
        <Card onContextMenu={e => !isPc && e.stopPropagation()} shadow='none'
          className={`group/card ${isPc ? 'hover:translate-y-1' : ''} flex flex-col p-4 bg-background transition-all ${blinko.curMultiSelectIds?.includes(blinkoItem.id!) ? 'border-2 border-primary' : ''}`}>
          <div className="flex items-center select-none ">
            <div className="mb-2 flex items-center w-full gap-1">
              {
                blinkoItem.isShare && !isShareMode &&
                <Tooltip content='Externally accessible'>
                  <Icon className="cursor-pointer text-[#8600EF]" icon="prime:eye" width="16" height="16" onClick={() => window.open('/share')} />
                </Tooltip>
              }
              <div className='text-xs text-desc'>{dayjs(blinkoItem.updatedAt).fromNow()}</div>
              <Copy size={16} className="ml-auto opacity-0 group-hover/card:opacity-100  group-hover/card:translate-x-0 translate-x-1 " content={blinkoItem.content + `\n${blinkoItem.attachments?.map(i => window.location.origin + i.path).join('\n')}`} />
              {blinkoItem.isTop && <Icon className="ml-auto group-hover/card:ml-2 text-[#EFC646]" icon="solar:bookmark-bold" width="16" height="16" />}
              {
                !isShareMode && <LeftCickMenu className={blinkoItem.isTop ? "ml-[10px]" : 'ml-auto group-hover/card:ml-2'} onTrigger={() => { blinko.curSelectedNote = _.cloneDeep(blinkoItem) }} />
              }
            </div>
          </div>
          <MarkdownRender content={blinkoItem.content} onChange={(newContent) => {
            blinkoItem.content = newContent
            blinko.upsertNote.call({ id: blinkoItem.id, content: newContent, refresh: false })
          }} />
          <div className={blinkoItem.attachments?.length != 0 ? 'my-2' : ''}>
            <FilesAttachmentRender files={blinkoItem.attachments ?? []} preview />
          </div>
          <div className="flex items-center">
            {
              blinkoItem.type == NoteType.BLINKO ?
                <Tooltip content={t('convert-to') + ' Note'} delay={1000} >
                  <div className='flex items-center justify-start mt-2 cursor-pointer' onClick={() => {
                    blinko.curSelectedNote = _.cloneDeep(blinkoItem)
                    ConvertItemFunction()
                  }}>
                    <Icon className='text-yellow-500' icon="basil:lightning-solid" width="12" height="12" />
                    <div className='text-desc text-xs font-bold ml-1 select-none'>{t('blinko')}</div>
                  </div>
                </Tooltip> :
                <Tooltip content={t('convert-to') + ' Blinko'} delay={1000}>
                  <div className='flex items-center justify-start mt-2 cursor-pointer' onClick={() => {
                    blinko.curSelectedNote = _.cloneDeep(blinkoItem)
                    ConvertItemFunction()
                  }}>
                    <Icon className='text-blue-500' icon="solar:notes-minimalistic-bold-duotone" width="12" height="12" />
                    <div className='text-desc text-xs font-bold ml-1 select-none'>{t('note')}</div>
                  </div>
                </Tooltip>
            }
            {
              (dayjs(blinkoItem.createdAt).fromNow() !== dayjs(blinkoItem.updatedAt).fromNow()) && <div className='ml-auto text-xs text-desc'>{t('created-in')} {dayjs(blinkoItem.createdAt).fromNow()}</div>
            }
          </div>
        </Card>
      </div>
    </ContextMenuTrigger >
  </motion.div >
})
