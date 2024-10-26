import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { observer } from 'mobx-react-lite';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';

const ThemeSwitcher = observer(() => {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Button
      variant="flat"
      isIconOnly
      type="button"
      className="py-2 transition duration-300 ease-in-out cursor-pointer"
      onClick={() => {
        setTheme(theme === 'light' ? 'dark' : 'light');
      }}
    >
      {isMounted && theme === 'dark' ? <Icon icon="line-md:sun-rising-loop" width="24" height="24" /> :<Icon icon="line-md:moon-alt-loop" width="24" height="24" />}
    </Button>
  );
});

export default ThemeSwitcher;
