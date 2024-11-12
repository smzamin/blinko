import { api } from "@/lib/trpc";
import { RootStore } from "@/store";
import { DialogStore } from "@/store/module/Dialog";
import { PromiseCall } from "@/store/standard/PromiseState";
import { UserStore } from "@/store/user";
import { Icon } from "@iconify/react";
import { Button, Input } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PasswordInput } from "./PasswordInput";

export const UpdateUserInfo = observer(() => {
  const user = RootStore.Get(UserStore)
  const { t } = useTranslation()
  const router = useRouter()
  const store = RootStore.Local(() => ({
    username: '',
    nickname: '',
    originalPassword: ''
  }))
  useEffect(() => {
    store.username = user.name!
    store.nickname = user.nickname!
  }, [user.name, user.nickname])

  return <>
    <Input
      label={t('username')}
      labelPlacement="outside"
      variant="bordered"
      value={store.username}
      onChange={e => { store.username = e.target.value }}
    />
    <Input
      label={t('nickname')}
      variant="bordered"
      labelPlacement="outside"
      value={store.nickname}
      onChange={e => { store.nickname = e.target.value }}
    />
    <PasswordInput
      label={t('original-password')}
      placeholder={t('enter-your-password')}
      value={store.originalPassword}
      onChange={e => { store.originalPassword = e.target.value }}
    />
    <div className="flex w-full mt-2">
      <Button className="ml-auto" color='primary' onClick={async e => {
        await PromiseCall(api.users.upsertUser.mutate({ id: Number(user.id), name: store.username, nickname: store.nickname, originalPassword: store.originalPassword }))
        RootStore.Get(DialogStore).close()
        await signOut()
        router.push('/signin')
      }}>{t('save')}</Button>
    </div>
  </>
})


export const UpdateUserPassword = observer(() => {
  const user = RootStore.Get(UserStore)
  const { t } = useTranslation()
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [originalPassword, setOriginalPassword] = useState("");
  const router = useRouter()
  return <>
    <div className="flex w-full mt-2">
      <PasswordInput className='mb-2' label={t('original-password')} value={originalPassword} onChange={e => setOriginalPassword(e.target.value)} />
      <PasswordInput label={t('password')} value={password} onChange={e => setPassword(e.target.value)} />
      <PasswordInput label={t('confirm-password')} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
      <Button className="ml-auto" color='primary' onClick={async e => {
        await PromiseCall(api.users.upsertUser.mutate({ id: Number(user.id), password }))
        RootStore.Get(DialogStore).close()
        await signOut()
        router.push('/signin')
      }}>{t('save')}</Button>
    </div>
  </>
})