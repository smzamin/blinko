import { observer } from "mobx-react-lite";
import { Card, Input, Select, SelectItem, Switch } from "@nextui-org/react";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { PromiseCall } from "@/store/standard/PromiseState";
import { Icon } from "@iconify/react";
import { api } from "@/lib/trpc";
import { UserStore } from "@/store/user";
import { AiStore } from "@/store/aiStore";
import { useTranslation } from "react-i18next";
import { Item } from "./Item";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMediaQuery } from "usehooks-ts";

export const AiSetting = observer(() => {
  const blinko = RootStore.Get(BlinkoStore)
  const ai = RootStore.Get(AiStore)
  const { t } = useTranslation()
  const isPc = useMediaQuery('(min-width: 768px)')
  const store = RootStore.Local(() => ({
    isVisible: false,
    apiKey: '',
    apiEndPoint: '',
  }))
  useEffect(() => {
    store.apiEndPoint = blinko.config.value?.aiApiEndpoint
    store.apiKey = blinko.config.value?.aiApiKey
  }, [blinko.config.value])
  return <Card shadow="none" className="flex flex-col p-4 bg-background pb-6">
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
      type={isPc ? 'row' : 'col'}
      leftContent={<div className="flex flex-col ga-1">
        <div>API Key</div>
        <div className="text-desc text-xs">{t('user-custom-openai-api-key')}</div>
      </div>}
      rightContent={
        <Input
          size='sm'
          label="API key"
          variant="bordered"
          className="w-full md:w-[300px]"
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
      type={isPc ? 'row' : 'col'}
      leftContent={<div className="flex flex-col gap-1">
        <>{t('api-endpoint')}</>
        <div className="text-desc text-xs">{t('must-start-with-http-s-or-use-api-openai-as-default')}</div>
      </div>}
      rightContent={<Input
        size='sm'
        label={t('api-endpoint')}
        variant="bordered"
        className="w-full md:w-[300px]"
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
})