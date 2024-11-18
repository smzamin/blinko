import { observer } from "mobx-react-lite";
import { Button, Card, DropdownItem, DropdownMenu, DropdownTrigger, Dropdown, Input, Select, SelectItem, Switch, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { PromiseCall } from "@/store/standard/PromiseState";
import { Icon } from "@iconify/react";
import { api, streamApi } from "@/lib/trpc";
import { Item } from "./Item";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "usehooks-ts";


export const StorageSetting = observer(() => {
  const isPc = useMediaQuery('(min-width: 768px)')
  const { t } = useTranslation()
  const blinko = RootStore.Get(BlinkoStore)
  return <Card shadow="none" className="flex flex-col p-4 bg-background">
    <div className='text-desc text-sm'>{t('storage')}</div>
    <Item
      type={isPc ? 'row' : 'col'}
      leftContent={<div className="flex flex-col  gap-2">
        <div>{t('object-storage')}</div>
      </div>}
      rightContent={<div>
        <Dropdown>
          <DropdownTrigger>
            <Button startContent={<Icon icon="mdi:storage" width="20" height="20" />} color='primary' >
              {blinko.config.value?.objectStorage ?? t('local-file-system')}
            </Button>
          </DropdownTrigger>
          <DropdownMenu onAction={async (key) => {
            await PromiseCall(api.config.update.mutate({
              key: 'objectStorage',
              value: key.toString()
            }))
          }}>
            <DropdownItem key="local">  {t('local-file-system')}</DropdownItem>
            <DropdownItem key="s3">S3</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>} />

    {
      blinko.config.value?.objectStorage === 's3' && <>
        <Item
          leftContent={<>Access key id</>}
          rightContent={<Input value={blinko.config.value?.s3AccessKeyId} placeholder="Access key id" onBlur={async (e) => {
            await PromiseCall(api.config.update.mutate({
              key: 's3AccessKeyId',
              value: e.target.value
            }))
          }} />} />
        <Item
          leftContent={<>Access key secret</>}
          rightContent={<Input value={blinko.config.value?.s3AccessKeySecret} placeholder="Access key secret" onBlur={async (e) => {
            await PromiseCall(api.config.update.mutate({
              key: 's3AccessKeySecret',
              value: e.target.value
            }))
          }} />} />
        <Item
          leftContent={<>Endpoint</>}
          rightContent={<Input value={blinko.config.value?.s3Endpoint} placeholder="Endpoint" onBlur={async (e) => {
            await PromiseCall(api.config.update.mutate({
              key: 's3Endpoint',
              value: e.target.value
            }))
          }} />} />
        <Item
          leftContent={<>Region</>}
          rightContent={<Input value={blinko.config.value?.s3Region} placeholder="Region" onBlur={async (e) => {
            await PromiseCall(api.config.update.mutate({
              key: 's3Region',
              value: e.target.value
            }))
          }} />} />
        <Item
          leftContent={<>Bucket</>}
          rightContent={<Input value={blinko.config.value?.s3Bucket} placeholder="Bucket" onBlur={async (e) => {
            await PromiseCall(api.config.update.mutate({
              key: 's3Bucket',
              value: e.target.value
            }))
          }} />} />
      </>
    }
  </Card>
})