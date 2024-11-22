import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { useTranslation } from 'react-i18next';
import PopoverFloat from './index';
import { eventBus } from '@/lib/event';
import { RootStore } from '@/store';
import { BlinkoStore } from '@/store/blinkoStore';
import { DialogStore } from '@/store/module/Dialog';

export const showTagSelectPop = (text: string = '') => {
  setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      eventBus.emit('tagselect:update', { rect, text })
    }
  })
}

const TagSelect = observer(() => {
  const blinko = RootStore.Get(BlinkoStore)
  const { t } = useTranslation()
  
  const store = RootStore.Local(() => ({
    rect: null as DOMRect | null,
    show: false,
    searchText: '',
    
    get tagList() {
      if (!store.searchText) {
        return blinko.tagList?.value?.pathTags
      }
      return blinko.tagList?.value?.pathTags.filter(i => 
        i.toLowerCase().includes(store.searchText.toLowerCase().replace("#", ''))
      )
    },
    
    hidden() {
      store.show = false
      RootStore.Get(DialogStore).preventClose = false
    },

    setData(args: { rect: DOMRect, text: string }) {
      store.rect = args.rect
      store.show = true
      store.searchText = args.text
      RootStore.Get(DialogStore).preventClose = true
    }
  }))

  useEffect(() => {
    if (store.tagList?.length == 0) {
      store.hidden()
    }
  }, [store.tagList])

  useEffect(() => {
    eventBus.on('tagselect:update', store.setData)
    eventBus.on('tagselect:hidden', store.hidden)
    
    return () => {
      eventBus.off('tagselect:update', store.setData)
      eventBus.off('tagselect:hidden', store.hidden)
    }
  }, [])

  return (
    <PopoverFloat
      show={store.show}
      onHide={store.hidden}
      anchorRect={store.rect}
    >
      {store.tagList?.map(i => (
        <div 
          key={i} 
          className='cursor-pointer hover:bg-hover transition-all px-2 py-1 rounded-lg'
          onClick={e => {
            store.hidden()
            eventBus.emit('editor:replace', i)
          }}
        >
          #{i}
        </div>
      ))}
      {store.tagList?.length == 0 && (
        <div className='text-ignore font-bold text-sm'>
          {t('no-tag-found')}
        </div>
      )}
    </PopoverFloat>
  )
})

export default TagSelect;