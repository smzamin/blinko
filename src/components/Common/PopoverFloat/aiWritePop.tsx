import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Card, Input, Button } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { eventBus } from '@/lib/event';
import PopoverFloat from '.';
import { RootStore } from '@/store';
import { AiStore } from '@/store/aiStore';
import { BlinkoStore } from '@/store/blinkoStore';
import { Icon } from '@iconify/react';
import { SendIcon } from '../Icons';


export const showAiWriteSuggestions = () => {
  setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      eventBus.emit('aiwrite:update', { rect })
    }
  })
}

const AiWritePop = observer(() => {
  const { t } = useTranslation()
  const ai = RootStore.Get(AiStore)
  const blinko = RootStore.Get(BlinkoStore)
  const store = RootStore.Local(() => ({
    rect: null as DOMRect | null,
    show: false,
    hidden() {
      store.show = false
    },

    setData(args: { rect: DOMRect }) {
      store.rect = args.rect
      store.show = true
    },

    async handleSubmit() {
      console.log('handleSubmit')
      if (!ai.writeQuestion.trim()) return
      try {
        ai.writeStream('custom', blinko.isCreateMode ? blinko.noteContent : blinko.curSelectedNote!.content)
      } catch (error) {
        console.error('error:', error)
      } finally {
      }
    }
  }))

  useEffect(() => {
    eventBus.on('aiwrite:update', store.setData)
    eventBus.on('aiwrite:hidden', store.hidden)

    return () => {
      eventBus.off('aiwrite:update', store.setData)
      eventBus.off('aiwrite:hidden', store.hidden)
    }
  }, [])

  return (
    <PopoverFloat
      show={store.show}
      onHide={store.hidden}
      anchorRect={store.rect}
      maxWidth={400}
      maxHeight={300}
      closeOnClickOutside={false}
    >
      <div className="flex flex-col gap-3 min-w-[300px]">
        <div className="flex gap-2">
          <Input
            className='border-none'
            value={ai.writeQuestion}
            onChange={(e) => ai.writeQuestion = e.target.value}
            placeholder={'Prompt...'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                store.handleSubmit()
              }
            }}
            startContent={<Icon className='text-primary' icon="mingcute:ai-line" width="16" height="16" />}
            endContent={<>
              {ai.isLoading ?
                <Icon icon="mingcute:loading-line" width="16" height="16" /> :
                <SendIcon onClick={store.handleSubmit} className='cursor-pointer primary-foreground group-hover:rotate-[-35deg] transition-all' />}
            </>}
          />
        </div>
        <div className='flex items-center gap-2'>
          <Button startContent={<Icon icon="proicons:text-expand" width="16" height="16" />} variant='flat' color='warning' size='sm' onClick={e => {
            ai.writeStream('expand', blinko.isCreateMode ? blinko.noteContent : blinko.curSelectedNote!.content)
            store.hidden()
          }}>{t('ai-expand')}</Button>
          <Button startContent={<Icon icon="lucide:scan-text" width="16" height="16" />} variant='flat' color='warning' size='sm' onClick={e => {
            ai.writeStream('polish', blinko.isCreateMode ? blinko.noteContent : blinko.curSelectedNote!.content)
            store.hidden()
          }}>{t('ai-polish')}</Button>
          <Button className='ml-auto' isLoading={ai.isLoading} isIconOnly size='sm' onClick={e => {
            store.hidden()
          }}>
            <Icon icon="ic:sharp-close" />
          </Button>
        </div>
      </div>
    </PopoverFloat>
  );
});

export default AiWritePop;