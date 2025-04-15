import { Icon } from '@/components/Common/Iconify/icons';
import { RootStore } from '@/store';
import { BaseStore } from '@/store/baseStore';
import { BlinkoStore } from '@/store/blinkoStore';
import { UserStore } from '@/store/user';
import { Button, ScrollShadow } from '@heroui/react';
import { observer } from 'mobx-react-lite';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'usehooks-ts';
import { TagListPanel } from '../Common/TagListPanel';
import { UserAvatarDropdown } from '../Common/UserAvatarDropdown';
import { SideBarItem } from './index';

interface SidebarProps {
  onItemClick?: () => void;
}

export const Sidebar = observer(({ onItemClick }: SidebarProps) => {
  const router = useRouter();
  const isPc = useMediaQuery('(min-width: 768px)');
  const { theme } = useTheme();
  const { t } = useTranslation();
  const base = RootStore.Get(BaseStore);
  const blinkoStore = RootStore.Get(BlinkoStore);
  const user = RootStore.Get(UserStore);

  useEffect(() => {
    console.log('router.query', router);
    if (!isPc) {
      base.collapseSidebar();
    }
  }, [isPc]);

  return (
    <div
      style={{ width: isPc ? `${base.sideBarWidth}px` : '100%' }}
      className={`flex h-full flex-1 flex-col p-4 relative bg-background
        ${!base.isDragging ? 'transition-all duration-300' : 'transition-none'}
        group/sidebar`}
    >
      {!base.isSidebarCollapsed && (
        <div
          className={`absolute right-0 top-0 h-full w-2 cursor-col-resize
            hover:bg-primary/20 active:bg-primary/40 z-50
            ${base.isResizing ? 'bg-primary/40' : ''}`}
          onMouseDown={base.startResizing}
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: 'none' }}
        />
      )}

      <div className={`flex items-center ${base.isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex w-full ${base.isSidebarCollapsed ? 'flex-col-reverse gap-2 justify-center items-center mr-2 mb-2' : 'items-center '}`}>
          {/* Mobile: Display avatar dropdown at the top */}
          <div className={`${base.isSidebarCollapsed ? 'w-full flex justify-center' : ''}`}>
            <UserAvatarDropdown onItemClick={onItemClick} collapsed={base.isSidebarCollapsed} />
          </div>

          {/* Toggle sidebar button for PC */}
          {isPc && (
            <Button
              isIconOnly
              variant="light"
              className={`opacity-0 group-hover/sidebar:opacity-100 ml-auto ${!base.isSidebarCollapsed ? 'group-hover/sidebar:-translate-x-1 ' : 'opacity-100 translate-x-0'}`}
              onPress={base.toggleSidebar}
            >
              <Icon icon={base.isSidebarCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-left'} width="20" height="20" />
            </Button>
          )}
        </div>
      </div>

      <ScrollShadow className="-mr-[16px] mt-[-5px] h-full max-h-full pr-6 hide-scrollbar">
        <div className={`flex flex-col gap-2 mt-4 font-semibold ${base.isSidebarCollapsed ? 'items-center gap-4' : ''}`}>
          {base.routerList
            .filter((i) => !i.hiddenSidebar)
            .map((i) => (
              <Link
                key={i.title}
                href={i.href}
                shallow={i.shallow}
                onClick={() => {
                  base.currentRouter = i;
                  onItemClick?.();
                }}
              >
                <div className={`flex items-center gap-2 group ${SideBarItem} ${base.isSideBarActive(router, i) ? '!bg-primary  !text-primary-foreground' : ''}`}>
                  <Icon className={`${base.isSidebarCollapsed ? 'mx-auto' : ''}`} icon={i.icon} width="20" height="20" />
                  {!base.isSidebarCollapsed && <span className="transition-all">{t(i.title)}</span>}
                </div>
              </Link>
            ))}
          {!base.isSidebarCollapsed && blinkoStore.tagList.value?.listTags.length != 0 && blinkoStore.tagList.value?.listTags && <TagListPanel />}
        </div>
      </ScrollShadow>

      {/* ***** background *****  */}
      <div className="halation absolute inset-0 h-[250px] w-[250px] overflow-hidden blur-3xl z-[0] pointer-events-none">
        <div className="w-full h-[100%] bg-[#ffc65c] opacity-20" style={{ clipPath: 'circle(35% at 50% 50%)' }} />
      </div>
    </div>
  );
});
