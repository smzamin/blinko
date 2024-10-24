import { Check, Globe } from 'lucide-react';
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

const LanguageSwitcher = () => {
  const baseStore = RootStore.Get(BaseStore)
  const { i18n } = useTranslation();
  function onSelectChange(nextLocale) {
    baseStore.changeLanugage(i18n, nextLocale)
  }
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="flat" startContent={<Globe size={22} />}>{baseStore.locales.filter(i => i.value == baseStore.locale.value)?.[0]?.label}</Button>
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
              {baseStore.locale.value === locale.value && <Check className='ml-auto' size={18} />}</div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
