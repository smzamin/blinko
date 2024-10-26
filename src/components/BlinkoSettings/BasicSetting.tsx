import { observer } from "mobx-react-lite";
import { Button, Card } from "@nextui-org/react";
import { RootStore } from "@/store";
import { Icon } from "@iconify/react";
import { UserStore } from "@/store/user";
import { useTranslation } from "react-i18next";
import { DialogStore } from "@/store/module/Dialog";
import { UpdateUserInfo, UpdateUserPassword } from "../Common/UpdateUserInfo";
import { Item } from "./Item";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";

export const BasicSetting = observer(() => {
  const user = RootStore.Get(UserStore)
  const { t } = useTranslation()
  const router = useRouter()
  return <Card shadow="none" className="flex flex-col p-4 bg-background">
    <div className='text-desc text-sm'>{t('basic-information')}</div>
    <Item
      leftContent={<>{t('name')}</>}
      rightContent={
        <div className="flex gap-2 items-center">
          <div className="text-desc">{user.name}</div>
          <Button variant="flat" isIconOnly startContent={<Icon icon="tabler:edit" width="20" height="20" />} size='sm'
            onClick={e => {
              RootStore.Get(DialogStore).setData({
                isOpen: true,
                title: t('change-user-info'),
                content: <UpdateUserInfo />
              })
            }} />
          <Button variant="flat" isIconOnly startContent={<Icon icon="material-symbols:password" width="20" height="20" />} size='sm'
            onClick={e => {
              RootStore.Get(DialogStore).setData({
                title: t('rest-user-password'),
                isOpen: true,
                content: <UpdateUserPassword />
              })
            }} />
        </div>
      } />
    <Item
      leftContent={<></>}
      rightContent={
        <Button startContent={<Icon icon="humbleicons:logout" width="20" height="20" />} size='sm' color='danger' onClick={e => {
          signOut()
          router.push('/signin')
        }}>{t('logout')}</Button>
      } />
  </Card>
})