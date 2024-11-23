import { BlinkoStore } from '@/store/blinkoStore';
import { _ } from '@/lib/lodash';
import { observer } from 'mobx-react-lite';
import Masonry from 'react-masonry-css'
import { useTranslation } from 'react-i18next';
import { RootStore } from '@/store';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/router';
import { BlinkoEditor } from '@/components/BlinkoEditor';
import { BlinkoMultiSelectPop } from '@/components/BlinkoMultiSelectPop';
import { ScrollArea } from '@/components/Common/ScrollArea';
import { BlinkoCard } from '@/components/BlinkoCard';
import { BaseStore } from '@/store/baseStore';
import Webcam from "react-webcam";

const Home = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  blinko.useQuery(useRouter())

  const store = RootStore.Local(() => ({
    editorHeight: 75,
    get showEditor() {
      return !blinko.noteListFilterConfig.isArchived
    },
    get showLoadAll() {
      return blinko.noteList.isLoadAll
    }
  }))

  return (
    <div className="md:p-0 relative h-full flex flex-col-reverse md:flex-col">

      {store.showEditor && <div className='px-2 md:px-6' >
        <BlinkoEditor mode='create' key='create-key' onHeightChange={height => store.editorHeight = height} />
      </div>}
      <div className='text-ignore flex items-center justify-center gap-1 w-full '>
        <Icon className={`text-ignore mt-2 mb-[-5px] transition-all ${blinko.noteList.isLoading ? 'h-[30px]' : 'h-0'}`} icon="eos-icons:three-dots-loading" width="40" height="40" />
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
          className={`px-2 mt-0 md:mt-6 md:px-6 w-full h-full transition-all scroll-area`}>
          <Masonry
            breakpointCols={{
              default: blinko.config?.value?.largeDeviceCardColumns ? Number(blinko.config?.value?.largeDeviceCardColumns) : 2,
              1280: blinko.config?.value?.mediumDeviceCardColumns ? Number(blinko.config?.value?.mediumDeviceCardColumns) : 2,
              768: blinko.config?.value?.smallDeviceCardColumns ? Number(blinko.config?.value?.smallDeviceCardColumns) : 1
            }}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column">
            {
              blinko.noteList?.value?.map(i => {
                return <BlinkoCard blinkoItem={i} />
              })
            }
          </Masonry>
          {store.showLoadAll && <div className='select-none w-full text-center text-sm font-bold text-ignore my-4'>{t('all-notes-have-been-loaded', { items: blinko.noteList.value?.length })}</div>}
        </ScrollArea>
      }

      <BlinkoMultiSelectPop />
    </div>
  );
});

export default Home;
