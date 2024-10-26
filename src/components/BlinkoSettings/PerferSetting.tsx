import { observer } from "mobx-react-lite";
import { Card } from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import { Item } from "./Item";
import ThemeSwitcher from "../Common/ThemeSwitcher";
import LanguageSwitcher from "../Common/LanguageSwitcher";

export const PerferSetting = observer(() => {
  const { t } = useTranslation()
  return <Card shadow="none" className="flex flex-col p-4 bg-background">
    <div className='text-desc text-sm'>{t('preference')}</div>
    <Item
      leftContent={<>{t('theme')}</>}
      rightContent={<ThemeSwitcher />} />
    <Item
      leftContent={<>{t('language')}</>}
      rightContent={<LanguageSwitcher />} />
  </Card>

})