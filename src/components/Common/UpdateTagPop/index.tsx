
import { BlinkoStore } from '@/store/blinkoStore';
import { _ } from '@/lib/lodash';
import { observer } from 'mobx-react-lite';
import { RootStore } from '@/store';
import { Button, Input, Select, SelectItem } from '@nextui-org/react';
import { useEffect } from 'react';
import { DialogStore } from '@/store/module/Dialog';


type IProps = {
  defaultValue?: string,
  type?: 'input' | 'select',
  onSave?: (tagName: string) => Promise<any>
}

export const UpdateTag = observer(({ onSave, defaultValue = '', type = 'input' }: IProps) => {
  const blinko = RootStore.Get(BlinkoStore)
  const store = RootStore.Local(() => ({
    tagName: ''
  }))
  useEffect(() => {
    store.tagName = defaultValue
  }, [defaultValue])

  return <div className="flex items-center gap-2 pb-4">
    {
      type == 'input' ? <Input value={store.tagName} onChange={e => store.tagName = (e.target.value)} />
        : <Select
          label="Select an animal"
          className="max-w-xs"
          onChange={e => store.tagName = e.target.value}
        >
          {(blinko.tagList.value?.pathTags as string[]).map((tag) => (
            <SelectItem key={tag}>
              {tag}
            </SelectItem>
          ))}
        </Select>
    }

    <Button style={{ width: '30px' }} color="primary" onClick={async () => {
      await onSave?.(store.tagName)
      RootStore.Get(DialogStore).close()
    }}>Save</Button>
  </div>
})

export const ShowUpdateTagDialog = ({ onSave, defaultValue, type }: IProps) => {
  RootStore.Get(DialogStore).setData({
    isOpen: true,
    title: 'Update Tag Name',
    content: <UpdateTag type={type} defaultValue={defaultValue} onSave={async (e) => { return await onSave?.(e) }} />
  })
}

// export const UpdatTagPop = observer(({ isOpen, onSave, value, onChange, placement = 'bottom' }: IProps) => {
//   return <motion.div
//     animate={isOpen ? 'show' : 'hidden'}
//     variants={{
//       show: {
//         y: 5,
//         opacity: 1,
//         zIndex: 99
//       },
//       hidden: {
//         y: 0,
//         opacity: 0,
//         transitionEnd: {
//           zIndex: -50
//         }
//       }
//     }}
//     onClick={e => e.stopPropagation()}
//     className={`absolute p-1 rounded-xl ${placement == 'bottom' ? 'top-10' : '-top-90'} left-0 opacity-0 bg-background border z-[-99] w-fit`}>
//     <div className="px-1 py-2">
//       <div className="text-small text-foreground font-bold mb-2">Update Tag Name</div>
//       <div className="flex items-center gap-2">
//         <Input size='sm' value={value} onChange={e => onChange(e.target.value)} />
//         <Button style={{ width: '30px' }} size='sm' color="primary" onClick={async () => {
//           onSave?.(value)
//         }}>Save</Button>
//       </div>
//     </div>
//   </motion.div>
// })