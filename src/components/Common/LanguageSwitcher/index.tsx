import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@nextui-org/dropdown";
import { Button } from '@nextui-org/react';
import { RootStore } from '@/store';
import { BaseStore } from '@/store/baseStore';
import { useTranslation } from 'react-i18next';
import { Icon } from "@iconify/react";

const LanguageSwitcher = () => {
  const baseStore = RootStore.Get(BaseStore)
  const { i18n } = useTranslation();
  function onSelectChange(nextLocale) {
    baseStore.changeLanugage(i18n, nextLocale)
  }
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="flat" startContent={<Icon icon="hugeicons:global" width="24" height="24" />}>{baseStore.locales.filter(i => i.value == baseStore.locale.value)?.[0]?.label}</Button>
      </DropdownTrigger>

      <DropdownMenu className="p-2 space-y-1">
        {baseStore.locales.map((locale) => (
          <DropdownItem
            key={locale.value}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => {
              onSelectChange(locale.value);
            }}
          >
            <div className='flex'> {locale.label}
              {baseStore.locale.value === locale.value && <Icon icon="mingcute:check-fill" width="18" height="18" />}</div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
