import { observer } from "mobx-react-lite";
import { Button, Card, Select, SelectItem, Switch, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { PromiseCall } from "@/store/standard/PromiseState";
import { helper } from "@/lib/helper";
import dayjs from "@/lib/dayjs";
import { Icon } from "@iconify/react";
import { api } from "@/lib/trpc";
import { Item } from "./Item";
import { useTranslation } from "react-i18next";
import { UploadFileWrapper } from "../Common/UploadFile";
import { ToastPlugin } from "@/store/module/Toast/Toast";


export const ImportSetting = observer(() => {
  const blinko = RootStore.Get(BlinkoStore)
  const { t } = useTranslation()
  return <Card shadow="none" className="flex flex-col p-4 bg-background">
    <div className='text-desc text-sm'>{t('import')}</div>
    <Item
      leftContent={<>{t('impoort-from-bko')}</>}
      rightContent={<>
        <UploadFileWrapper onUpload={async ({ filePath, fileName }) => {
          if (!fileName.endsWith('.bko')) {
            return RootStore.Get(ToastPlugin).error(t('not-a-bko-file'))
          }
          PromiseCall(api.task.restoreDB.query({ fileName }))
        }}>
        </UploadFileWrapper>
      </>} />
  </Card>
})