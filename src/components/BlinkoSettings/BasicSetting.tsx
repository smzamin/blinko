import { observer } from "mobx-react-lite";
import { Button, Card, Input } from "@nextui-org/react";
import { RootStore } from "@/store";
import { Icon } from "@iconify/react";
import { UserStore } from "@/store/user";
import { useTranslation } from "react-i18next";
import { DialogStore } from "@/store/module/Dialog";
import { UpdateUserInfo, UpdateUserPassword } from "../Common/UpdateUserInfo";
import { Item } from "./Item";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { Copy } from "../Common/Copy";
import { MarkdownRender } from "../Common/MarkdownRender";

export const BasicSetting = observer(() => {
  const user = RootStore.Get(UserStore)
  const CODE = `curl -X 'POST' '${window.location.origin}/api/v1/note/upsert' \\\n      -H 'Content-Type: application/json' \\\n      -H 'Authorization: Bearer ${user.userInfo.value?.token}' \\\n      -d '{ "content": "🎉Hello,Blinko! --send from api ", "type":0 }'\n`
  const CODE_SNIPPET = `\`\`\`javascript\n //blinko api document:${window.location.origin}/api-doc\n ${CODE} \`\`\``
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
      leftContent={<>Access Token</>}
      rightContent={<Input disabled className="w-[150px] md:w-[300px]" value={user.userInfo.value?.token} endContent={<Copy size={20} content={user.userInfo.value?.token ?? ''} />} />} />

    <Item
      leftContent={
        <div className="w-full flex-1 relative">
          <Copy size={20} content={CODE} className="absolute top-4 right-2"/>
          <MarkdownRender content={CODE_SNIPPET} />
        </div>
      }
    />

    <Item
      leftContent={<></>}
      rightContent={
        <Button startContent={<Icon icon="humbleicons:logout" width="20" height="20" />} size='sm' color='danger' onClick={e => {
          signOut()
          router.push('/signin')
        }}> {t('logout')}</Button>
      } />

  </Card>
})