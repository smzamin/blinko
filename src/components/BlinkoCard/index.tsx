import { observer } from "mobx-react-lite";
import { BlinkoStore } from '@/store/blinkoStore';
import { Card, Popover, PopoverContent, PopoverTrigger } from '@nextui-org/react';
import { _ } from '@/lib/lodash';
import { useTranslation } from 'react-i18next';
import { RootStore } from '@/store';
import { motion } from "framer-motion"
import { FilesAttachmentRender } from '@/components/Common/Editor/attachmentsRender';
import { ContextMenuTrigger } from '@/components/Common/ContextMenu';
import { MarkdownRender } from '@/components/Common/MarkdownRender';
import { Icon } from '@iconify/react';
import dayjs from '@/lib/dayjs';
import { Note, NoteType } from '@/server/types';
import { LeftCickMenu } from "../BlinkoRightClickMenu";
import { useMediaQuery } from "usehooks-ts";

export const BlinkoCard = observer(({ blinkoItem }: { blinkoItem: Note }) => {
  const { t } = useTranslation();
  const isPc = useMediaQuery('(min-width: 768px)')
  const blinko = RootStore.Get(BlinkoStore)

  return <motion.div key={blinkoItem.id} className='w-full' style={{ boxShadow: '0 0 15px -5px #5858581a' }}>
    <ContextMenuTrigger id="blink-item-context-menu" >
      <div
        onContextMenu={e => {
          blinko.curSelectedNote = _.cloneDeep(blinkoItem)
        }}
        onClick={() => {
          if (blinko.isMultiSelectMode) {
            blinko.onMultiSelectNote(blinkoItem.id!)
          }
        }}>
        <Card onContextMenu={e => !isPc && e.stopPropagation()} shadow='none'
         className={`hover:translate-y-1 mb-4 flex flex-col p-4 bg-background transition-all ${blinko.curMultiSelectIds?.includes(blinkoItem.id!) ? 'border-2 border-primary' : ''}`}>
          <div className="flex items-center select-none">
            <div className='mb-2 text-xs text-desc'>{dayjs(blinkoItem.createdAt).fromNow()}</div>
            {blinkoItem.isTop && <Icon className="ml-auto text-[#EFC646]" icon="solar:bookmark-bold" width="24" height="24" />}
            <LeftCickMenu className={blinkoItem.isTop ? "ml-[10px]" : 'ml-auto'} onTrigger={() => { blinko.curSelectedNote = _.cloneDeep(blinkoItem) }} />
          </div>

          <MarkdownRender content={blinkoItem.content} />
          <div className={blinkoItem.attachments?.length != 0 ? 'my-2' : ''}>
            <FilesAttachmentRender files={blinkoItem.attachments ?? []} preview />
          </div>
          {
            blinkoItem.type == NoteType.BLINKO ?
              <div className='flex items-center justify-start mt-2'>
                <Icon className='text-yellow-500' icon="basil:lightning-solid" width="12" height="12" />
                <div className='text-desc text-xs font-bold ml-1 select-none'>{t('blinko')}</div>
              </div> :
              <div className='flex items-center justify-start mt-2'>
                <Icon className='text-blue-500' icon="solar:notes-minimalistic-bold-duotone" width="12" height="12" />
                <div className='text-desc text-xs font-bold ml-1 select-none'>{t('note')}</div>
              </div>
          }
        </Card>
      </div>
    </ContextMenuTrigger>
  </motion.div>
})
