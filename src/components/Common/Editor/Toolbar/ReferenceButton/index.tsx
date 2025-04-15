import { BlinkoSelectNote } from '@/components/Common/BlinkoSelectNote'
import { RootStore } from '@/store'
import { BlinkoStore } from '@/store/blinkoStore'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { EditorStore } from '../../editorStore'

interface Props {
  store: EditorStore
}

export const ReferenceButton = observer(({ store }: Props) => {
  const blinko = RootStore.Get(BlinkoStore)
  useEffect(() => {
    blinko.referenceSearchList.resetAndCall({ searchText: ' ' })
  }, [])
  return (
    <BlinkoSelectNote
      onSelect={(item) => {
        if (store.references?.includes(item.id)) return;
        store.addReference(item.id);
      }}
      blackList={store.references}
    />
  )
})