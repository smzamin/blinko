import LanguageSwitcher from "@/components/Common/LanguageSwitcher";
import ThemeSwitcher from "@/components/Common/ThemeSwitcher";
import { UpdateUserInfo, UpdateUserPassword } from "@/components/Common/UpdateUserInfo";
import { api } from "@/lib/trpc";
import { RootStore } from "@/store";
import { AiStore } from "@/store/aiStore";
import { BlinkoStore } from "@/store/blinkoStore";
import { DialogStore } from "@/store/module/Dialog";
import { PromiseCall } from "@/store/standard/PromiseState";
import { UserStore } from "@/store/user";
import { Icon } from "@iconify/react";
import { Button, Card, Input, Select, SelectItem, Switch } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";


const Item = observer(({ leftContent, rightContent }: any) => {
  return <div className="flex items-center py-2">
    <div className="font-bold">{leftContent}</div>
    <div className="ml-auto">{rightContent}</div>
  </div>
})

const Page = observer(() => {
  const user = RootStore.Get(UserStore)
  const blinko = RootStore.Get(BlinkoStore)
  const ai = RootStore.Get(AiStore)
  const { t } = useTranslation()
  const router = useRouter()
  const store = RootStore.Local(() => ({
    isVisible: false,
    apiKey: '',
    apiEndPoint: '',
  }))

  useEffect(() => {
    store.apiEndPoint = blinko.config.value?.aiApiEndpoint
    store.apiKey = blinko.config.value?.aiApiKey
  }, [blinko.config.value])


  return <>
    <div className="px-2 md:px-6 pt-2 flex flex-col gap-8">
      <Card shadow="none" className="flex flex-col p-4 bg-background">
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

      <Card shadow="none" className="flex flex-col p-4 bg-background">
        <div className='text-desc text-sm'>AI</div>
        <Item
          leftContent={<>{t('use-ai')}</>}
          rightContent={<Switch
            isSelected={blinko.config.value?.isUseAI}
            onChange={e => {
              PromiseCall(api.config.update.mutate({
                key: 'isUseAI',
                value: e.target.checked
              }))
            }}
          // defaultSelected={blinko.config.value?.isUseAI}
          />} />
        <Item
          leftContent={<>{t('model-provider')}</>}
          rightContent={
            <Select
              selectedKeys={[blinko.config.value?.aiModelProvider!]}
              onChange={e => {
                blinko.config.value!.aiModelProvider = e.target.value
                PromiseCall(api.config.update.mutate({
                  key: 'aiModelProvider',
                  value: e.target.value
                }))
              }}
              size="sm"
              className="w-[200px]"
              label="Select Model Provider"
            >
              {ai.modelProviderSelect.map((item) => (
                <SelectItem key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>} />

        <Item
          leftContent={<>{t('ai-model')}</>}
          rightContent={
            <Select
              selectedKeys={[blinko.config.value?.aiModel!]}
              onChange={e => {
                blinko.config.value!.aiModel = e.target.value
                PromiseCall(api.config.update.mutate({
                  key: 'aiModel',
                  value: e.target.value
                }))
              }}
              size="sm"
              className="w-[200px]"
              label="Select Model"
            >
              {ai.modelSelect.map((item) => (
                <SelectItem key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>} />

        <Item
          leftContent={<div className="flex flex-col ga-1">
            <div>API Key</div>
            <div className="text-desc text-xs">{t('user-custom-openai-api-key')}</div>
          </div>}
          rightContent={
            <Input
              size='sm'
              label="API key"
              variant="bordered"
              className="w-[300px]"
              placeholder="Enter your api key"
              value={store.apiKey}
              onChange={e => { store.apiKey = e.target.value }}
              onBlur={e => {
                PromiseCall(api.config.update.mutate({
                  key: 'aiApiKey',
                  value: store.apiKey
                }))
              }}
              endContent={
                <button className="focus:outline-none" type="button" onClick={e => store.isVisible = !store.isVisible} aria-label="toggle password visibility">
                  {store.isVisible ? (
                    <Icon icon="mdi:eye-off" width="20" height="20" />
                  ) : (
                    <Icon icon="mdi:eye" width="20" height="20" />
                  )}
                </button>
              }
              type={store.isVisible ? "text" : "password"}
            />
          } />
        <Item
          leftContent={<div className="flex flex-col ga-1">
            <>{t('api-endpoint')}</>
            <div className="text-desc text-xs">{t('must-start-with-http-s-or-use-api-openai-as-default')}</div>
          </div>}
          rightContent={<Input
            size='sm'
            label={t('api-endpoint')}
            variant="bordered"
            className="w-[300px]"
            placeholder="https://api.openapi.com"
            value={store.apiEndPoint}
            onChange={e => { store.apiEndPoint = e.target.value }}
            onBlur={e => {
              PromiseCall(api.config.update.mutate({
                key: 'aiApiEndpoint',
                value: store.apiEndPoint
              }))
            }}
          />} />

      </Card>


      <Card shadow="none" className="flex flex-col p-4 bg-background">
        <div className='text-desc text-sm'>{t('preference')}</div>
        <Item
          leftContent={<>{t('theme')}</>}
          rightContent={<ThemeSwitcher />} />
        <Item
          leftContent={<>{t('language')}</>}
          rightContent={<LanguageSwitcher />} />
      </Card>

      <Button onClick={e => {
        api.task.createDBackupTask.query()
      }}>Test Cron</Button>

      <Button onClick={e => {
        api.task.importDB.query()
      }}>Import db</Button>
    </div>
  </>
});

export default Page