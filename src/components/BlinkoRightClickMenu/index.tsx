import { observer } from "mobx-react-lite";
import { BlinkoStore } from '@/store/blinkoStore';
import { Divider } from '@nextui-org/react';
import { _ } from '@/lib/lodash';
import { useTranslation } from 'react-i18next';
import { ContextMenu, ContextMenuItem } from '@/components/Common/ContextMenu';
import { Icon } from '@iconify/react';
import { PromiseCall } from '@/store/standard/PromiseState';
import { api } from '@/lib/trpc';
import { RootStore } from "@/store";
import { DialogStore } from "@/store/module/Dialog";
import { BlinkoEditor } from "../BlinkoEditor";
import { useEffect, useState } from "react";
import { NoteType } from "@/server/types";

export const BlinkoRightClickMenu = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  const [forceUpdate, setForceUpdate] = useState(0)
  const store = RootStore.Local(() => ({
    editorHeight: 90,
    editBlinko() {
      RootStore.Get(DialogStore).setData({
        size: '2xl',
        isOpen: true,
        onlyContent: true,
        content: <BlinkoEditor mode='edit' key='create-key' onSended={() => RootStore.Get(DialogStore).close()} />
      })
    },
  }))
  useEffect(() => {
    setForceUpdate(forceUpdate + 1)
  }, [blinko.curSelectedNote])
  return <ContextMenu className='font-bold' id="blink-item-context-menu" hideOnLeave={false} animation="zoom">
    <ContextMenuItem onClick={e => {
      store.editBlinko()
    }}>
      <div className="flex items-start gap-2">
        <Icon icon="tabler:edit" width="20" height="20" />
        <div>{t('edit')}</div>
      </div>
    </ContextMenuItem>
    <ContextMenuItem onClick={e => {
      blinko.isMultiSelectMode = true
      blinko.onMultiSelectNote(blinko.curSelectedNote.id)
    }}>
      <div className="flex items-start gap-2">
        <Icon icon="mingcute:multiselect-line" width="20" height="20" />
        <div>{t('multiple-select')}</div>
      </div>
    </ContextMenuItem>

    <ContextMenuItem
      onClick={e => {
        blinko.upsertNote.call({
          id: blinko.curSelectedNote.id,
          type: blinko.curSelectedNote.type == NoteType.NOTE ? NoteType.BLINKO : NoteType.NOTE
        })
      }}>
      {forceUpdate && <div className="flex items-start gap-2">
        <Icon icon="ri:exchange-2-line" width="20" height="20" />
        <div>{t('convert-to')} {blinko.curSelectedNote?.type == NoteType.NOTE ?
          <span className='text-yellow-500'>{t('blinko')}</span> : <span className='text-blue-500'>{t('note')}</span>}</div>
      </div>}
    </ContextMenuItem>

    <ContextMenuItem onClick={e => {
      blinko.upsertNote.call({ id: blinko.curSelectedNote?.id, isArchived: !blinko.curSelectedNote?.isArchived })
    }}>
      {forceUpdate && <div className="flex items-start gap-2">
        <Icon icon="eva:archive-outline" width="20" height="20" />
        {blinko.curSelectedNote?.isArchived ? t('recovery') : t('archive')}
      </div>}
    </ContextMenuItem>
    <ContextMenuItem className='select-none divider hover:!bg-none'>
      <Divider orientation="horizontal" />
    </ContextMenuItem>

    <ContextMenuItem onClick={async e => {
      PromiseCall(api.notes.deleteMany.mutate({ ids: [blinko.curSelectedNote?.id] }))
      api.ai.embeddingDelete.mutate({ id: blinko.curSelectedNote?.id })
    }}>
      <div className="flex items-start gap-2 text-red-500">
        <Icon icon="mingcute:delete-2-line" width="20" height="20" />
        <div>{t('delete')}</div>
      </div>
    </ContextMenuItem>
  </ContextMenu>
})