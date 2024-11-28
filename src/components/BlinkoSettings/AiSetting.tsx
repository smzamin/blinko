import { observer } from "mobx-react-lite";
import { Autocomplete, AutocompleteItem, Button, Card, Code, Input, Select, SelectItem, Switch, Tooltip } from "@nextui-org/react";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { PromiseCall } from "@/store/standard/PromiseState";
import { Icon } from "@iconify/react";
import { api } from "@/lib/trpc";
import { AiStore } from "@/store/aiStore";
import { useTranslation } from "react-i18next";
import { Item, ItemWithTooltip } from "./Item";
import { useEffect } from "react";
import { useMediaQuery } from "usehooks-ts";
import { ShowRebuildEmbeddingProgressDialog } from "../Common/RebuildEmbeddingProgress";
import { showTipsDialog } from "../Common/TipsDialog";

export const AiSetting = observer(() => {
  const blinko = RootStore.Get(BlinkoStore)
  const ai = RootStore.Get(AiStore)
  const { t } = useTranslation()
  const isPc = useMediaQuery('(min-width: 768px)')
  const store = RootStore.Local(() => ({
    isVisible: false,
    apiKey: '',
    apiEndPoint: '',
    aiModel: '',
    embeddingModel: ''
  }))
  useEffect(() => {
    store.apiEndPoint = blinko.config.value?.aiApiEndpoint!
    store.apiKey = blinko.config.value?.aiApiKey!
    store.aiModel = blinko.config.value?.aiModel!
    store.embeddingModel = blinko.config.value?.embeddingModel!
  }, [blinko.config.value])
  return <Card shadow="none" className="flex flex-col p-4 bg-background pb-6">
    <div className='text-desc text-sm'>AI</div>
    <Item
      leftContent={<div className="flex items-center gap-2">
        {t('use-ai')}
        <Tooltip content={<div className="w-[300px] flex flex-col gap-2">
          <div>{t('in-addition-to-the-gpt-model-there-is-a-need-to-ensure-that-it-is-possible-to-invoke-the')}<Code color="primary">text-embedding</Code></div>
          <div>{t('speech-recognition-requires-the-use-of')}<Code color="primary">whisper</Code></div>
        </div>}>
          <Icon icon="proicons:info" width="18" height="18" />
        </Tooltip>
      </div>}
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
          radius="lg"
          selectedKeys={[blinko.config.value?.aiModelProvider!]}
          onSelectionChange={key => {
            const value = Array.from(key)[0] as string
            blinko.config.value!.aiModelProvider = value as any
            PromiseCall(api.config.update.mutate({
              key: 'aiModelProvider',
              value: value
            }))
          }}
          size="sm"
          className="w-[200px]"
          label="Select Model Provider"
        >
          {ai.modelProviderSelect.map((item) => (
            <SelectItem key={item.value ?? ''} value={item.value} startContent={item.icon}>
              {item.label}
            </SelectItem>
          ))}
        </Select>} />

    {
      ai.modelSelect[blinko.config.value?.aiModelProvider!] && <Item
        leftContent={<>{t('ai-model')}</>}
        rightContent={
          <Autocomplete
            radius="lg"
            allowsCustomValue={true}
            selectedKey={store.aiModel ?? ''}
            inputValue={store.aiModel ?? ''}
            onInputChange={e => {
              store.aiModel = e
            }}
            onBlur={e => {
              PromiseCall(api.config.update.mutate({
                key: 'aiModel',
                value: store.aiModel
              }))
            }}
            onSelectionChange={(key) => {
              store.aiModel = key as string
            }}
            size="sm"
            className="w-[200px]"
            label="Select Model"
          >
            {ai.modelSelect[blinko.config.value?.aiModelProvider!]!.map((item) => (
              <AutocompleteItem key={item.value} value={item.value}>
                {item.label}
              </AutocompleteItem>
            ))}
          </Autocomplete>
        } />
    }

    {ai.embeddingSelect[blinko.config.value?.aiModelProvider!] && (
      <Item
        type={isPc ? 'row' : 'col'}
        leftContent={<ItemWithTooltip
          content={<>{t('embedding-model')}</>} toolTipContent={<div className="w-[300px] flex flex-col gap-2">
            <div>{t('embedding-model-description')}</div>
          </div>} />}
        rightContent={
          <div className="flex w-full ml-auto justify-start">
            <Autocomplete
              radius="lg"
              allowsCustomValue={true}
              inputValue={store.embeddingModel ?? ''}
              selectedKey={store.embeddingModel ?? ''}
              onInputChange={e => {
                store.embeddingModel = e
              }}
              onBlur={e => {
                PromiseCall(api.config.update.mutate({
                  key: 'embeddingModel',
                  value: store.embeddingModel
                }))
              }}
              onSelectionChange={(key) => {
                store.embeddingModel = key as string
              }}
              size="sm"
              className={`${isPc ? 'w-[250px]' : 'w-full'}`}
              label="Embedding Model"
            >
              {ai.embeddingSelect[blinko.config.value?.aiModelProvider!]!.map((item) => (
                <AutocompleteItem key={item.value} value={item.value}>
                  {item.label}
                </AutocompleteItem>
              ))}
            </Autocomplete>
          </div>
        } />
    )}

    {
      blinko.config.value?.aiModelProvider != 'Ollama' &&
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
    }

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

    <Item
      type={isPc ? 'row' : 'col'}
      leftContent={<div className="flex flex-col  gap-2">
        <div>{t('rebuild-embedding-index')}</div>
        <div className="text-desc text-xs">{t('notes-imported-by-other-means-may-not-have-embedded-vectors')}</div>
      </div>}
      rightContent={
        <div className="flex w-full ml-auto justify-end gap-2">
          <Button color='danger' startContent={<Icon icon="mingcute:refresh-4-ai-line" width="20" height="20" />} onClick={() => {
            showTipsDialog({
              title: t('force-rebuild-embedding-index'),
              content: t('if-you-have-a-lot-of-notes-you-may-consume-a-certain-number-of-tokens'),
              onConfirm: () => {
                ShowRebuildEmbeddingProgressDialog(true)
              }
            })
          }}>{t('force-rebuild')}</Button>
          <Button color='primary' startContent={<Icon icon="mingcute:refresh-4-ai-line" width="20" height="20" />} onClick={() => {
            showTipsDialog({
              title: t('rebuild-embedding-index'),
              content: t('if-you-have-a-lot-of-notes-you-may-consume-a-certain-number-of-tokens'),
              onConfirm: () => {
                ShowRebuildEmbeddingProgressDialog()
              }
            })
          }}>{t('rebuild')}</Button>
        </div>
      } />

  </Card>
})