import { observer } from "mobx-react-lite";
import { Card, DropdownItem, DropdownMenu, DropdownTrigger, Dropdown, Select, SelectItem, Switch, Button } from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import { Item, ItemWithTooltip, SelectDropdown } from "./Item";
import ThemeSwitcher from "../Common/ThemeSwitcher";
import LanguageSwitcher from "../Common/LanguageSwitcher";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { PromiseCall } from "@/store/standard/PromiseState";
import { api } from "@/lib/trpc";
import { Icon } from "@iconify/react";

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
      leftContent={<ItemWithTooltip content={t('small-device-card-columns')} toolTipContent={<div className="w-[300px] flex flex-col gap-2">
        <div>{t('width-less-than')} 768px</div>
      </div>} />
      }
      rightContent={
        <SelectDropdown
          value={blinko.config.value?.smallDeviceCardColumns}
          placeholder={t('select-a-columns')}
          icon="proicons:phone"
          options={[
            { key: "1", label: "1" },
            { key: "2", label: "2" }
          ]}
          onChange={async (value) => {
            await PromiseCall(api.config.update.mutate({
              key: 'smallDeviceCardColumns',
              value: value
            }))
          }}
        />
      } />

    <Item
      leftContent={<ItemWithTooltip content={t('medium-device-card-columns')} toolTipContent={<div className="w-[300px] flex flex-col gap-2">
        <div>{t('width-less-than-1024px')}</div>
      </div>} />
      }
      rightContent={
        <SelectDropdown
          value={blinko.config.value?.mediumDeviceCardColumns}
          placeholder={t('select-a-columns')}
          icon="tabler:device-ipad"
          options={[
            { key: "1", label: "1" },
            { key: "2", label: "2" },
            { key: "3", label: "3" },
            { key: "4", label: "4" },
          ]}
          onChange={async (value) => {
            await PromiseCall(api.config.update.mutate({
              key: 'mediumDeviceCardColumns',
              value: value
            }))
          }}
        />
      } />

    <Item
      leftContent={<ItemWithTooltip content={t('large-device-card-columns')} toolTipContent={<div className="w-[300px] flex flex-col gap-2">
        <div>{t('width-less-than')}1280px</div>
      </div>} />
      }
      rightContent={
        <SelectDropdown
          value={blinko.config.value?.largeDeviceCardColumns}
          placeholder={t('select-a-columns')}
          icon="ic:outline-tv"
          options={[
            { key: "1", label: "1" },
            { key: "2", label: "2" },
            { key: "3", label: "3" },
            { key: "4", label: "4" },
          ]}
          onChange={async (value) => {
            await PromiseCall(api.config.update.mutate({
              key: 'largeDeviceCardColumns',
              value: value
            }))
          }}
        />
      } />

    <Item
      leftContent={<>{t('time-format')}</>}
      rightContent={
        <SelectDropdown
          value={blinko.config.value?.timeFormat}
          placeholder="Select a time format"
          icon="mingcute:time-line"
          options={[
            { key: "relative", label: "1 seconds ago" },
            { key: "YYYY-MM-DD", label: "2024-01-01" },
            { key: "YYYY-MM-DD HH:mm", label: "2024-01-01 15:30" },
            { key: "HH:mm", label: "15:30" },
            { key: "YYYY-MM-DD HH:mm:ss", label: "2024-01-01 15:30:45" },
            { key: "MM-DD HH:mm", label: "03-20 15:30" },
            { key: "MMM DD, YYYY", label: "Mar 20, 2024" },
            { key: "MMM DD, YYYY HH:mm", label: "Mar 20, 2024 15:30" },
          ]}
          onChange={async (value) => {
            await PromiseCall(api.config.update.mutate({
              key: 'timeFormat',
              value: value
            }))
          }}
        />
      } />
  </Card>
})