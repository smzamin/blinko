import { observer } from "mobx-react-lite";
import { Card, Select, SelectItem, Switch, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { PromiseCall } from "@/store/standard/PromiseState";
import { helper } from "@/lib/helper";
import dayjs from "@/lib/dayjs";
import { Icon } from "@iconify/react";
import { api } from "@/lib/trpc";
import { Item } from "./Item";
import { useTranslation } from "react-i18next";

export const TaskSetting = observer(() => {
  const blinko = RootStore.Get(BlinkoStore)
  const { t } = useTranslation()
  return <Card shadow="none" className="flex flex-col p-4 bg-background">
    <div className='text-desc text-sm'>{t('schedule-task')}</div>
    <Item
      leftContent={<>{t('schedule-back-up')}</>}
      rightContent={
        <Switch
          thumbIcon={blinko.updateTask.loading.value ? <Icon icon="eos-icons:three-dots-loading" width="24" height="24" /> : null}
          isDisabled={blinko.updateTask.loading.value}
          isSelected={blinko.DBTask?.isRunning}
          onChange={async e => {
            await blinko.updateTask.call(e.target.checked)
          }}
        />} />
    <DBBackPanel />
  </Card>

})

const DBBackPanel = observer(() => {
  const { t } = useTranslation()
  const blinko = RootStore.Get(BlinkoStore)
  return <> {blinko.DBTask && <Table shadow="none">
    <TableHeader>
      <TableColumn>{t('name-db')}</TableColumn>
      <TableColumn>{t('schedule')}</TableColumn>
      <TableColumn>{t('last-run')}</TableColumn>
      <TableColumn>{t('backup-file')}</TableColumn>
      <TableColumn>{t('status')}</TableColumn>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>{blinko.DBTask?.name}</TableCell>
        <TableCell>
          <Select
            selectedKeys={[blinko.DBTask?.schedule]}
            onChange={async e => {
              await PromiseCall(api.task.updataDBackupTime.mutate({
                time: e.target.value
              }))
              blinko.task.call()
            }}
            size="sm"
            className="w-[200px]"
          >
            {helper.cron.cornTimeList.map((item) => (
              <SelectItem key={item.value}>
                {t(item.label)}
              </SelectItem>
            ))}
          </Select>
        </TableCell>
        <TableCell>{dayjs(blinko.DBTask?.lastRun).fromNow()}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {/* @ts-ignore  */}
            {blinko.DBTask?.output?.filePath}
            {/* @ts-ignore  */}
            <Icon className='cursor-pointer' onClick={e => helper.download.downloadByLink(blinko.DBTask?.output?.apiPath)} className="cursor-pointer" icon="tabler:download" width="24" height="24" />
          </div>
        </TableCell>
        <TableCell>
          <div className={`${blinko.DBTask?.isRunning ? 'text-green-500' : 'text-red-500'} flex items-center`}>
            <Icon icon="bi:dot" width="24" height="24" />
            <div>{blinko.DBTask?.isRunning ? t('running') : t('stopped')}</div>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
  } </>
})