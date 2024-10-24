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

export const UpdateUserInfo = observer(() => {
  const user = RootStore.Get(UserStore)
  const { t } = useTranslation()
  const router = useRouter()
  const store = RootStore.Local(() => ({
    username: '',
    nickname: ''
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
    <div className="flex w-full mt-2">
      <Button className="ml-auto" color='primary' onClick={async e => {
        await PromiseCall(api.users.upsertUser.mutate({ id: Number(user.id), name: store.username, nickname: store.nickname }))
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
  const [password2, setPassword2] = useState("");

  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);
  const router = useRouter()

  return <>
    <Input
      isRequired
      endContent={
        <button type="button" onClick={toggleVisibility}>
          {isVisible ? (
            <Icon
              className="pointer-events-none text-2xl text-default-400"
              icon="solar:eye-closed-linear"
            />
          ) : (
            <Icon
              className="pointer-events-none text-2xl text-default-400"
              icon="solar:eye-bold"
            />
          )}
        </button>
      }
      label={t('password')}
      labelPlacement="outside"
      name="password"
      placeholder={t('enter-your-password')}
      type={isVisible ? "text" : "password"}
      variant="bordered"
      value={password}
      onChange={e => setPassword(e.target.value)}
    />
    <Input
      isRequired
      endContent={
        <button type="button" onClick={toggleConfirmVisibility}>
          {isConfirmVisible ? (
            <Icon
              className="pointer-events-none text-2xl text-default-400"
              icon="solar:eye-closed-linear"
            />
          ) : (
            <Icon
              className="pointer-events-none text-2xl text-default-400"
              icon="solar:eye-bold"
            />
          )}
        </button>
      }
      label={t('confirm-password')}
      labelPlacement="outside"
      name="confirmPassword"
      placeholder={t('confirm-your-password')}
      type={isConfirmVisible ? "text" : "password"}
      variant="bordered"
      value={password2}
      onChange={e => setPassword2(e.target.value)}
    />
    <div className="flex w-full mt-2">
      <Button className="ml-auto" color='primary' onClick={async e => {
        await PromiseCall(api.users.upsertUser.mutate({ id: Number(user.id), password }))
        RootStore.Get(DialogStore).close()
        await signOut()
        router.push('/signin')
      }}>{t('save')}</Button>
    </div>
  </>
})