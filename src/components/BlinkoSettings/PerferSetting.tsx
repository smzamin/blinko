import { observer } from "mobx-react-lite";
import { Card, Switch } from "@nextui-org/react";
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
  </Card>

})