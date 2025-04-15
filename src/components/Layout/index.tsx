import { BlinkoNotification } from '@/components/BlinkoNotification';
import { BlinkoRightClickMenu } from '@/components/BlinkoRightClickMenu';
import { Icon } from '@/components/Common/Iconify/icons';
import { eventBus } from '@/lib/event';
import { api } from '@/lib/trpc';
import { RootStore } from '@/store';
import { AiStore } from '@/store/aiStore';
import { BaseStore } from '@/store/baseStore';
import { BlinkoStore } from '@/store/blinkoStore';
import { DialogStandaloneStore } from '@/store/module/DialogStandalone';
import { ToastPlugin } from '@/store/module/Toast/Toast';
import { UserStore } from '@/store/user';
import { Badge, Button } from '@heroui/react';
import { observer } from 'mobx-react-lite';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { push as Menu } from 'react-burger-menu';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'usehooks-ts';
import AiWritePop from '../Common/PopoverFloat/aiWritePop';
import FilterPop from '../Common/PopoverFloat/filterPop';
import { ScrollArea } from '../Common/ScrollArea';
import { showTipsDialog } from '../Common/TipsDialog';
import { BarSearchInput } from './BarSearchInput';
import { MobileNavBar } from './MobileNavBar';
import { Sidebar } from './Sidebar';

export const SideBarItem = 'p-2 flex flex-row items-center cursor-pointer gap-2 hover:bg-hover rounded-xl transition-all';

export const CommonLayout = observer(({ children, header }: { children?: React.ReactNode; header?: React.ReactNode }) => {
  const router = useRouter();
  const [isClient, setClient] = useState(false);
  const [isOpen, setisOpen] = useState(false);

  const isPc = useMediaQuery('(min-width: 768px)');
  const { t } = useTranslation();
  const user = RootStore.Get(UserStore);
  const blinkoStore = RootStore.Get(BlinkoStore);
  const base = RootStore.Get(BaseStore);

  blinkoStore.use();
  user.use();
  base.useInitApp(router);

  useEffect(() => {
    if (isPc) setisOpen(false);
  }, [isPc]);

  useEffect(() => {
    setClient(true);
    eventBus.on('close-sidebar', () => {
      setisOpen(false);
    });
  }, []);

  if (!isClient) return <></>;

  if (
    router.pathname == '/signin' ||
    router.pathname == '/signup' ||
    router.pathname == '/api-doc' ||
    router.pathname.includes('/share') ||
    router.pathname == '/editor' ||
    router.pathname == '/oauth-callback'
  ) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full h-mobile-full overflow-x-hidden" id="outer-container">
      <AiWritePop />

      <Menu disableAutoFocus onClose={() => setisOpen(false)} onOpen={setisOpen} isOpen={isOpen} pageWrapId={'page-wrap'} outerContainerId={'outer-container'}>
        <Sidebar onItemClick={() => setisOpen(false)} />
      </Menu>

      {isPc && <Sidebar />}

      <main
        id="page-wrap"
        style={{ width: isPc ? `calc(100% - ${base.sideBarWidth}px)` : '100%' }}
        className={`flex transition-all duration-300 overflow-y-hidden w-full flex-col gap-y-1 bg-sencondbackground`}
      >
        {/* nav bar  */}
        <header className="relative flex md:h-16 md:min-h-16 h-14 min-h-14 items-center justify-between gap-2 rounded-medium px-2 md:px:4 pt-2 md:pb-2 overflow-hidden">
          <div className="hidden md:block absolute bottom-[20%] right-[5%] z-[0] h-[350px] w-[350px] overflow-hidden blur-3xl ">
            <div className="w-full h-[100%] bg-[#9936e6] opacity-20" style={{ clipPath: 'circle(50% at 50% 50%)' }} />
          </div>
          <div className="flex max-w-full items-center gap-2 md:p-2 w-full z-[1]">
            {!isPc && (
              <Button isIconOnly className="flex" size="sm" variant="light" onPress={() => setisOpen(!isOpen)}>
                <Icon className="text-default-500" height={24} icon="solar:hamburger-menu-outline" width={24} />
              </Button>
            )}
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-[4px] h-[16px] bg-primary rounded-xl" />
                <div className="flex flex-row items-center gap-1">
                  <div className="font-black select-none">
                    {router.asPath == '/ai'
                      ? !!RootStore.Get(AiStore).currentConversation.value?.title
                        ? RootStore.Get(AiStore).currentConversation.value?.title
                        : t(base.currentTitle)
                      : t(base.currentTitle)}
                  </div>
                  {router.query?.path != 'trash' ? (
                    <Icon
                      className="cursor-pointer hover:rotate-180 transition-all"
                      onClick={() => {
                        blinkoStore.refreshData();
                        blinkoStore.updateTicker++;
                      }}
                      icon="fluent:arrow-sync-12-filled"
                      width="20"
                      height="20"
                    />
                  ) : (
                    <Icon
                      className="cursor-pointer transition-all text-red-500"
                      onClick={() => {
                        showTipsDialog({
                          size: 'sm',
                          title: t('confirm-to-delete'),
                          content: t('this-operation-removes-the-associated-label-and-cannot-be-restored-please-confirm'),
                          onConfirm: async () => {
                            await RootStore.Get(ToastPlugin).promise(api.notes.clearRecycleBin.mutate(), {
                              loading: t('in-progress'),
                              success: <b>{t('your-changes-have-been-saved')}</b>,
                              error: <b>{t('operation-failed')}</b>,
                            });
                            blinkoStore.refreshData();
                            RootStore.Get(DialogStandaloneStore).close();
                          },
                        });
                      }}
                      icon="mingcute:delete-2-line"
                      width="20"
                      height="20"
                    />
                  )}
                </div>
                {!base.isOnline && (
                  <Badge color="warning" variant="flat" className="animate-pulse">
                    <div className="flex text-sm items-center gap-1 text-yellow-500">
                      <span>{t('offline-status')}</span>
                    </div>
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 md:gap-4 w-auto ">
                <BarSearchInput isPc={isPc} />
                <FilterPop />
                {!blinkoStore.config.value?.isCloseDailyReview && <Badge size="sm" className="shrink-0" content={blinkoStore.dailyReviewNoteList.value?.length} color="warning">
                  <Link href="/review" passHref legacyBehavior>
                    <Button
                      as="a"
                      className="mt-[2px]"
                      isIconOnly
                      size="sm"
                      variant="light"
                    >
                      <Icon className="cursor-pointer" icon="tabler:bulb" width="24" height="24" />
                    </Button>
                  </Link>
                </Badge>}
                <BlinkoNotification />
              </div>
            </div>
          </div>
          {header}
        </header>
        {/* backdrop  pt-6 -mt-6 to fix the editor tooltip position */}

        <ScrollArea onBottom={() => { }} className="h-[calc(100%_-_70px)] !overflow-y-auto overflow-x-hidden mt-[-4px]">
          <div className="relative flex h-full w-full flex-col rounded-medium layout-container">
            <div className="hidden md:block absolute top-[-37%] right-[5%] z-[0] h-[350px] w-[350px] overflow-hidden blur-3xl ">
              <div className="w-full h-[356px] bg-[#9936e6] opacity-20" style={{ clipPath: 'circle(50% at 50% 50%)' }} />
            </div>
            {children}
          </div>
        </ScrollArea>

        <MobileNavBar onItemClick={() => setisOpen(false)} />
        <BlinkoRightClickMenu />
      </main>
    </div>
  );
});
