import { Icon } from '@/components/Common/Iconify/icons';
import { RootStore } from "@/store";
import { DialogStandaloneStore } from "@/store/module/DialogStandalone";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const TipsDialog = observer(({ content, onConfirm, onCancel, buttonSlot }: any) => {
  const { t } = useTranslation()
  return <div className='flex flex-col'>
    <div className='flex gap-4 items-center '>
      <div className="ml-4">{content}</div>
    </div>
    <div className='flex my-4 gap-4'>
      {
        buttonSlot ? buttonSlot : <>
          <Button className="ml-auto" color='default'
            onPress={e => {
              RootStore.Get(DialogStandaloneStore).close()
              onCancel?.()
            }}>{t('cancel')}</Button>
          <Button color='danger' onPress={async e => {
            onConfirm?.()
          }}>{t('confrim')}</Button>
        </>
      }
    </div>
  </div>
})

export const showTipsDialog = async (props: { size?: 'sm' | 'md' | 'lg' | 'xl', title: string, content: string, onConfirm?, onCancel?: any, buttonSlot?: React.ReactNode }) => {
  RootStore.Get(DialogStandaloneStore).setData({
    isOpen: true,
    onlyContent: false,
    size: props.size || 'md',
    title: props.title,
    content: <TipsDialog {...props} />
  })
}

export const TipsPopover = observer((props: { children: React.ReactNode, content, onConfirm, onCancel?, isLoading?: boolean }) => {
  const { t } = useTranslation()
  const { isLoading = false } = props
  return <Popover placement="bottom" showArrow={true}>
    <PopoverTrigger>
      {props.children}
    </PopoverTrigger>
    <PopoverContent>
      <div className="px-1 py-2 flex flex-col">
        <div className='text-yellow-500 '>
          <div className="font-bold mb-2">{props.content}</div>
        </div>
        <div className='flex my-1 gap-2'>
          <Button startContent={<Icon icon="iconoir:cancel" width="20" height="20" />} variant="flat" size="sm" className="ml-auto" color='default' onPress={e => {
            RootStore.Get(DialogStandaloneStore).close()
            props.onCancel?.()
          }}>{t('cancel')}</Button>
          <Button startContent={<Icon icon="cil:check-alt" width="20" height="20" />} isLoading={isLoading}  size="sm" color='danger' onPress={async e => {
            props.onConfirm?.()
          }}>{t('confirm')}</Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
})