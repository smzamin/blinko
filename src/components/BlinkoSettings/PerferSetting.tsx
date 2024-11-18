import { observer } from "mobx-react-lite";
import { Card, DropdownItem, DropdownMenu, DropdownTrigger, Dropdown, Select, SelectItem, Switch, Button } from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import { Item } from "./Item";
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
      leftContent={<>{t('time-format')}</>}
      rightContent={
        <div>
          <Dropdown>
            <DropdownTrigger>
              <Button
                startContent={<Icon icon="mingcute:time-line" width="20" height="20" />}
                color="primary"
              >
                {blinko.config.value?.timeFormat ?? 'Select a time format'}
              </Button>
            </DropdownTrigger>  
            <DropdownMenu
              aria-label="Time format selection"
              onAction={async (key) => {
                console.log(key)
                await PromiseCall(api.config.update.mutate({
                  key: 'timeFormat',
                  value: key.toString()
                }))
              }}
              selectedKeys={[blinko.config.value?.timeFormat || '']}
            >
              <DropdownItem key="relative">1 seconds ago</DropdownItem>
              <DropdownItem key="YYYY-MM-DD">2024-01-01</DropdownItem>
              <DropdownItem key="YYYY-MM-DD HH:mm">2024-01-01 15:30</DropdownItem>
              <DropdownItem key="HH:mm">15:30</DropdownItem>
              <DropdownItem key="YYYY-MM-DD HH:mm:ss">2024-01-01 15:30:45</DropdownItem>
              <DropdownItem key="MM-DD HH:mm">03-20 15:30</DropdownItem>
              <DropdownItem key="MMM DD, YYYY">Mar 20, 2024</DropdownItem>
              <DropdownItem key="MMM DD, YYYY HH:mm">Mar 20, 2024 15:30</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      } />
  </Card>

})