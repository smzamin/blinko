import { observer } from "mobx-react-lite";
import { Card, Select, SelectItem, Switch } from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import { Item } from "./Item";
import ThemeSwitcher from "../Common/ThemeSwitcher";
import LanguageSwitcher from "../Common/LanguageSwitcher";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { PromiseCall } from "@/store/standard/PromiseState";
import { api } from "@/lib/trpc";

export const PerferSetting = observer(() => {
  const { t } = useTranslation()
  const blinko = RootStore.Get(BlinkoStore)
  return <Card shadow="none" className="flex flex-col p-4 bg-background">
    <div className='text-desc text-sm'>{t('preference')}</div>
    <Item
      leftContent={<>{t('theme')}</>}
      rightContent={<ThemeSwitcher />} />
    <Item
      leftContent={<>{t('language')}</>}
      rightContent={<LanguageSwitcher />} />
    <Item
      leftContent={<>{t('show-navigation-bar-on-mobile')}</>}
      rightContent={<Switch
        isSelected={blinko.config.value?.isHiddenMobileBar}
        onChange={e => {
          PromiseCall(api.config.update.mutate({
            key: 'isHiddenMobileBar',
            value: e.target.checked
          }))
        }}
      />} />

    <Item
      leftContent={<>{t('order-by-create-time')}</>}
      rightContent={<Switch
        isSelected={blinko.config.value?.isOrderByCreateTime}
        onChange={e => {
          PromiseCall(api.config.update.mutate({
            key: 'isOrderByCreateTime',
            value: e.target.checked
          }))
        }}
      />} />
    <Item
      leftContent={<>{t('time-format')}</>}
      rightContent={
        <div>
          <Select
            onChange={async e => {
              console.log(e.target.value)
              await PromiseCall(api.config.update.mutate({
                key: 'timeFormat',
                value: e.target.value
              }))
            }}
            value={blinko.config.value?.timeFormat}
            size="sm" label={blinko.config.value?.timeFormat ?? 'Select a time format'} className="w-[200px] md:w-[300px]">
            <SelectItem key="relative" value="relative">
              1 seconds ago
            </SelectItem>
            <SelectItem key="YYYY-MM-DD" value="YYYY-MM-DD">
              2024-01-01 {/*  2024-03-20 */}
            </SelectItem>
            <SelectItem key="YYYY-MM-DD HH:mm" value="YYYY-MM-DD HH:mm">
              2024-01-01 15:30 {/*  2024-03-20 15:30 */}
            </SelectItem>
            <SelectItem key="HH:mm" value="HH:mm">
              15:30 {/*  15:30 */}
            </SelectItem>
            <SelectItem key="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss">
              2024-01-01 15:30:45 {/*  2024-03-20 15:30:45 */}
            </SelectItem>
            <SelectItem key="MM-DD HH:mm" value="MM-DD HH:mm">
              03-20 15:30 {/*  03-20 15:30 */}
            </SelectItem>
            <SelectItem key="MMM DD, YYYY" value="MMM DD, YYYY">
              Mar 20, 2024 {/*  Mar 20, 2024 */}
            </SelectItem>
            <SelectItem key="MMM DD, YYYY HH:mm" value="MMM DD, YYYY HH:mm">
              Mar 20, 2024 15:30 {/* Mar 20, 2024 15:30 */}
            </SelectItem>
          </Select>
        </div>
      } />
  </Card>

})