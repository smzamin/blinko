import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Card } from '@nextui-org/react';
import { eventBus } from '@/lib/event';
import { RootStore } from '@/store';
import { BlinkoStore } from '@/store/blinkoStore';
import { motion } from "framer-motion"
import { DialogStore } from '@/store/module/Dialog';
import { useMediaQuery } from 'usehooks-ts'

export const showTagSelectPop = (text: string = '') => {
  setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      eventBus.emit('hashpop:update', { rect, text })
    }
  })
}

const TagSelectPop = observer(() => {
  const blinko = RootStore.Get(BlinkoStore)
  const isPc = useMediaQuery('(min-width: 768px)')
  const popRef: any = useRef(null)
  const store = RootStore.Local(() => ({
    rect: { top: 0, left: 0 },
    show: false,
    searchText: '',
    height: 200,
    maxWith: 250,
    get tagList() {
      // console.log({ searchText: store.searchText })
      if (store.searchText == '' || !store.searchText) {
        return blinko.tagList?.value?.pathTags
      }
      return blinko.tagList?.value?.pathTags?.filter(i => i.includes(store.searchText.replace("#", '')))
    },
    hidden() {
      store.show = false
      RootStore.Get(DialogStore).preventClose = false
    },
    setData(args) {
      Object.assign(store, args)
    },
    get top() {
      if (typeof window == 'undefined') return 0
      if ((window.innerHeight - store.rect.top) < popRef.current?.clientHeight) {
        return store.rect.top - ((popRef.current?.clientHeight ?? 0) + 20)
      }
      return store.rect.top
    },
    get left() {
      if (typeof window == 'undefined') return 0
      if (isPc) {
        if ((window.innerWidth - store.rect.left) < store.maxWith) {
          return store.rect.left - store.maxWith
        }
      } else {
        if ((window.innerWidth - store.rect.left) < store.maxWith) {
          return store.rect.left - store.maxWith
        }
      }
      return store.rect.left
    }
  }))
  useEffect(() => {
    if (store.tagList?.length == 0) {
      store.hidden()
    }
  }, [store.tagList])
  const setRectFunction = ({ rect, text }) => {
    // console.log({ rect, text })
    store.setData({
      rect,
      show: true,
      searchText: text,
    })
    RootStore.Get(DialogStore).preventClose = true
  }
  useEffect(() => {
    eventBus.on('hashpop:update', setRectFunction)
    eventBus.on('hashpop:hidden', store.hidden)
    document.addEventListener('click', store.hidden);
    return () => {
      eventBus.off('hashpop:update', setRectFunction)
      eventBus.on('hashpop:hidden', store.hidden)
      document.removeEventListener('click', store.hidden);
    }
  }, [])
  return (
    <motion.div
      ref={popRef}
      animate={store.show ? 'enter' : 'exit'}
      onTransitionEnd={() => {
        console.log('onTransitionEnd')
      }}
      variants={{
        enter: {
          opacity: 1,
          transition: { type: 'spring', bounce: 0.5, duration: 0.4 },
          zIndex: 99,
          y: 15,
          x: 2
        },
        exit: {
          opacity: 0,
          y: 10,
          transition: { type: 'spring', bounce: 0.5, duration: 0.3 },
          transitionEnd: {
            zIndex: -99
          }
        },
      }}
      style={{
        position: 'fixed',
        opacity: 0,
        top: store.top,
        left: store.left,
        zIndex: -99
      }}>
      <Card shadow='lg' radius='md' style={{ maxHeight: store.height + 'px', maxWidth: store.maxWith + 'px' }} className={`p-2 rounded-md overflow-y-scroll overflow-x-hidden`}>
        {store.tagList?.map(i => {
          return <div key={i} className='cursor-pointer hover:bg-hover transition-all px-2 py-1 rounded-md' onClick={e => {
            store.hidden()
            eventBus.emit('editor:replace', i)
          }}>#{i}</div>
        })}
        {store.tagList?.length == 0 && <div className='text-ignore font-bold text-sm'>No tag found</div>}
      </Card>
    </motion.div >
  );
});


export default TagSelectPop;
